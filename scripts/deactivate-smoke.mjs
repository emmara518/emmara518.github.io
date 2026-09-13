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
// Deactivate the RC smoke account created during this regression (probe hygiene)
const r = await c.query("UPDATE users SET is_active=false WHERE email='rc-smoke@dros-test.com' AND role='student' RETURNING email");
console.log("deactivated rc-smoke:", r.rows.length);
await c.end();
