# DROS MATH - Final UAT Readiness Report

**Candidate branch:** `feat/prod-hardening`
**Candidate HEAD:** `f3e60a6` (test-only commit after implementation HEAD `dd6932b`)
**Baseline:** `f4ba929a3193ae1b072b963b5c381db3ea5edaad`
**Final verdict:** `CONDITIONALLY READY — SPECIFIC SCENARIOS BLOCKED`

No Production deployment, Production database write, Production environment change, or Production load test was performed.

## 1. Exact Repository State

- Branch: `feat/prod-hardening`
- Implementation commits present: `8f3abeb`, `52c0fba`, `dd6932b`
- Report/test commits: `6372e2e` (prior report), `f3e60a6` (storage validation tests)
- Git remote: `https://github.com/emmara518/emmara518.github.io.git`
- No upstream is configured for `feat/prod-hardening`; the branch is local-only.
- Working tree retains the pre-existing local-only `src/db/index.ts` modification and unrelated untracked QA artifacts. They are outside the candidate commits.

## 2. Automated Verification

| Command | Actual result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors; 1 pre-existing warning at `tests/ultra/fixtures/k6-ultra-smoke.js:37` |
| `npx vitest run tests/unit` | PASS: 9 files, 271 tests |
| Scratch production build with Google-font stub | PASS; standalone prepared |
| Standalone `/api/health` | PASS: `200 {"ok":true}` |

The scratch build used a temporary font stub only; no stub was committed. It emitted non-fatal PGlite page-data warnings because the scratch copy excluded `data/`; the build and standalone startup completed.

## 3. Local Functional and Security Smoke Test

A controlled local smoke test ran against PGlite test data on `127.0.0.1:3101`. It created only synthetic UAT records. Result: **47/47 checks PASS**.

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

## 4. Preview Isolation Gate

**Status: BLOCKED.** No DROS MATH Vercel project was found in the accessible team.

Evidence:

- Vercel CLI is authenticated as `momoemara321-4058`; the only accessible team is `egypthub`.
- Project filters for `dros`, `math`, `mohamed`, and `saeed` returned no projects.
- The local `.vercel/project.json` points to `egypthub/emmara518-github-io` (`prj_2AX…`), which matches the Git origin `emmara518/emmara518.github.io`, not DROS MATH.
- That linked project's Preview and Production scopes share the same `DATABASE_URL` variable name and include Neon/Postgres and payment/storage credentials. Values were not read. It is not an acceptable isolated DROS UAT target.
- No DROS Preview URL or deployment identifier exists. No deployment was made.

Because isolation and Deployment Protection could not be proven, no Preview runtime test was executed and no Preview data was written.

## 5. Storage and Legacy Proof Files

Required configuration names (values not printed):

`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS`.

Status:

- Course files, payment proofs, and reply media all use the private storage adapter.
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

## 6. UAT Smoke Status

| Scenario | Status | Evidence |
|---|---|---|
| Student login and course access | PASS (local) | Synthetic student; course API `200` |
| Locked versus unlocked lessons | PASS (local) | First video ID present; later IDs `null` |
| Protected exam answers | PASS (local) | Submission `201`; answers/explanations null |
| Teacher content operations | PASS (local) | Read `200`; course edit `200` |
| Teacher denied financial/admin operations | PASS (local) | Restricted routes `403` |
| Zero-permission assistant | PASS (local) | APIs `403`; admin page empty |
| Granted assistant permission | PASS (local) | `students.view` users `200`; other admin data `403` |
| Parent/student registration | PASS (local) | Both `403 REGISTRATION_DISABLED` |
| Auto parent-link disabled | PASS (local) | Parent children unchanged |
| Disabled top-up | PASS (local) | `403 TOPUP_DISABLED` |
| Admin workflows/audit visibility | PASS (local) | Admin page includes audit entry |
| Private S3 delivery | BLOCKED | No bucket/credentials |
| Preview protection | BLOCKED | No DROS Vercel project |
| Preview database isolation | BLOCKED | No DROS Preview target |
| Preview functional smoke | BLOCKED | Stopped before any Preview write |

## 7. Remaining Owner Actions

### A. Create and protect the correct Preview

1. Vercel Dashboard -> Add New -> Project.
2. Import the correct DROS MATH repository. Do not reuse `egypthub/emmara518-github-io`; it is unrelated to this application.
3. Set Framework Preset to `Next.js` and Root Directory to `.`.
4. Push `feat/prod-hardening` at `f3e60a6` to the correct Git remote.
5. Create a Preview deployment from that branch. Do not promote it to Production.
6. Settings -> Deployment Protection -> Vercel Authentication -> Standard Protection for Preview. Verify an incognito request returns the Vercel authentication page.

### B. Isolate Preview data and services

1. Settings -> Environment Variables -> Preview.
2. Set `DATABASE_URL` to a dedicated UAT database. Do not reuse the Production database or the shared Neon/Postgres values.
3. Set `PUBLIC_REGISTRATION_ENABLED=false`, `AUTO_PARENT_LINK_ENABLED=false`, and `WALLET_SELF_TOPUP_ENABLED=false`.
4. Set a unique Preview `SESSION_SECRET`; use UAT-only or test-mode payment credentials. Remove Production payment credentials from Preview.
5. Verify the target with a read-only Preview query: `select current_database(), current_user, inet_server_addr();`. Compare the result with Production; do not print credentials.

### C. Configure private storage

1. Create a private S3-compatible bucket with public access blocked.
2. Settings -> Environment Variables -> Preview: set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optionally `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS=300`.
3. Verify a direct object URL returns `403`, an authorized signed download succeeds, and a valid upload succeeds.
4. Migrate or explicitly discard the three legacy proof objects only after owner approval; update their `payment_requests.screenshot_key` values to `proofs/...` if migrated.

### D. Credentials and approval

1. Rotate exposed database, storage, payment, and session credentials before UAT.
2. Revoke stale sessions.
3. Confirm in writing that Preview is isolated and that the three legacy proof objects may be migrated or discarded.

## 8. Limitations

- No Preview deployment was created, so Preview protection, database isolation, and Preview smoke remain unverified.
- Live S3 upload and signed-URL delivery were not exercised; fail-closed behavior was verified.
- The three legacy proof objects were not migrated or deleted.
- No Production commit/deployment was inspected or modified.
- No capacity or high-volume load claim is made; capacity testing is out of scope.
- Local PGlite test data is disposable and is not Production data.

## 9. Acceptance Script for Mr. Mohamed Saeed

1. Open the protected Preview URL in an incognito window; confirm Vercel authentication is required.
2. Log in as a teacher; confirm content-only navigation and `403` on users/orders/payment channels.
3. Log in as a zero-permission assistant; confirm no admin sections. Log in as a `students.view` assistant; confirm users only.
4. Submit student and parent registration; confirm both are rejected with `REGISTRATION_DISABLED`.
5. Attempt self top-up; confirm `TOPUP_DISABLED`. Verify Super Admin wallet adjustment still works.
6. Open a sequential course; confirm the first lesson is playable and later lessons are locked. Confirm locked responses contain no video IDs.
7. Submit an exam with immediate results disabled; confirm score is visible but answers and explanations are hidden.
8. Manually link a parent as Super Admin; confirm the parent sees the child and automatic phone linking does not occur.
9. Upload a course file, proof, and reply media; confirm private signed delivery works. If storage is not configured, confirm uploads are rejected with `503`.
10. Open exam groups, community groups, and bulk-question entry; confirm no crashes and that a course is required.
