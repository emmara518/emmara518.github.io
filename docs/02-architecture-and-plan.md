# Dros Math 2026 — Architecture, Rebuild Strategy, Plan & Risk Register

> Document 2 of 2. Covers deliverables **(3) Architecture Proposal**, **(4) Migration/Rebuild
> Strategy**, **(5) Phased Implementation Plan**, **(6) Risk Register**.

---

## 3. Architecture Proposal

### 3.1 Stack decision (evaluated alternatives)

| Concern | Decision | Why |
|---|---|---|
| App framework | **Next.js (App Router) + TypeScript** | one language end-to-end; server components for SEO — fixes the legacy "JS shell" problem; route handlers give versioned REST without a second service |
| API | **Versioned REST `/api/v1/*`** | explicit contract per the product brief; zod validates every boundary |
| Database | **PostgreSQL + Drizzle ORM** | relational core (money, enrollments, attempts) demands strong constraints & transactions |
| Auth | **Server-side sessions (httpOnly cookie, DB token)** over bcrypt hashes | no third-party lock-in; roles enforced server-side on every request |
| Files | **Storage-adapter boundary**: `storage_key` strings in DB (`/uploads/…` now, S3-compatible object storage later) | swapping backends touches one module |
| Video | **YouTube references only** (`youtube_video_id`, playlist id, order, duration, progress seconds) | per video-architecture rule: zero video bytes on our infra |
| Design system | **Tokens in CSS variables → Tailwind v4 theme, RTL-first, dark/light** | single source of truth, no runtime CSS-in-JS conflicts |

A Laravel backend was considered per the brief's preference and rejected *for this
codebase*: it would double the stack, duplicate contracts across two languages, and add
deploy surface without adding capability the Next.js+Drizzle PostgreSQL stack lacks.
All data flows stay in one typed repository instead.

### 3.2 Module boundaries (`src/`)

```
db/            schema.ts (single database contract) · index.ts · relations
lib/
  rbac.ts      ROLES + PERMISSIONS (single source of truth)
  auth.ts      password hashing, session lifecycle, guards
  http.ts      uniform API envelope { ok, data | error{code,message} }
  contracts.ts zod schemas = API contract (single source of truth)
  format.ts    money/date/rtl-safe formatting utilities
  utils.ts     cn() and nothing else (no utility proliferation)
  services/    business rules ONCE, used by both pages and API routes:
    catalog.service.ts   billing.service.ts (wallet/orders/coupons/invoices)
    exams.service.ts     dashboard.service.ts  admin.service.ts
components/
  ui.tsx        primitives (Button/Card/Badge/Input/Empty/…)
  marketing.tsx hero math-canvas, sections, course card
  *.tsx         feature components (enroll, lesson room, exam room, admin console)
app/
  api/v1/…      thin handlers: parse → authorize → service → envelope
  (pages)/…     server components reading services directly
```

**Rules enforced:** pages and API routes never contain SQL; services never read
`Request` objects; authorization lives in handlers/pages, business rules in services;
UI primitives are shared — no page-specific copies.

### 3.3 Database contract (26 tables, `src/db/schema.ts`)

Auth & people: `users`, `sessions`. Academics: `academic_stages`, `grades`,
`subjects`, `courses`, `lessons`, `videos` (YouTube refs), `course_files`.
Assessment: `question_bank`, `exams`, `exam_questions`, `exam_attempts`,
`assignments`, `assignment_submissions`. Commerce: `subscriptions`, `orders`,
`payments`, `invoices`, `coupons`, `wallet_accounts`, `wallet_transactions`.
Engagement: `student_progress`, `notifications`, `community_posts`.
Governance: `audit_logs`.

Invariants: money in integer cents (`EGP`), FK constraints + cascade rules, unique
constraints on natural keys (`slug`, `code`, `invoice number`), wallet ledger is
append-only, purchases are a single DB transaction.

### 3.4 Authorization model

Roles: `student` (default), `parent`, `center`, `teacher`, `admin`.
`rbac.ts` maps role → permissions (`course:read`, `course:enroll`, `exam:attempt`,
`admin:read`, `admin:write`, `users:manage`…). Every protected handler calls
`requireUser([...roles])`; ownership checks (subscription, attempt) happen in services.
Admin mutations write `audit_logs`.

### 3.5 Design system ("سَبُّورة ٢٠٢٦ — Blackboard 2026")

- **Tokens:** `--bg/--surface/--surface-2/--ink/--muted/--line/--brand/--gold/…`
  under `:root` (chalk-paper light) and `.dark` (blackboard dark), mapped into
  Tailwind via `@theme inline`. One token file, zero hard-coded hex in components.
