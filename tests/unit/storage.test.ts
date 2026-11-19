import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertPrivateObjectKey,
  contentTypeForKey,
  createSignedDownloadUrl,
  isLegacyUploadKey,
  putPrivateObject,
  readPrivateStorageConfig,
} from "@/lib/storage";
import { uploadCourseFile } from "@/lib/services/files.service";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const S3_KEYS = [
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_FORCE_PATH_STYLE",
  "S3_SIGNED_URL_TTL_SECONDS",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(S3_KEYS.map((key) => [key, process.env[key]]));
  for (const key of S3_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of S3_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("private storage configuration", () => {
  it("fails closed when any required S3 value is missing", () => {
    expect(readPrivateStorageConfig({})).toBeNull();
    expect(
      readPrivateStorageConfig({
        S3_BUCKET: "bucket",
        S3_REGION: "auto",
        S3_ACCESS_KEY_ID: "key",
      }),
    ).toBeNull();
  });

  it("reads a private S3-compatible configuration", () => {
    const config = readPrivateStorageConfig({
      S3_BUCKET: "private-bucket",
      S3_REGION: "auto",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
      S3_ENDPOINT: "https://storage.example.com",
      S3_FORCE_PATH_STYLE: "true",
      S3_SIGNED_URL_TTL_SECONDS: "900",
    });

    expect(config).toEqual({
      bucket: "private-bucket",
      region: "auto",
      accessKeyId: "key",
      secretAccessKey: "secret",
      roleArn: null,
      endpoint: "https://storage.example.com",
      forcePathStyle: true,
      signedUrlTtlSeconds: 900,
    });
  });

  it("supports Vercel OIDC role credentials without static keys", () => {
    const config = readPrivateStorageConfig({
      S3_BUCKET: "private-bucket",
      S3_REGION: "us-east-1",
      AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/uat",
    });
    expect(config).toMatchObject({
      bucket: "private-bucket",
      region: "us-east-1",
      accessKeyId: null,
      secretAccessKey: null,
      roleArn: "arn:aws:iam::123456789012:role/uat",
    });
  });

  it("clamps unsafe signed URL lifetimes to the default", () => {
    const base = {
      S3_BUCKET: "bucket",
      S3_REGION: "auto",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
    };
    expect(
      readPrivateStorageConfig({ ...base, S3_SIGNED_URL_TTL_SECONDS: "1" })
        ?.signedUrlTtlSeconds,
    ).toBe(300);
    expect(
      readPrivateStorageConfig({ ...base, S3_SIGNED_URL_TTL_SECONDS: "99999" })
        ?.signedUrlTtlSeconds,
    ).toBe(300);
  });

  it("rejects uploads and signing when storage is not configured", async () => {
    await expect(putPrivateObject("proofs/a.png", Buffer.from("x"), "image/png")).rejects.toMatchObject({
      status: 503,
      code: "STORAGE_NOT_CONFIGURED",
    });
    await expect(createSignedDownloadUrl("proofs/a.png")).rejects.toMatchObject({
      status: 503,
      code: "STORAGE_NOT_CONFIGURED",
    });
  });
});

describe("private storage keys", () => {
  it("accepts only the three private prefixes", () => {
    expect(assertPrivateObjectKey("course-files/a.pdf")).toBe("course-files/a.pdf");
    expect(assertPrivateObjectKey("proofs/a.jpg")).toBe("proofs/a.jpg");
    expect(assertPrivateObjectKey("replies/a.mp4")).toBe("replies/a.mp4");
  });

  it("rejects traversal, absolute, and unknown prefixes", () => {
    for (const key of [
      "/uploads/proofs/a.jpg",
      "proofs/../a.jpg",
      "proofs//a.jpg",
      "proofs/a\\b.jpg",
      "public/a.jpg",
      "proofs/\u0000.jpg",
    ]) {
      expect(() => assertPrivateObjectKey(key)).toThrow();
    }
  });

  it("recognizes legacy upload keys for read-only migration", () => {
    expect(isLegacyUploadKey("/uploads/proofs/a.jpg")).toBe(true);
    expect(isLegacyUploadKey("/uploads/replies/a.mp4")).toBe(true);
    expect(isLegacyUploadKey("uploads/proofs/a.jpg")).toBe(false);
    expect(isLegacyUploadKey("/uploads/../a.jpg")).toBe(false);
    expect(isLegacyUploadKey("/uploads//a.jpg")).toBe(false);
  });

  it("maps stored extensions to safe content types", () => {
    expect(contentTypeForKey("proofs/a.png")).toBe("image/png");
    expect(contentTypeForKey("replies/a.mp4")).toBe("video/mp4");
    expect(contentTypeForKey("course-files/a.pdf")).toBe("application/pdf");
    expect(contentTypeForKey("replies/a.bin", "application/octet-stream")).toBe(
      "application/octet-stream",
    );
  });
});

describe("Phase C storage wiring", () => {
  it("keeps public uploads out of deployments", () => {
    expect(read(".vercelignore")).toContain("/public/uploads");
  });

  it("uploads course files, proofs, and replies through private storage", () => {
    const courseFiles = read("src/lib/services/files.service.ts");
    const proofs = read("src/app/api/v1/me/payment-requests/route.ts");
    const replies = read("src/app/api/v1/admin/community/posts/[id]/replies/route.ts");

    expect(courseFiles).toContain("putPrivateObject");
    expect(courseFiles).toContain("course-files/");
    expect(courseFiles).not.toContain("writeFile");
    expect(courseFiles).not.toContain('path.join(process.cwd(), "public"');

    expect(proofs).toContain("putPrivateObject");
    expect(proofs).toContain("proofs/");
    expect(proofs).not.toContain("writeFile");
    expect(proofs).not.toContain('path.join(process.cwd(), "public"');

    expect(replies).toContain("putPrivateObject");
    expect(replies).toContain("replies/");
    expect(replies).not.toContain("writeFile");
    expect(replies).not.toContain('path.join(process.cwd(), "public"');
  });

  it("serves private files through signed URLs and keeps legacy reads", () => {
    const courseFile = read("src/app/api/v1/files/[id]/route.ts");
    const proof = read("src/app/api/v1/admin/payment-requests/[id]/screenshot/route.ts");
    const media = read("src/app/api/v1/community/replies/[id]/media/route.ts");

    for (const route of [courseFile, proof, media]) {
      expect(route).toContain("createSignedDownloadUrl");
      expect(route).toContain("isLegacyUploadKey");
      expect(route).toContain("readLegacyUpload");
    }

    expect(read("src/lib/storage.ts")).not.toContain("S3_PUBLIC_URL");
  });
});

describe("course file validation", () => {
  const actor = {} as Parameters<typeof uploadCourseFile>[0];
  const base = {
    courseId: "00000000-0000-4000-8000-000000000000",
    title: "Validation",
    kind: "attachment" as const,
  };

  it("rejects unsupported MIME types before storage", async () => {
    await expect(
      uploadCourseFile(actor, {
        ...base,
        file: new File(["<html></html>"], "x.html", { type: "text/html" }),
      }),
    ).rejects.toMatchObject({ code: "INVALID_FILE_TYPE" });
  });

  it("rejects oversized files before storage", async () => {
    const oversized = {
      type: "application/pdf",
      size: 50 * 1024 * 1024 + 1,
      name: "x.pdf",
      arrayBuffer: async () => new ArrayBuffer(0),
    } as File;
    await expect(uploadCourseFile(actor, { ...base, file: oversized })).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    });
  });

  it("fails closed when storage is not configured", async () => {
    await expect(
      uploadCourseFile(actor, {
        ...base,
        file: new File(["%PDF-1.4"], "x.pdf", { type: "application/pdf" }),
      }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_CONFIGURED" });
  });
});