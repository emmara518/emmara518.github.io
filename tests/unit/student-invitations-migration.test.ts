import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(process.cwd(), "drizzle/0002_student_invitations.sql"),
  "utf8",
);

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec("CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());");
});

afterAll(async () => {
  await db.close();
});

describe("student invitation migration", () => {
  it("applies cleanly and is idempotent on an isolated database", async () => {
    await db.exec(migration);
    await db.exec(migration);

    const columns = await db.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'student_invitations'",
    );
    const names = columns.rows.map((row) => row.column_name);
    for (const column of [
      "id",
      "email",
      "name",
      "phone",
      "token_hash",
      "expires_at",
      "consumed_at",
      "revoked_at",
      "created_by",
      "created_at",
    ]) {
      expect(names).toContain(column);
    }

    const indexes = await db.query<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'student_invitations'",
    );
    const indexNames = indexes.rows.map((row) => row.indexname);
    expect(indexNames).toContain("student_invitations_token_hash_unique");
    expect(indexNames).toContain("student_invitations_email_idx");
    expect(indexNames).toContain("student_invitations_expiry_idx");

    const constraints = await db.query<{ constraint_name: string }>(
      "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'student_invitations'",
    );
    expect(constraints.rows.map((row) => row.constraint_name)).toContain(
      "student_invitations_created_by_users_id_fk",
    );
  });
});