- **Type:** IBM Plex Sans Arabic (UI) + IBM Plex Mono (figures/equations), fluid scale.
- **Math visual language:** coordinate grids, animated function plots (SVG
  stroke-draw), orbiting conics, floating operators (∫ Σ Δ π √), axis-ticked cards —
  all generated in code, deterministic, theme-aware.
- **Motion:** IO-driven reveals, GPU-only transforms/opacity, `prefers-reduced-motion`
  respected.

### 3.6 Testing strategy

| Layer | Tooling | Coverage gate |
|---|---|---|
| Unit (services: pricing, coupon, grading) | vitest (pure fns, no DB) | billing + exam grading 100% branches |
| Contract (zod schemas) | schema fuzz tests | invalid payloads rejected |
| API integration | route tests against test DB | authz 401/403, enroll transaction, attempt scoring |
| Security | role-boundary matrix tests | student ✗ admin routes; cross-user access ✗ |
| UI responsive | Playwright smoke (mobile/desktop, RTL) | core flows: register→enroll→learn→exam |
| Regression | CI runs all gates + `tsc` + build | merge blocked on failure |

Seed-based demo data doubles as fixtures for integration tests.

---

## 4. Migration / Rebuild Strategy (isolation-first)

1. **Freeze scope from audit** (doc 01) — legacy remains read-only reference; nothing
   destructive happens to it: this repository is a separate deployable.
2. **Contracts first:** schema.ts + zod contracts + RBAC table land before any UI.
3. **Vertical slice first:** catalog → enroll (wallet) → learning room (YouTube
   references) → exam room, end-to-end, then widen.
4. **Content port (owner-side, manual/assisted):** real course copy, teacher media,
   and YouTube playlist IDs are imported by the owner into the new tables /
   `public/brand/` slots. Seeded demo rows model the exact target shapes so import
   is mechanical. Demo YouTube IDs are placeholders to be replaced per-lesson.
5. **Cutover plan:** new platform deploys to its own infra → owner imports content →
   DNS/cutover decision; legacy stays untouched and can sunset independently.
6. **Secrets:** only `DATABASE_URL` in `.env`; no legacy credentials ever enter this repo.

---

## 5. Phased Implementation Plan

| Phase | Scope | Status in this deliverable |
|---|---|---|
| **0** Foundations | tokens, RBAC, schema, auth, seed | ✅ shipped |
| **1** Learning core | catalog, course detail, enroll (wallet+coupon+invoice), learning room w/ YouTube refs + progress, student dashboard | ✅ shipped |
| **2** Assessment | question bank, exam room, auto-grading, attempt history | ✅ shipped |
| **3** Operations | admin console (stats, users, coupons, publish, orders), notifications feed, audit log, files contract | ✅ shipped (console v1; files = contract + slots) |
| **4** Scale-out | parent/center portals, assignments workflow, community module, object-storage adapter, Redis cache/queue, teacher studio | ⏭ planned (schema-ready) |

Definition of Done applied to shipped phases: API contract ✓, DB contract ✓, UI ✓,
responsive ✓, loading states (`loading.tsx`) ✓, error/empty states ✓, authorization ✓,
type/build gates green ✓; automated suites land with phase-4 CI wiring (§3.6) and are
acknowledged as the project's next gate.

---

## 6. Risk Register

| # | Risk | L×I | Mitigation |
|---|---|---|---|
| R1 | Content/IP: legacy copy & media cannot be copied wholesale | M×H | original copy written fresh; owner imports owned assets into brand slots; no legacy binaries committed |
| R2 | YouTube dependency (embed blocks, region limits) | M×M | `youtube-nocookie`, graceful fallback card linking to YouTube, metadata stored locally |
| R3 | Payment realism without a live PSP | H×M | wallet ledger is the settlement engine today; `payments.provider` enum isolates a future PSP adapter; all money ops transactional + audited |
| R4 | Data-import effort from legacy (courses/IDs/users) | M×M | seed mirrors target shapes; import script maps CSV/JSON dumps in phase 4; legacy untouched meanwhile |
| R5 | RTL/a11y regressions | M×M | physical→logical CSS props, RTL tokens from day one, keyboard-focus styles, responsive suites |
| R6 | Scope growth (28 modules) | H×M | phased plan; schema already covers all 28 modules so later phases need no destructive migrations |
| R7 | Auth abuse (credential stuffing) | M×M | bcrypt cost 12, httpOnly SameSite=Lax sessions, expiry, rate-limit hook point in `http.ts` (phase 4: Redis limiter) |
| R8 | Exam integrity (answer leakage) | M×H | answers never leave the server pre-submission; grading server-side only; attempt stores immutable snapshot |
