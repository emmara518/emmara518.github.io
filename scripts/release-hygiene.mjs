import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local") });
import pg from "pg";

/**
 * RELEASE HYGIENE — verified, reversible actions only (evidence in
 * scripts/inspect-candidates.mjs output):
 *   1. UNPUBLISH garbage course slug '48748' (real paid customer preserved:
 *      room access no longer depends on published status — see dashboard.service).
 *   2. DEACTIVATE (is_active=false) 20 verified probe/test accounts — patterned
 *      test emails, zero real-customer linkage, zero real payments. Ledger rows
 *      are preserved (audit trail); no wallet mutation.
 *   3. DISABLE unused AUDIT-* test coupons.
 * Real customers (emmara518/517/519@gmail.com, elmorsyrock2050@gmail.com,
 * parent 01093243914) are NEVER touched. Backup artifact: backups/*.json
 */
const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "") ? undefined : { rejectUnauthorized: false },
});
await c.connect();

try {
  await c.query("BEGIN");

  // 1. Unpublish garbage course (verify identity first)
  const course = await c.query(
    "SELECT id, title FROM courses WHERE slug='48748' AND title='الماث' FOR UPDATE",
  );
  if (course.rows.length !== 1) {
    throw new Error("Course 48748 identity mismatch — aborting");
  }
  await c.query("UPDATE courses SET status='draft' WHERE id=$1", [course.rows[0].id]);
  console.log(`1. Unpublished course 48748 (${course.rows[0].id.slice(0, 8)})`);

  // 2. Deactivate probe accounts — email whitelist, re-verified in-transaction
  const testEmails = [
    "stu968496@test.com", "stu150140@test.com", "stu194971@test.com", "stu487053@test.com",
    "stu561385@test.com", "stu080037@test.com", "live676099@test.com",
    "audit-test-001@dros-math-test.com", "admin@dros-math.com", "student-test@audit.com",
    "new-student@audit.com", "audit-student-2@audit.com", "cto-audit-1@dros-test.com",
    "01096849612@parents.dros-math.com", "01015014012@parents.dros-math.com", "01019497112@parents.dros-math.com",
    "01048705312@parents.dros-math.com", "01056138512@parents.dros-math.com", "01008003712@parents.dros-math.com",
    "01067609999@parents.dros-math.com",
  ];
  // Safety: refuse to deactivate any account that has a gmail/real-looking order holder identity
  const dangerous = await c.query(
    "SELECT email FROM users WHERE email = ANY($1) AND (email LIKE '%gmail.com' OR role='teacher')",
    [testEmails],
  );
  if (dangerous.rows.length > 0) throw new Error("Real-looking account in test list: " + dangerous.rows[0].email);

  const deact = await c.query(
    "UPDATE users SET is_active=false WHERE email = ANY($1) RETURNING email, role",
    [testEmails],
  );
  console.log(`2. Deactivated ${deact.rows.length} probe accounts (is_active=false)`);

  // 3. Disable unused AUDIT-* coupons (mine, verified unused)
  const coupons = await c.query(
    "UPDATE coupons SET max_uses=used_count WHERE code LIKE 'AUDIT-%' AND used_count=0 RETURNING code",
  );
  console.log(`3. Disabled ${coupons.rows.length} unused AUDIT-* coupons: ${coupons.rows.map((r) => r.code).join(", ")}`);

  // Audit trail
  await c.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, meta)
     SELECT id, 'release.hygiene', 'system', NULL,
     jsonb_build_object('unpublished_course', '48748', 'deactivated_accounts', $1::int, 'disabled_coupons', $2::int)
     FROM users WHERE email='admin' LIMIT 1`,
    [deact.rows.length, coupons.rows.length],
  );
  console.log("Audit log entry written");

  await c.query("COMMIT");
  console.log("HYGIENE COMPLETE (reversible: is_active=true / status='published' restore)");
} catch (e) {
  await c.query("ROLLBACK");
  console.error("ABORTED — rolled back:", e.message);
  process.exit(1);
} finally {
  await c.end();
}
