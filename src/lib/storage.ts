import path from "node:path";
import { promises as fsp } from "node:fs";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { ServiceError } from "./errors";

const PRIVATE_PREFIXES = ["course-files/", "proofs/", "replies/"] as const;
const LEGACY_PREFIX = "/uploads/";
const DEFAULT_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 3600;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export type PrivateStorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  roleArn: string | null;
  endpoint: string | null;
  forcePathStyle: boolean;
  signedUrlTtlSeconds: number;
};

let cachedClient: { signature: string; client: S3Client } | null = null;

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readPrivateStorageConfig(
  env: Record<string, string | undefined> = process.env,
): PrivateStorageConfig | null {
  const bucket = nonEmpty(env.S3_BUCKET);
  const region = nonEmpty(env.S3_REGION);
  const accessKeyId = nonEmpty(env.S3_ACCESS_KEY_ID);
  const secretAccessKey = nonEmpty(env.S3_SECRET_ACCESS_KEY);
  const roleArn = nonEmpty(env.S3_ROLE_ARN) ?? nonEmpty(env.AWS_ROLE_ARN);
  if (!bucket || !region) return null;
  if (!roleArn && (!accessKeyId || !secretAccessKey)) return null;
  if (!roleArn && (accessKeyId && !secretAccessKey)) return null;

  const configuredTtl = Number(env.S3_SIGNED_URL_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  const signedUrlTtlSeconds =
    Number.isInteger(configuredTtl) && configuredTtl >= 30 && configuredTtl <= MAX_TTL_SECONDS
      ? configuredTtl
      : DEFAULT_TTL_SECONDS;

  return {
    bucket,
    region,
    accessKeyId: roleArn ? null : accessKeyId,
    secretAccessKey: roleArn ? null : secretAccessKey,
    roleArn,
    endpoint: nonEmpty(env.S3_ENDPOINT),
    forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
    signedUrlTtlSeconds,
  };
}

export function requirePrivateStorageConfig(): PrivateStorageConfig {
  const config = readPrivateStorageConfig();
  if (!config) {
    throw new ServiceError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "خدمة تخزين الملفات غير مهيأة. تواصل مع الإدارة.",
    );
  }
  return config;
}

function clientFor(config: PrivateStorageConfig): S3Client {
  const signature = [
    config.bucket,
    config.region,
    config.endpoint ?? "",
    config.forcePathStyle ? "1" : "0",
    config.accessKeyId ?? "",
    config.secretAccessKey ?? "",
    config.roleArn ?? "",
  ].join("|");

  if (!cachedClient || cachedClient.signature !== signature) {
    cachedClient = {
      signature,
      client: new S3Client({
        region: config.region,
        endpoint: config.endpoint ?? undefined,
        forcePathStyle: config.forcePathStyle,
        credentials: config.roleArn
          ? awsCredentialsProvider({ roleArn: config.roleArn })
          : {
              accessKeyId: config.accessKeyId!,
              secretAccessKey: config.secretAccessKey!,
            },
      }),
    };
  }

  return cachedClient.client;
}

function badStorageKey(): ServiceError {
  return new ServiceError(400, "BAD_STORAGE_KEY", "مفتاح تخزين غير صالح");
}

export function assertPrivateObjectKey(key: string): string {
  if (!key || key.length > 512 || key.startsWith("/") || key.includes("\\")) {
    throw badStorageKey();
  }

  const segments = key.split("/");
  const prefix = `${segments[0]}/`;
  if (!PRIVATE_PREFIXES.some((allowed) => allowed === prefix)) throw badStorageKey();
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\u0000-\u001f\u007f]/.test(segment),
    )
  ) {
    throw badStorageKey();
  }

  return key;
}

export function isLegacyUploadKey(key: string): boolean {
  if (!key.startsWith(LEGACY_PREFIX) || key.includes("\\")) return false;
  return !key
    .slice(LEGACY_PREFIX.length)
    .split("/")
    .some((segment) => !segment || segment === "." || segment === "..");
}

function legacyAbsolutePath(key: string): string {
  if (!isLegacyUploadKey(key)) throw badStorageKey();
  const root = path.join(process.cwd(), "public");
  const abs = path.normalize(path.join(root, key));
  if (!abs.startsWith(root + path.sep)) throw badStorageKey();
  return abs;
}

export async function readLegacyUpload(key: string): Promise<Buffer> {
  try {
    return await fsp.readFile(legacyAbsolutePath(key));
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(404, "FILE_NOT_UPLOADED", "الملف غير موجود في التخزين");
  }
}

export async function deleteLegacyUpload(key: string): Promise<void> {
  try {
    await fsp.unlink(legacyAbsolutePath(key));
  } catch (error) {
    if (error instanceof ServiceError) throw error;
  }
}

export function contentTypeForKey(key: string, fallback = "application/octet-stream"): string {
  const ext = path.extname(key).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] ?? fallback;
}

export async function putPrivateObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const safeKey = assertPrivateObjectKey(key);
  const config = requirePrivateStorageConfig();

  try {
    await clientFor(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: safeKey,
        Body: body,
        ContentType: contentType || "application/octet-stream",
        CacheControl: "private, no-store",
      }),
    );
  } catch {
    throw new ServiceError(502, "STORAGE_UPLOAD_FAILED", "تعذر رفع الملف إلى التخزين");
  }

  return safeKey;
}

export async function deletePrivateObject(key: string): Promise<void> {
  const safeKey = assertPrivateObjectKey(key);
  const config = requirePrivateStorageConfig();

  try {
    await clientFor(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: safeKey,
      }),
    );
  } catch {
    throw new ServiceError(502, "STORAGE_DELETE_FAILED", "تعذر حذف الملف من التخزين");
  }
}

export async function createSignedDownloadUrl(
  key: string,
  options: {
    expiresIn?: number;
    responseContentDisposition?: string;
    responseContentType?: string;
  } = {},
): Promise<string> {
  const safeKey = assertPrivateObjectKey(key);
  const config = requirePrivateStorageConfig();
  const expiresIn = Math.min(
    Math.max(options.expiresIn ?? config.signedUrlTtlSeconds, 30),
    MAX_TTL_SECONDS,
  );

  try {
    return await getSignedUrl(
      clientFor(config),
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: safeKey,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseContentType: options.responseContentType,
      }),
      { expiresIn },
    );
  } catch {
    throw new ServiceError(502, "STORAGE_SIGNING_FAILED", "تعذر تجهيز رابط تحميل الملف");
  }
}
