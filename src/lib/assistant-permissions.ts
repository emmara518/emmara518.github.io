import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { hashPassword, type SessionUser } from "./auth";
import { ServiceError } from "./errors";
import { GRANULAR_PERMISSIONS, isGranularPermission, type GranularPermission } from "./rbac";

/**
 * Assistant accounts & their granular permissions.
 *
 * Schema is provisioned lazily (idempotent) so it works on any database the
 * platform already connects to, without depending on the boot-time SQL batch:
 *  - extends the `user_role` enum with 'assistant'
 *  - creates `assistant_permissions` (one row per granted capability)
 *
 * Assistants hold NO permissions by default; the Super Admin grants them.
 */

let schemaReady: Promise<void> | null = null;

async function ensureAssistantSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      // ADD VALUE must run outside a transaction (autocommit here).
      await db.execute(sql`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'assistant'`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "assistant_permissions" (
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "permission" text NOT NULL,
          "granted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
          "granted_at" timestamp with time zone NOT NULL DEFAULT now(),
          PRIMARY KEY ("user_id", "permission")
        )`);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export type AssistantRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  permissions: GranularPermission[];
};

export async function getAssistantPermissionSet(userId: string): Promise<GranularPermission[]> {
  await ensureAssistantSchema();
  const rows = await db.execute<{ permission: string }>(
    sql`SELECT "permission" FROM "assistant_permissions" WHERE "user_id" = ${userId}`,
  );
  const list = (rows.rows ?? rows) as { permission: string }[];
  return list.map((r) => r.permission).filter(isGranularPermission);
}

export async function listAssistants(): Promise<AssistantRow[]> {
  await ensureAssistantSchema();
  const people = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "assistant"))
    .orderBy(users.createdAt);

  if (people.length === 0) return [];
  const ids = people.map((p) => p.id);
  const grants = await db
    .select({ userId: sql<string>`"user_id"`, permission: sql<string>`"permission"` })
    .from(sql`"assistant_permissions"`)
    .where(inArray(sql`"user_id"`, ids));

  const byUser = new Map<string, GranularPermission[]>();
  for (const g of grants) {
    const perm = g.permission;
    if (!isGranularPermission(perm)) continue;
    const arr = byUser.get(g.userId) ?? [];
    arr.push(perm);
    byUser.set(g.userId, arr);
  }

  return people.map((p) => ({ ...p, permissions: byUser.get(p.id) ?? [] }));
}

export async function createAssistant(
  actor: SessionUser,
  input: { name: string; email: string; password: string; permissions?: GranularPermission[] },
): Promise<AssistantRow> {
  await ensureAssistantSchema();
  const email = input.email.toLowerCase().trim();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) throw new ServiceError(409, "EMAIL_TAKEN", "هذا البريد مستخدم بالفعل");

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({ name: input.name.trim(), email, passwordHash, role: "assistant", isActive: true })
    .returning({ id: users.id, name: users.name, email: users.email, isActive: users.isActive, createdAt: users.createdAt });

  const permissions = (input.permissions ?? []).filter(isGranularPermission);
  if (permissions.length > 0) {
    await replaceAssistantPermissions(actor, created.id, permissions, { audit: false });
  }

  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "assistant.create",
    entity: "users",
    entityId: created.id,
    meta: { role: "assistant", email, permissions },
  });

  return { ...created, permissions };
}

export async function updateAssistant(
  actor: SessionUser,
  id: string,
  input: { name?: string; isActive?: boolean; newPassword?: string },
): Promise<void> {
  await ensureAssistantSchema();
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) throw new ServiceError(404, "USER_NOT_FOUND", "المساعد غير موجود");
  if (target.role !== "assistant") throw new ServiceError(400, "NOT_ASSISTANT", "الحساب ليس حساب مساعد");

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.newPassword) updateData.passwordHash = await hashPassword(input.newPassword);
  if (Object.keys(updateData).length === 0) throw new ServiceError(400, "NO_CHANGES", "لا توجد تعديلات");

  await db.update(users).set(updateData).where(eq(users.id, id));
  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: input.isActive === false ? "assistant.disable" : "assistant.edit",
    entity: "users",
    entityId: id,
    meta: { fields: Object.keys(updateData).filter((k) => k !== "passwordHash"), isActive: input.isActive },
  });
}

export async function replaceAssistantPermissions(
  actor: SessionUser,
  id: string,
  permissions: GranularPermission[],
  opts: { audit?: boolean } = {},
): Promise<GranularPermission[]> {
  await ensureAssistantSchema();
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) throw new ServiceError(404, "USER_NOT_FOUND", "المساعد غير موجود");
  if (target.role !== "assistant") throw new ServiceError(400, "NOT_ASSISTANT", "الحساب ليس حساب مساعد");

  const clean = [...new Set(permissions.filter(isGranularPermission))];

  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM "assistant_permissions" WHERE "user_id" = ${id}`);
    for (const p of clean) {
      await tx.execute(sql`
        INSERT INTO "assistant_permissions" ("user_id", "permission", "granted_by")
        VALUES (${id}, ${p}, ${actor.id})
        ON CONFLICT DO NOTHING`);
    }
  });

  if (opts.audit !== false) {
    await db.insert(auditLogs).values({
      actorId: actor.id,
      action: "assistant.permissions",
      entity: "assistant_permissions",
      entityId: id,
      meta: { permissions: clean },
    });
  }
  return clean;
}

/** Validates that every value is a known granular permission. */
export function sanitizePermissions(values: unknown): GranularPermission[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is GranularPermission => typeof v === "string" && isGranularPermission(v)))];
}

export const ALL_GRANULAR_PERMISSIONS = GRANULAR_PERMISSIONS;
