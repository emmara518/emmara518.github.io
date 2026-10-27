# DROS MATH — UAT Readiness Report

**Candidate branch:** `feat/prod-hardening`
**Candidate HEAD:** `dd6932b59b20c2d77be39b9a484b5b0eb35e27b8`
**Baseline:** `f4ba929a3193ae1b072b963b5c381db3ea5edaad`
**Status:** UAT candidate prepared; storage live verification and legacy migration are owner-gated.

No Production deployment, Production database write, or Production load test was performed.

## 1. Commits

| Phase | Commit | Scope |
|---|---|---|
| Baseline | `f4ba929` | Existing production-hardening baseline |
| A | `8f3abeb` | Content-only teacher access, Super Admin financial/PII gates, granular assistant permissions |
| B | `52c0fba` | Registration/top-up flags, manual parent linking, exam reveal policy, locked-content API, admin-console fixes |
| C | `dd6932b` | Private S3 storage adapter, signed delivery, fail-closed uploads, upload inventory exclusion |

Working tree intentionally retains the pre-existing local-only `src/db/index.ts` change and unrelated untracked audit/test artifacts. They are not part of the candidate commits.

## 2. Permission Matrix

| Capability | Super Admin | Teacher | Assistant (zero grants) | Assistant (`students.view`) | Student |
|---|---:|---:|---:|---:|---:|
| Admin overview/reports | Yes | No | No | No | No |
| Courses/content/exams/assignments | Yes | Yes | No | No | No |
| Community moderation/community groups | Yes | Yes | No | No | No |
| Users list | Yes | No | No | Yes | No |
| User PII/profile/wallet/orders/subscriptions | Yes | No | No | No | No |
| Payment channels, coupons, manual enrollment, broadcast | Yes | No | No | No | No |
| Assistants/permissions | Yes | No | No | No | No |
| Parent/student manual linking | Yes | No | No | No | No |

Teacher grants are limited to `courses.*`, `content.*`, `exams.*`, `assignments.manage`, and `community.manage`. Assistants are default-deny and receive only explicit granular permissions.

## 3. Verified Runtime Behaviour

Local runtime used PGlite test data and synthetic accounts only. No Production data was read or modified.

### Phase A

- Teacher: content/exams/community APIs `200`.
- Teacher: users, orders, payment requests, manual enrollment, profile admin password, freeze, wallet, broadcast `403`.
- Anonymous: admin users/payment channels `401`.
- Super Admin: unknown payment channel `404`; H-28 fixed.
- Zero-permission assistant: all tested admin APIs `403`; `/admin` rendered no student/teacher emails and no sections.
- `students.view` assistant: `/admin/users` `200`; orders/profile/wallet `403`.
- Sidebar and admin page data are permission-gated; zero-permission assistant now makes no unauthorized exam bootstrap requests.

### Phase B

- `POST /api/v1/auth/register` → `403 REGISTRATION_DISABLED`.
- `POST /api/v1/auth/register-parent` → `403 REGISTRATION_DISABLED`.
- Student `POST /api/v1/me/wallet/topup` → `403 TOPUP_DISABLED`.
- Super Admin manual parent link → `200`.
- Exam submission with `showResultsImmediately=false` → `201`, `revealed:false`, `correctIndex:null`, `correct:null`, `explanation:null`.
- Default max attempts: `5` when unset.
- Sequential course API: enrolled learner received the first video ID and `null` for subsequent locked videos.
- Non-enrolled course API: no locked video IDs.
- H-26 exam-groups/community-groups sections load without crashes.
- H-27 bulk-question course selector is present and required.
- Admin console produces no console errors on the tested sections.

### Phase C

- Upload without S3 configuration → `503 STORAGE_NOT_CONFIGURED`; no file was written to `public/`.
- New keys use `course-files/`, `proofs/`, and `replies/` prefixes.
- Private reads use short-lived signed URLs; legacy `/uploads/*` keys remain readable only through gated routes.
- `.vercelignore` excludes `/public/uploads`.
- Existing local uploads: 3 files, 3,977,775 bytes total, all under `public/uploads/proofs/`. Two are byte-identical.

