#!/usr/bin/env node
/**
 * DROS MATH — production database backup (logical, read-only).
 *
 * Dumps every public table to a single JSON artifact with row counts and a
 * SHA-256 integrity checksum. Uses the application's existing `pg` driver —
 * no new dependencies. The artifact is restorable table-by-table via the
 * documented recovery procedure (docs/BACKUP-RECOVERY.md).
 *
 * Usage:
 *   node scripts/backup-db.mjs            # uses DATABASE_URL from .env.local
 *   BACKUP_DIR=backups node scripts/backup-db.mjs
 *
 * Recovery (verified procedure — do NOT run against production casually):
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

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — refusing to run.");
  process.exit(1);
}

const outDir = process.env.BACKUP_DIR ?? "backups";
fs.mkdirSync(outDir, { recursive: true });

const client = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
await client.connect();

try {
  const tablesRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const tables = tablesRes.rows.map((r) => r.table_name).filter((t) => t !== "rate_limit_hits");

  const dump = { generatedAt: new Date().toISOString(), database: "dros-math", tables: {} };
  const counts = [];
  for (const table of tables) {
    // Identifier quoted defensively; table names come from the catalog itself.
    const res = await client.query(`SELECT * FROM "${table}"`);
    dump.tables[table] = res.rows;
    counts.push(`${table}:${res.rows.length}`);
  }

  const json = JSON.stringify(dump);
  const checksum = crypto.createHash("sha256").update(json).digest("hex");
  const stamp = dump.generatedAt.replace(/[:.]/g, "-");
  const file = path.join(outDir, `dros-math-backup-${stamp}.json`);
  fs.writeFileSync(file, json);
  fs.writeFileSync(`${file}.sha256`, `${checksum}  ${path.basename(file)}\n`);

  console.log("BACKUP CREATED:", file);
  console.log("TABLES:", counts.join(" "));
  console.log("SHA256:", checksum);
  console.log("Integrity check:  sha256sum -c", `${path.basename(file)}.sha256`);
} finally {
  await client.end();
}
