# Dros Math 2026 — Repository Audit & Current-System Map

> Document 1 of 2. Covers deliverables **(1) Repository Audit** and **(2) Current-System Map**.
> This build is a **new, isolated system**: no connection to the old backend, database, or API.

---

## 1. Repository Audit

**Source:** `github.com/emmara518/emmara518.github.io` @ branch `ui-redesign-2026`
**Nature:** static mirror of the live SPA (GitHub Pages, client-rendered — the live origin
`mr-mohamed-saeed.com` returns a JS shell, which is itself a finding: SEO/host coupling risk).

### 1.1 Structure found

| Path | Meaning |
|---|---|
| `index.html`, `404.html`, `manifest.json`, `favicon.ico`, `logo192.png` | SPA shell + PWA stubs |
| `pages/index.html` | Home / landing |
| `pages/login.html`, `pages/register.html` | Auth screens |
| `pages/years_1.html … years_4.html` | Academic-year catalog pages (one static page per year) |
| `pages/course_1.html` | Course detail / curriculum page |
| `assets/` | Brand + media assets (logos, images) |
| `static/` | Compiled JS/CSS bundles |
| `spa_server.py`, `.nojekyll`, `.github/workflows` | Static hosting plumbing |

### 1.2 Findings

1. **Frontend-only mirror.** The repository contains rendered output, not a backend.
   All business logic, data, auth, and payments live on the legacy closed platform —
   which this rebuild deliberately **does not touch**.
2. **Route model is page-per-year.** Catalog scale is manual: each new academic year or
   course requires a new static page. The new system replaces this with
   data-driven routes (`/courses`, `/courses/[slug]`, filters by stage/grade/subject).
3. **Assets are reachable but copyrighted brand material.** The rebuild keeps the Dros Math
   brand identity and provides **designated asset slots** (`public/brand/`, `public/uploads/`)
   where the owner's authentic logo, photography, and course artwork are dropped in.
   No legacy binary asset is copied into this repository as part of the base build.
4. **No tests, no CI gates, no type safety** in the mirror. Replaced by TypeScript
   end-to-end, zod API contracts, and a defined testing strategy (see doc 02).
5. **Video model confirmed:** teaching content is externally hosted (YouTube). The new
   database stores *references only* — video IDs, playlist IDs, ordering, duration,
   per-student progress metadata. No video bytes are stored or proxied.

### 1.3 Existing backend dependencies (legacy system → replaced, not reused)

| Legacy dependency | Status in new system |
|---|---|
| Legacy auth/session service | **Replaced** by own bcrypt credentials + server sessions (DB) |
| Legacy course/catalog API | **Replaced** by versioned REST `/api/v1/*` on this codebase |
| Legacy production database | **Replaced** by isolated PostgreSQL (`app_db`) via Drizzle |
| Legacy payment/wallet handling | **Replaced** by own ledger (wallet, orders, payments, invoices, coupons) |
| YouTube hosting | **Preserved intentionally** (references only, per video architecture rule) |
| Object/file storage | **New contract** (`storage_key` fields; local/S3 adapter boundary) |

---

## 2. Current-System Map (behavioral map of the reference platform)

### 2.1 Information architecture (observed/derived)

```
الرئيسية (home)
├── المراحل الدراسية / السنوات (years_1..years_4)
│     └── كورسات السنة  → صفحة الكورس (course_1)
│            ├── المنهج / الحصص (lessons)
│            ├── فيديوهات (YouTube)
│            ├── ملفات / مذكرات (PDF)
│            └── امتحانات وتقييم
├── تسجيل الدخول (login)
├── إنشاء حساب (register)
└── حساب الطالب (اشتراكاتي / تقدمي / نتائجي)   ← behind legacy auth
```

### 2.2 Functional inventory to preserve (product knowledge)

- Academic hierarchy: **Stage → Grade → Subject → Course → Lesson → Video/File/Exam**.
- Enrollment = paid access to a course (price in EGP, promo codes, balance/wallet patterns).
- Free-preview lessons that tease a locked curriculum.
- Exam attempts with MCQ auto-grading and stored results.
- Student dashboard: my courses, progress, upcoming exams, wallet, invoices.
- Admin operations: publish courses, manage users, watch orders/revenue.
- Arabic-first, RTL, mobile-heavy audience.

### 2.3 What must be preserved vs rebuilt

**Preserve (brand & product knowledge):** Dros Math name/brand, Mr. Mohamed Saeed as the
teacher identity (real assets slot into `public/brand/`), YouTube-hosted video model,
the academic hierarchy, EGP pricing, exam-with-auto-grade flow, free-preview gating.

**Rebuild (everything technical):** backend, database, auth, authorization, REST API,
design system, all UI, business logic, payments ledger, admin system, notifications,
audit trail — implemented in this repository as a single modular Next.js codebase.

### 2.4 Route map (new system) — canonical replacement

| Public | Authenticated (student) | Admin (`teacher`/`admin`) |
|---|---|---|
| `/` | `/dashboard` | `/admin` (+ tabs) |
| `/courses` | `/dashboard/courses/[slug]` (learning room) | — |
| `/courses/[slug]` | `/dashboard/exams/[id]` (exam room) | — |
| `/login` · `/register` | | |

API: all under `/api/v1/*` — auth, catalog, courses, enroll, exams, progress,
`me/dashboard`, and `/api/v1/admin/*`. Contracts validated with zod — one source of
truth in `src/lib/contracts.ts`.
