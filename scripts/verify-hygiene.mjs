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
const a = await c.query("SELECT count(*)::int c FROM users WHERE is_active=true");
const b = await c.query("SELECT status FROM courses WHERE slug='48748'");
const e = await c.query("SELECT is_active FROM users WHERE email='emmara518@gmail.com'");
const s = await c.query(
  "SELECT status FROM subscriptions WHERE user_id=(SELECT id FROM users WHERE email='emmara518@gmail.com') AND course_id=(SELECT id FROM courses WHERE slug='48748')",
);
const manar = await c.query("SELECT is_active FROM users WHERE email IN ('emmara517@gmail.com','emmara519@gmail.com','elmorsyrock2050@gmail.com')");
console.log(JSON.stringify({
  activeUsers: a.rows[0].c,
  course48748: b.rows[0].status,
  emmaraActive: e.rows[0].is_active,
  emmaraSub48748: s.rows[0]?.status ?? "none",
  otherRealCustomersActive: manar.rows.map((r) => r.is_active),
}));
await c.end();
