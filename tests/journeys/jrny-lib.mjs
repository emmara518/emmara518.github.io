/**
 * Journey campaign shared library — state-integrity helpers.
 * Every DB verification reads the REAL cloud database (server truth).
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3040";
export const POOL = new Pool({ connectionString: process.env.DATABASE_URL });
export const RESULTS_DIR = path.resolve("tests/results");

export async function q(sql, params = []) {
  const r = await POOL.query(sql, params);
  return r.rows;
}

let purgePoolReady = true;
export async function purgeRateLimit() {
  if (!purgePoolReady) return;
  try {
    await POOL.query("DELETE FROM rate_limit_hits");
  } catch (e) {
    purgePoolReady = false;
  }
}

/* ── results recording ── */
export const campaigns = {};
export function recorder(name) {
  const results = [];
  let counter = 0;
  campaigns[name] = { name, results, counter: () => counter, all: () => results };
  return function record(journey, step, pass, detail = "") {
    counter++;
    results.push({ id: counter, journey, step, pass: !!pass, detail: String(detail).slice(0, 300) });
    const mark = pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${journey} · ${step}${detail ? " — " + detail : ""}`);
  };
}

export async function flush(name, extra = {}) {
  const c = campaigns[name];
  if (!c) return;
  const all = c.all();
  const passed = all.filter((r) => r.pass).length;
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RESULTS_DIR, `${name}.json`),
    JSON.stringify({ name, total: all.length, passed, failed: all.length - passed, ...extra, results: all }, null, 2),
  );
  console.log(`\n════ ${name}: ${passed}/${all.length} ════`);
}

/* ── browser helpers ── */
export async function hydrationWait(page) {
  await page.waitForFunction(
    () => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((k) => k.startsWith("__react"));
    },
    { timeout: 30000 },
  ).catch(() => false);
}

export async function loginUI(page, identifier, password, { expectError = false } = {}) {
  await purgeRateLimit();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await hydrationWait(page);
  let status = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const wait = page.waitForResponse((r) => r.url().includes("/api/v1/auth/login"), { timeout: 15000 }).catch(() => null);
    await page.locator('input[autocomplete="username"]').first().fill(identifier);
    await page.locator('input[autocomplete="current-password"], input[type="password"]').first().fill(password);
    await page.locator('button:has-text("تسجيل الدخول")').first().click();
    const resp = await wait;
    if (resp) { status = resp.status(); break; }
    await page.waitForTimeout(1000);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  return status;
}

export async function registerUI(page, name, email, password, studentPhone, guardianPhone) {
  await purgeRateLimit();
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await hydrationWait(page);
  await page.locator('input[autocomplete="name"]').first().fill(name);
  await page.locator('input[autocomplete="email"]').first().fill(email);
  const tels = page.locator('input[autocomplete="tel"]');
  const n = await tels.count();
  if (n >= 2) { await tels.nth(0).fill(studentPhone); await tels.nth(1).fill(guardianPhone); }
  else if (n === 1) await tels.first().fill(studentPhone || guardianPhone);
  await page.locator('input[autocomplete="new-password"]').first().fill(password);
  const wait = page.waitForResponse((r) => r.url().includes("/api/v1/auth/register"), { timeout: 20000 }).catch(() => null);
  await page.locator('button:has-text("إنشاء الحساب")').first().click();
  const resp = await wait;
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  return resp?.status?.() ?? null;
}

/* ── shell detection (from source contract: chrome-routes.ts + shells) ── */
export async function detectShell(page) {
  return page.evaluate(() => {
    const has = (s) => !!document.querySelector(s);
    const textIncludes = (s) => (document.body.textContent || "").includes(s);
    // Public chrome = the shared SiteHeader's in-header nav carrying the public
    // links (incl. "الرئيسية"). Assert product semantics — header-scoped nav
    // plus public link text — not one specific aria-label string, which is a
    // presentational detail that changed without altering UX (ULTRA P3 fix:
    // the old `header nav[aria-label="التنقل الرئيسي"]` selector drifted from
    // the rendered label while the nav itself stayed correct).
    // App shells render their own sidebar/topbar navs (aside, dashboard
    // layouts) which must NOT count as public chrome.
    const publicNavEl =
      [...document.querySelectorAll("header nav")].find((n) =>
        (n.textContent || "").includes("الرئيسية"),
      ) || null;
    const publicNav = !!publicNavEl;
    const navLinks = [...document.querySelectorAll("header nav a, nav a")].map((e) => (e.textContent || "").trim());
    return {
      url: location.pathname,
      logoutBtn: has('button[aria-label*="تسجيل الخروج"]'),
      aside: has("aside"),
      notifBell: has('button[aria-label*="التنبيهات"], a[aria-label*="التنبيهات"]'),
      publicNav,
      footer: has("footer"),
      adminMark: textIncludes("لوحة الإدارة") || textIncludes("الإدارة الأكاديمية"),
      parentMark: textIncludes("بوابة أولياء الأمور") || textIncludes("بوابة ولي الأمر"),
    };
  }).catch((e) => ({ error: e.message }));
}

export function consoleGuard(page) {
  const errors = [];
  // Ignored noise: favicon/net (env), webpack-hmr (dev only), React/dev hints,
  // expected 401/404 API statuses, and third-party iframe probes blocked by our
  // own Permissions-Policy (e.g. YouTube embed probing compute-pressure — the
  // restriction is intentional per next.config.ts, user impact nil).
  const onConsole = (m) => { if (m.type() === "error" && !/favicon|net::ERR|WebSocket|webpack-hmr|Download the React|401|404|Permissions policy|compute-pressure/.test(m.text())) errors.push(m.text().slice(0, 200)); };
  const onPageError = (e) => errors.push("PAGEERROR: " + String(e).slice(0, 220));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return {
    errors,
    stop() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    },
  };
}

/* ── DB truth helpers ── */
export async function userByEmail(email) {
  const r = await POOL.query("select id, name, email, role, is_active from users where email=$1", [email]);
  return r.rows[0] ?? null;
}
export async function subscriptionsFor(userId) {
  const r = await POOL.query("select * from subscriptions where user_id=$1", [userId]);
  return r.rows;
}
export async function progressRows(userId) {
  const r = await POOL.query("select video_id, watched_seconds, completed_at, updated_at from student_progress where user_id=$1 order by updated_at desc", [userId]);
  return r.rows;
}
export async function attemptsFor(userId, examId) {
  const r = await POOL.query(
    "select id, score, total_marks, answers, started_at, submitted_at from exam_attempts where user_id=$1 and exam_id=$2 order by started_at desc",
    [userId, examId ?? null],
  );
  return r.rows;
}
export async function sessionCount(userId) {
  const r = await POOL.query("select count(*)::int as c from sessions where user_id=$1", [userId]);
  return r.rows[0].c;
}
export async function killSessions(userId) {
  await POOL.query("delete from sessions where user_id=$1", [userId]);
}
export async function walletBalance(userId) {
  const r = await POOL.query("select balance_cents from wallet_accounts where user_id=$1", [userId]);
  return r.rows[0]?.balance_cents ?? null;
}
export async function prefsFile(userId) {
  // DB-backed since the P1 fix (user_preferences table). Same shape as before
  // ({density, notifications}) so call sites are unchanged; works against any
  // environment because it reads server truth, not local files.
  try {
    const r = await POOL.query(
      "select density, notif_community, notif_exam_results, notif_wallet, notif_marketing from user_preferences where user_id=$1",
      [userId],
    );
    const p = r.rows[0];
    if (!p) return null;
    return {
      density: p.density,
      notifications: { community: p.notif_community, examResults: p.notif_exam_results, wallet: p.notif_wallet, marketing: p.notif_marketing },
    };
  } catch {
    return null;
  }
}
export async function apiLogin(identifier, password) {
  const res = await fetch(BASE + "/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: identifier, password }),
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const m = setCookie.match(/dros_session=([^;]+)/);
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, cookie: m ? `dros_session=${m[1]}` : null };
}
