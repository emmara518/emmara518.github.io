# DROS MATH - Final UAT Readiness Report

**Candidate branch:** `feat/prod-hardening`
**Implementation HEAD:** `8fc344fc0dfdaa9a503e35fef2b4cbba29204b5b`
**Security remediation commit:** `dab56814579d4afd63596efbad818b9df90dcd0e`
**Current local HEAD at audit:** `dab56814579d4afd63596efbad818b9df90dcd0e`
**Baseline:** `f4ba929a3193ae1b072b963b5c381db3ea5edaad`
**Final verdict:** `CODE REMEDIATION PASS — PRODUCTION ACCOUNT STATUS STILL BLOCKED`

No Production deployment, Production database write, Production environment change, push, or Production load test was performed.

## 1. Repository Identity and Source Suitability

**Correct source repository:** `github.com/emmara518/emmara518.github.io`
**Vercel project:** `egypthub/emmara518-github-io`

Evidence:

- Local remote and `.git/config` point to `https://github.com/emmara518/emmara518.github.io.git`; no credentials are stored in the config.
- GitHub API identifies the public repository as `emmara518/emmara518.github.io`, default branch `main`, language TypeScript.
- Remote `main` contains the full Next.js application: 274 tracked files, `package.json`, `next.config.ts`, `src/app/api/**`, and API routes. It is not a static-only repository.
- Remote `ui-redesign-2026` is the static mirror branch: `index.html`, `assets/`, `pages/`, `static/`, and a Pages workflow; it has no application API or Next.js source.
- Remote `uiux/pass-1` also contains the full application.
- The local branch is based on `origin/main` at `d78f170`; it is **21 commits ahead and 0 behind**. A push would publish 21 commits on a new branch without rewriting history.
- The pending range contains 143 files. Only `.env.example` is environment-related; no `.env`, `data/`, `backups/`, `public/uploads/`, `.next/`, `node_modules/`, or `.vercel/` path is in the push range. Untracked QA artifacts remain outside the commits.
- Remote branches currently present: `main`, `ui-redesign-2026`, `uiux/pass-1`. Remote `feat/prod-hardening` is absent.
- Vercel project link verified through the Vercel API: type `github`, repo `emmara518.github.io`, org `emmara518`, and `productionBranch` `main`.

The repository is suitable as the source for UAT. The GitHub description mentioning a "static mirror" is misleading for `main`; it describes the separate `ui-redesign-2026` static branch. The local source-map document naming `ui-redesign-2026` as the source is stale.

## 1A. Security Remediation — Demo Credentials

Commit `dab5681` addresses the public demo-credential findings:

- `src/db/seed.ts`: demo seeding now requires `NODE_ENV=development` or `NODE_ENV=test`; production and unknown environments are refused before any database access. The fixed demo/master passwords were removed. Development/test passwords come from `DEMO_SEED_PASSWORD` and `MASTER_ADMIN_PASSWORD`, or are generated with `crypto.randomBytes` and are never logged.
- `src/db/index.ts`: both external PostgreSQL and embedded PGlite bootstrap paths skip demo seeding outside development/test.
- `src/components/auth-forms.tsx`: demo quick-login controls and shared credentials were removed.
- `src/components/hero-math-3d.tsx`: public demo-credential display was replaced with a non-functional interactive preview label.
- `src/components/admin-console.tsx`: the fixed new-student password and its form were removed; the panel now states that provisioning requires a secure setup flow.
- `src/app/api/v1/admin/users/create-student/route.ts`: student provisioning is disabled with `503 STUDENT_PROVISIONING_DISABLED` until a secure setup flow exists. Authorization remains Super Admin-only.
- `docs/audit-AGENT-06-auth-rbac-security.md`: reusable demo values were replaced with redacted placeholders and an owner-verification note.
- `tests/unit/demo-credentials.test.ts`: regression coverage for production seed refusal, quick-login removal, hero display removal, fixed-password removal, provisioning disablement, and documentation redaction.

**Current code exposure:** no reusable demo password or fixed student default is present in production-visible UI. Demo account emails remain as non-secret seed identifiers; production seeding is disabled.

**Production account status:** `BLOCKED — OWNER VERIFICATION REQUIRED`. The original values remain in public Git history and may still be active in Production. Source cleanup does not rotate or disable accounts.

