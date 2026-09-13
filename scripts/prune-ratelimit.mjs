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
const r = await c.query("DELETE FROM rate_limit_hits WHERE key LIKE 'auth:%' RETURNING key");
console.log("pruned", r.rows.length, "auth limiter rows");
await c.end();
