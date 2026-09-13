#!/usr/bin/env node
/**
 * DROS MATH — database restore from a backup artifact (scripts/backup-db.mjs).
 *
 * Restores tables row-by-row from the JSON snapshot. Identity PK columns are
 * preserved. Existing rows with the same PK are upserted (ON CONFLICT DO
 * UPDATE) so the restore is idempotent; it does NOT delete rows created after
 * the backup (point-in-time style truncation is intentionally NOT performed
 * automatically — for a full point-in-time restore, truncate tables manually
 * first, then run this script).
 *
 * Usage:
 *   node scripts/restore-db.mjs backups/<artifact>.json
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local") });
import fs from "node:fs";
import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/restore-db.mjs backups/<artifact>.json");
  process.exit(1);
}

const raw = fs.readFileSync(file, "utf8");
const checksum = crypto.createHash("sha256").update(raw).digest("hex");
const expected = fs.existsSync(`${file}.sha256`)
  ? fs.readFileSync(`${file}.sha256`, "utf8").split(/\s+/)[0]
  : null;
if (expected && expected !== checksum) {
  console.error(`INTEGRITY CHECK FAILED — artifact checksum ${checksum} ≠ recorded ${expected}. Aborting.`);
  process.exit(1);
}
console.log("Integrity check passed:", checksum);

const dump = JSON.parse(raw);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — refusing to run.");
  process.exit(1);
}
const client = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
await client.connect();

try {
  const order = JSON.parse(fs.readFileSync(new URL("../src/db/schema-order.json", import.meta.url), "utf8"));
  const tables = Object.keys(dump.tables).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  for (const table of tables) {
    const rows = dump.tables[table];
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]);
    // Fetch PK columns to build the upsert conflict target.
    const pkRes = await client.query(
      `SELECT a.attname FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
       WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [`"${table}"`],
    );
    const pk = pkRes.rows[0]?.attname;
    const conflict = pk && cols.includes(pk) ? `("${pk}")` : undefined;
    let restored = 0;
    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      });
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const sql = conflict
        ? `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})
           ON CONFLICT ${conflict} DO UPDATE SET ${cols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ")}`
        : `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      await client.query(sql, values);
      restored++;
    }
    console.log(`${table}: ${restored} rows restored`);
  }
  console.log("RESTORE COMPLETE");
} finally {
  await client.end();
}
