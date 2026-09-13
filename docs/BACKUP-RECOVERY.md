# DROS MATH — Backup & Recovery

## Provider
External PostgreSQL (connection-pooler host) via `DATABASE_URL` in `.env.local`.

## Backup (verified procedure)
```bash
npm run db:backup
```
- Dumps **every public table** (row-level JSON) to `backups/dros-math-backup-<timestamp>.json`
- Writes a SHA-256 checksum alongside (`<artifact>.sha256`)
- Read-only; safe to run against production at any time
- `rate_limit_hits` (transient) is excluded

### Integrity verification
```bash
sha256sum -c backups/<artifact>.json.sha256     # linux/git-bash
# or compare with the SHA256 printed by the backup run
```

### First verified artifact
`backups/dros-math-backup-2026-09-11T22-45-29-511Z.json`
SHA-256: `806601b2f0e691329c33454b4777686cf9b42e632b4fe1b4af832a0ae1908765`
(30 users, 6 courses, 73 coupons, 13 orders, 15 subscriptions, full ledger)

## Recovery
```bash
npm run db:restore -- backups/<artifact>.json
```
- Verifies SHA-256 before touching the DB (aborts on mismatch)
- Upserts rows by primary key (idempotent); does **not** delete newer rows
- For a full point-in-time restore: truncate tables first (in FK-safe order,
  see `src/db/schema-order.json`), then run the restore

## Recommended production hardening (owner / DevOps)
1. **Managed PITR** on the Postgres provider (preferred — enables
   minute-granularity recovery; enable in the provider dashboard).
2. Schedule `npm run db:backup` daily (cron / GitHub Action) and ship the
   artifact to object storage with 30-day retention.
3. After any schema migration (`drizzle-kit`): run a fresh backup before and
   verify row counts after.

## Rollback strategy
- Code: redeploy the previous git commit (`git revert` + redeploy; no history
  rewrites).
- Data: restore the latest pre-change artifact via `npm run db:restore`.
- Both: deploy rollback first, then data restore.

## Migration safety
- Migrations live in `drizzle/` (versioned snapshots in `drizzle/meta/`).
- Boot-time `SCHEMA_SQL` is idempotent (`CREATE TABLE IF NOT EXISTS`) and, in
  production, **never seeds** — see `src/db/index.ts` production guard.