### Owner checklist for exposed demo accounts

1. Use the authorized administrative interface or approved read-only inventory to determine whether the affected demo accounts exist and are active in Production.
2. Disable active accounts or replace their credentials through the approved Production administration process.
3. Revoke sessions/tokens associated with affected accounts where appropriate.
4. Review recent authentication/audit events for suspicious use without exporting personal records.
5. Rotate the same credential in any other system where it was reused.
6. Decide separately whether a Git history purge is necessary; a purge does not replace credential rotation and requires explicit approval.

## 2. Vercel Configuration and Production Risk

The local `.vercel/project.json` points to `egypthub/emmara518-github-io`, which is the correct Vercel project for this repository.

Actual Vercel evidence:

- Production Branch is `main` (verified through the Vercel API); no change was needed or made.
- The latest Production deployment metadata records:
  - `githubCommitRepo`: `emmara518.github.io`
  - `githubCommitRef`: `feat/prod-hardening`
  - `githubCommitSha`: `f4ba929`
  - `gitDirty`: `1`
- Production `/api/health/version` returns `{"release":"f4ba929","environment":"production"}`.
- The Production `.vercel.app` URL returns HTTP `200` without authentication in a read-only request.
- Deployment Protection is configured as `all_except_custom_domains` with Git fork protection enabled, but the observed public Production response means protection is not proven effective for the exposed URL. No Preview exists to test its actual behavior.
- There are **zero Preview deployments** (`vercel ls --environment preview` returned an empty list).
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and the Neon/Postgres variables target `Production, Preview, Development` together. Database isolation is therefore **not proven**.
- No independent UAT database connection was available, so the read-only identity query was not executed and no database was contacted.
- `SESSION_SECRET`, payment credentials, `S3_*`, `REDIS_URL`, and email credentials target `Production, Preview` together. Preview credentials are not proven separate from Production.
- Preview does not contain `PUBLIC_REGISTRATION_ENABLED`, `AUTO_PARENT_LINK_ENABLED`, or `WALLET_SELF_TOPUP_ENABLED`; the application defaults for these flags are closed, but there is no Preview to verify.
- Preview still contains legacy `S3_PUBLIC_URL`; the newer optional storage variables `S3_FORCE_PATH_STYLE` and `S3_SIGNED_URL_TTL_SECONDS` are not present.
- GitHub API returns `422` for commits `f4ba929` and `8fc344f`; only `d78f170` (`main`) is available remotely. The current Production deployment is therefore not reproducible from the public repository.

### Production risks

1. Production is publicly reachable at the generated Vercel URL despite the SSO setting.
2. Production runs the pre-hardening baseline `f4ba929`, not the Phase A/B/C candidate.
3. That Production deployment was built from a dirty `feat/prod-hardening` working tree, and its commit is absent from GitHub.
4. Preview and Production share database variable configuration; creating a Preview deployment now could point UAT at Production data.
5. No Preview deployment exists to validate protection or isolation.

No Production setting or Vercel configuration was changed. Production Branch was already `main`.

## 3. Automated Verification

| Command | Actual result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors; 1 pre-existing warning at `tests/ultra/fixtures/k6-ultra-smoke.js:37` |
| `npx vitest run tests/unit` | PASS: 10 files, 280 tests |
| Scratch production build with Google-font stub | PASS; standalone prepared |
| Standalone `/api/health` | PASS: `200 {"ok":true}` |

The scratch build used a temporary font stub only; no stub was committed. The current build completed cleanly and the standalone `/api/health` returned 200. A production-build UI check of `/login` and `/` found no demo email, `DEMO ACCESS` label, quick-login control, or fixed default password; the client static chunks contained no demo email or removed control names.

## 4. Local Functional and Security Smoke Test

A controlled local smoke test ran against PGlite test data on `127.0.0.1:3101` at implementation HEAD `8fc344f`. It created only synthetic UAT records. Result: **47/47 checks PASS**. This is a pre-remediation baseline only: `dab5681` changed seed passwords, login UI, and student provisioning, so the runtime smoke was not re-run and is **NOT TESTED after remediation**. Unit, typecheck, lint, and the production build were re-run at the remediation HEAD.

