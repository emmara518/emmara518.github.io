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

const users = await c.query(
  "SELECT id, name, email, phone, role, is_active FROM users ORDER BY created_at",
);
console.log("USERS:");
for (const u of users.rows) {
  console.log(` ${u.role.padEnd(8)} | ${String(u.name).padEnd(22)} | ${String(u.email).padEnd(32)} | active=${u.is_active} | ${u.id.slice(0, 8)}`);
}

const courses = await c.query("SELECT id, slug, title, status FROM courses ORDER BY created_at");
console.log("\nCOURSES:");
for (const k of courses.rows) {
  console.log(` ${String(k.slug).padEnd(28)} | ${k.status.padEnd(9)} | ${k.title.slice(0, 45)} | ${k.id.slice(0, 8)}`);
}

// Garbage course relationship check
const g = await c.query("SELECT id, slug, title, status, summary FROM courses WHERE slug = '48748'");
if (g.rows[0]) {
  const gid = g.rows[0].id;
  const rel = {};
  for (const [label, q] of [
    ["orders", "SELECT count(*)::int c FROM orders WHERE course_id=$1"],
    ["subscriptions", "SELECT count(*)::int c FROM subscriptions WHERE course_id=$1"],
    ["assignments", "SELECT count(*)::int c FROM assignments WHERE course_id=$1"],
    ["lessons", "SELECT count(*)::int c FROM lessons WHERE course_id=$1"],
    ["community_posts", "SELECT count(*)::int c FROM community_posts WHERE course_id=$1"],
  ]) {
    rel[label] = (await c.query(q, [gid])).rows[0].c;
  }
  console.log("\nCOURSE 48748 RELATIONSHIPS:", JSON.stringify(rel));
}

// Coupon summary
const coupons = await c.query("SELECT kind, count(*)::int c, sum(CASE WHEN used_count>0 THEN 1 ELSE 0 END)::int used FROM coupons GROUP BY kind");
console.log("\nCOUPONS:", coupons.rows.map((r) => `${r.kind ?? "course"}: ${r.c} (${r.used} used)`).join(" | "));

// Payment requests
const pr = await c.query("SELECT status, count(*)::int c FROM payment_requests GROUP BY status");
console.log("PAYMENT_REQUESTS:", pr.rows.map((r) => `${r.status}:${r.c}`).join(" | "));

// Sessions
const ss = await c.query("SELECT count(*)::int c FROM sessions WHERE expires_at < now()");
console.log("EXPIRED_SESSIONS:", ss.rows[0].c);

await c.end();
