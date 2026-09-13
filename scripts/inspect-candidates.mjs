import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local") });
import pg from "pg";

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "") ? undefined : { rejectUnauthorized: false },
});
await c.connect();

// Candidate test users (patterned test emails only)
const emails = [
  "stu968496@test.com", "stu150140@test.com", "stu194971@test.com", "stu487053@test.com",
  "stu561385@test.com", "stu080037@test.com", "live676099@test.com",
  "audit-test-001@dros-math-test.com", "admin@dros-math.com", "student-test@audit.com",
  "new-student@audit.com", "audit-student-2@audit.com", "cto-audit-1@dros-test.com",
  "01096849612@parents.dros-math.com", "01015014012@parents.dros-math.com", "01019497112@parents.dros-math.com",
  "01048705312@parents.dros-math.com", "01056138512@parents.dros-math.com", "01008003712@parents.dros-math.com",
  "01067609999@parents.dros-math.com",
];

const rows = await c.query("SELECT id, name, email, role FROM users WHERE email = ANY($1)", [emails]);
const ids = rows.rows.map((r) => r.id);
console.log("CANDIDATES:", rows.rows.length);

for (const u of rows.rows) {
  const orders = await c.query("SELECT count(*)::int c, coalesce(sum(total_cents),0) s FROM orders WHERE user_id=$1", [u.id]);
  const subs = await c.query("SELECT count(*)::int c FROM subscriptions WHERE user_id=$1 AND status='active'", [u.id]);
  const children = await c.query("SELECT count(*)::int c FROM parent_links WHERE parent_id=$1", [u.id]);
  const wallet = await c.query("SELECT coalesce(balance_cents,0) b FROM wallet_accounts WHERE user_id=$1", [u.id]);
  console.log(
    ` ${u.email.padEnd(38)} role=${u.role.padEnd(8)} orders=${orders.rows[0].c}(${orders.rows[0].s / 100}EGP) activeSubs=${subs.rows[0].c} children=${children.rows[0].c} wallet=${wallet.rows[0]?.b ?? 0 / 100}`,
  );
}

// Who holds the 2 paid orders + subscription on course 48748?
const course = await c.query("SELECT id FROM courses WHERE slug='48748'");
if (course.rows[0]) {
  const gid = course.rows[0].id;
  const holders = await c.query(
    `SELECT u.name, u.email, o.total_cents, o.status FROM orders o JOIN users u ON u.id=o.user_id WHERE o.course_id=$1`,
    [gid],
  );
  console.log("\nCOURSE 48748 ORDER HOLDERS:");
  for (const h of holders.rows) console.log(`  ${h.name} <${h.email}> ${(h.total_cents / 100)} EGP ${h.status}`);
  const subHolders = await c.query(
    `SELECT u.name, u.email, s.status FROM subscriptions s JOIN users u ON u.id=s.user_id WHERE s.course_id=$1`,
    [gid],
  );
  console.log("COURSE 48748 SUBSCRIPTION HOLDERS:");
  for (const h of subHolders.rows) console.log(`  ${h.name} <${h.email}> ${h.status}`);
}

// parent_links sanity: do test parents link to any REAL (gmail) child?
const cross = await c.query(
  `SELECT p.email AS parent_email, ch.email AS child_email FROM parent_links pl
   JOIN users p ON p.id = pl.parent_id JOIN users ch ON ch.id = pl.student_id
   WHERE p.email = ANY($1) AND ch.email NOT LIKE '%@test.com' AND ch.email NOT LIKE '%@audit%' AND ch.email NOT LIKE '%dros-test%' AND ch.email NOT LIKE '%dros-math-test%'`,
  [emails],
);
console.log("\nTEST-PARENT -> REAL-CHILD LINKS (must be 0):", cross.rows.length);

await c.end();