| Area | Verified result |
|---|---|
| Admin login and data load | PASS |
| Teacher content read/edit | PASS: courses, exams, community groups; course edit `200` |
| Teacher restricted endpoints | PASS: users, orders, payment requests, payment channels, assistants all `403` |
| Teacher privilege escalation | PASS: admin role change and admin password change `403` |
| Teacher wallet access | PASS: `403` |
| Zero-permission assistant | PASS: users/orders/courses/exams `403`; `/admin` has no sections or student/teacher PII |
| `students.view` assistant | PASS: users `200`; orders and wallet `403`; admin page limited to users |
| Teacher sidebar/page | PASS: content categories only; no billing or users categories |
| Student registration | PASS: `403 REGISTRATION_DISABLED` |
| Parent registration | PASS: `403 REGISTRATION_DISABLED` |
| Auto parent-link disabled | PASS: local registration enabled only for the test; parent children list unchanged |
| Self top-up | PASS: `403 TOPUP_DISABLED` |
| Super Admin wallet adjustment | PASS: `200` |
| Sequential video locks | PASS: first video ID present; 8/8 later videos returned `null` |
| Exam room | PASS: 5 questions; no answer fields exposed |
| Exam submission with reveal disabled | PASS: `201`, `revealed:false`, all `correctIndex`/`correct`/`explanation` null |
| Manual parent link | PASS: Super Admin `200`; teacher `403`; parent portal lists linked children |
| H-28 payment channels | PASS: Super Admin `200`; teacher `403` |
| Course-file upload without S3 | PASS: `503 STORAGE_NOT_CONFIGURED` |
| File delivery authentication | PASS: unauthenticated `401` |
| Payment proof MIME validation | PASS: `422 INVALID_FILE_TYPE` |
| Payment proof without S3 | PASS: `503 STORAGE_NOT_CONFIGURED` |
| Audit visibility | PASS: admin page includes audit heading and recorded entity |

### H-26 / H-27 / H-28

No separate authoritative H-26/H-27/H-28 finding document exists in the repository; only the prior UAT report names the symptoms. Verification used the current code and those reported symptoms:

- H-26: exam groups and community groups load without crashes or console errors.
- H-27: bulk-question entry includes a required course selector.
- H-28: payment-channel read is Super Admin-only; teacher `403`, Super Admin `200`.

## 5. Storage and Legacy Proof Files

Required configuration names (values not printed):

`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS`.

Status:

- Course files, payment proofs, and reply media use the private storage adapter.
- No S3 configuration causes `503 STORAGE_NOT_CONFIGURED`; no local/public fallback occurs.
- New uploads do not create `public/uploads/course-files`.
- Signed URL generation is short-lived and occurs after route authorization. Live signed delivery was not exercised because no bucket is configured.
- `.vercelignore` excludes `/public/uploads`.

Legacy proof inventory (not migrated, not deleted):

| Object | Bytes | SHA-256 |
|---|---:|---|
| `public/uploads/proofs/3381acb4-989a-4276-ae08-f4b45673ebf2.png` | 49 | `D6EE0D9B76EF7CF673ED752397BEED4F777A4CC73B59253904A8860BF11F6CBA` |
| `public/uploads/proofs/db0c59dd-20e5-4c21-804f-f2f577094b69.png` | 1,988,863 | `D334080F9377D82D62F1A1BE826CDE84220A6D0B3AABE69699F469D969286156` |
| `public/uploads/proofs/e992bbdd-7cef-4154-900f-170d148eef70.png` | 1,988,863 | `D334080F9377D82D62F1A1BE826CDE84220A6D0B3AABE69699F469D969286156` |

No local `course-files` or `replies` legacy objects were found. Two proof files are byte-identical.

## 6. Preview Gate Status

| Gate | Status |
|---|---|
| Correct source repository | PASS |
| Vercel project linked to repository | PASS |
| Production Branch is `main` | PASS — verified through Vercel API; no change made |
| Deployment Protection configured | PARTIAL — SSO setting exists, but public Production URL returned 200 |
| Preview Deployment Protection proven | BLOCKED — zero Preview deployments |
| Preview database isolated from Production | BLOCKED — shared variable target; no Preview to verify |
| Preview environment flags | BLOCKED — flags absent; defaults closed but no Preview to verify |
| Preview S3/test credentials isolated | BLOCKED — shared credential names; no Preview |
| Preview smoke test | BLOCKED — stopped before any Preview write |