## 4. Automated Verification

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, 0 errors; 1 pre-existing warning in `tests/ultra/fixtures/k6-ultra-smoke.js:37` |
| `npx vitest run tests/unit` | Pass: 9 files, 268 tests |
| Production build in scratch copy with Google-font stub | Pass; standalone prepared |
| Standalone `/api/health` | `200 {"ok":true}` |

The scratch build emitted non-fatal PGlite page-data warnings because the scratch copy intentionally excluded `data/`; the build completed and the standalone server started successfully. No font stub was committed.

## 5. Storage Inventory

| Object | Bytes | SHA-256 |
|---|---:|---|
| `public/uploads/proofs/3381acb4-989a-4276-ae08-f4b45673ebf2.png` | 49 | `D6EE0D9B76EF7CF673ED752397BEED4F777A4CC73B59253904A8860BF11F6CBA` |
| `public/uploads/proofs/db0c59dd-20e5-4c21-804f-f2f577094b69.png` | 1,988,863 | `D334080F9377D82D62F1A1BE826CDE84220A6D0B3AABE69699F469D969286156` |
| `public/uploads/proofs/e992bbdd-7cef-4154-900f-170d148eef70.png` | 1,988,863 | `D334080F9377D82D62F1A1BE826CDE84220A6D0B3AABE69699F469D969286156` |

No local `course-files` or `replies` legacy objects were found. These objects were not deleted or copied to S3.

## 6. UAT Script

1. Log in as a teacher. Confirm only courses/content, exams, assignments, and community sections appear. Directly call financial/PII/admin endpoints and confirm `403`.
2. Log in as a zero-permission assistant. Confirm `/admin` shows no sections and makes no unauthorized data requests. Log in as `students.view` assistant and confirm only the users table is available.
3. Submit student and parent registration. Confirm `403 REGISTRATION_DISABLED` for both.
4. Attempt student self top-up. Confirm `403 TOPUP_DISABLED`; verify code redemption and Super Admin manual enrollment still work.
5. As Super Admin, manually link a parent to a student. Confirm the parent sees the child. Confirm automatic guardian-phone linking does not occur.
6. Submit an exam with `showResultsImmediately=false`. Confirm score is visible but answers/explanations are hidden; confirm reveal after the window. Confirm unset max attempts defaults to 5.
7. Open a sequential course as an enrolled learner. Confirm the first video is playable and later videos are locked. Confirm non-enrolled users receive no locked video IDs.
8. Upload a course file, payment proof, and community reply media. Confirm each upload succeeds only with private S3 configured, downloads through a short-lived signed URL, and direct public bucket access is denied. Confirm proof screenshots are Super Admin-only and reply media is participant/enrollment-gated.
9. Open exam groups, community groups, and bulk-question entry. Confirm no crash and that the bulk flow requires a course.

## 7. Blockers and Owner Actions

### Required before UAT sign-off

- [ ] Provide a private S3-compatible bucket and credentials: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_SIGNED_URL_TTL_SECONDS=300`.
- [ ] Block all public bucket access and confirm direct object URLs return `403`.
- [ ] Migrate or explicitly discard the 3 legacy proof objects above; update their database keys to `proofs/...`.
- [ ] Configure the isolated UAT database and Vercel deployment protection. Do not point UAT at Production.
- [ ] Set `PUBLIC_REGISTRATION_ENABLED=false`, `AUTO_PARENT_LINK_ENABLED=false`, and `WALLET_SELF_TOPUP_ENABLED=false` in UAT.
- [ ] Rotate exposed credentials and revoke stale sessions before UAT.
- [ ] Review audit logs and confirm no Production mutations occurred.

### Verification gaps

- Live S3 upload and signed-URL delivery were not exercised because no bucket credentials were provided. Fail-closed behaviour was verified with `503 STORAGE_NOT_CONFIGURED`.
- Production commit/deployment was not inspected or modified; no Production claim is made.
- No Production load or 10K campaign was run.
- The pre-existing local `src/db/index.ts` modification and unrelated untracked artifacts remain outside the candidate commits.

## 8. Release Decision

**Conditional UAT-ready.** The application-side Phase A/B/C changes are committed and tested. UAT can start after the private bucket, isolated environment, legacy-object decision, credential rotation, and deployment protection items above are completed.