## 7. Safe Next Steps

Do not push or deploy until the Preview environment is isolated.

### A. Prepare Preview environment

1. Vercel Dashboard -> Project `emmara518-github-io` -> Settings -> Environment Variables -> Preview.
2. Replace `DATABASE_URL` and Neon/Postgres variables with a dedicated UAT database. Do not reuse the Production values.
3. Set `PUBLIC_REGISTRATION_ENABLED=false`, `AUTO_PARENT_LINK_ENABLED=false`, and `WALLET_SELF_TOPUP_ENABLED=false`.
4. Set a unique Preview `SESSION_SECRET`; use UAT-only or test-mode payment credentials. Remove Production payment credentials from Preview.
5. Configure private storage in Preview: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optionally `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS=300`.
6. Remove or ignore the legacy `S3_PUBLIC_URL` variable.

### B. Prove protection and isolation

1. Vercel -> Settings -> Deployment Protection -> Vercel Authentication -> Standard Protection for Preview; verify an incognito Preview request is challenged.
2. Production Branch is already `main` (verified); do not manually deploy a feature branch to Production.
3. Run a read-only Preview query such as `select current_database(), current_user, inet_server_addr();` and compare it with Production without printing credentials.
4. Verify the Preview deployment commit after push; do not promote it.

### C. Push plan (not executed)

After A and B are complete and the owner approves:

```bash
git push -u origin feat/prod-hardening
```

This creates a new remote branch at the current report HEAD (implementation code `8fc344f` plus documentation); it does not rewrite `main`. Do not force-push and do not promote the resulting Preview to Production.

### D. Legacy files and credentials

1. Approve migration or disposal of the three legacy proof files; do not delete them without approval.
2. Rotate exposed credentials and revoke stale sessions.
3. Review why the current Production deployment was built from a dirty feature branch and decide whether Production should be redeployed from a verified commit.
4. Implement and test a secure student password-setup/invitation flow before re-enabling student provisioning.

## 8. Push Readiness

**Verdict:** `BLOCKED — OWNER ACTION REQUIRED`

| Gate | Status |
|---|---|
| Correct repository and candidate commit | PASS |
| Working state reviewed; no secret files staged | PASS |
| Production Branch safe (`main`) | PASS |
| Separate UAT database for Preview | BLOCKED |
| Preview secrets/services separate from Production | BLOCKED |
| Preview Deployment Protection proven | BLOCKED |
| Uploads private or demonstrably disabled | PASS locally; BLOCKED for Preview |
| Local security checks | PASS |

No push or deployment was performed.

## 9. Limitations

- No Preview deployment exists, so Preview protection, database isolation, and Preview smoke remain unverified.
- The public Production URL returned 200 without authentication; protection is not proven effective.
- Production runs `f4ba929`, which predates the hardening commits; its deployment commit is absent from GitHub.
- Live S3 upload and signed-URL delivery were not exercised; fail-closed behavior was verified.
- The three legacy proof objects were not migrated or deleted.
- No capacity or high-volume load claim is made; capacity testing is out of scope.

## 10. Acceptance Script for Mr. Mohamed Saeed

1. Open the protected Preview URL in an incognito window; confirm authentication is required.
2. Log in as a teacher; confirm content-only navigation and `403` on users/orders/payment channels.
3. Log in as a zero-permission assistant; confirm no admin sections. Log in as a `students.view` assistant; confirm users only.
4. Submit student and parent registration; confirm both are rejected with `REGISTRATION_DISABLED`.
5. Attempt self top-up; confirm `TOPUP_DISABLED`. Verify Super Admin wallet adjustment still works.
6. Open a sequential course; confirm the first lesson is playable and later lessons are locked. Confirm locked responses contain no video IDs.
7. Submit an exam with immediate results disabled; confirm score is visible but answers and explanations are hidden.
8. Manually link a parent as Super Admin; confirm the parent sees the child and automatic phone linking does not occur.
9. Upload a course file, proof, and reply media; confirm private signed delivery works. If storage is not configured, confirm uploads are rejected with `503`.
10. Open exam groups, community groups, and bulk-question entry; confirm no crashes and that a course is required.
