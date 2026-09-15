/**
 * Playwright spot checks — standalone 3040 only, read-only navigation.
 * Validates shell/topbar/route/auth-gate/loading/error/empty/recovery
 * on representative pages. No mutations, no prod.
 */
import { chromium } from "playwright";
const BASE = "http://127.0.0.1:3040";
const b = await chromium.launch();
const ctx = await b.newContext({ locale: "ar-EG" });
const p = await ctx.newPage();
let pass = 0, fail = 0;
const check = (n, c, d = "") => { if (c) { pass++; console.log(`[PASS] ${n}`); } else { fail++; console.log(`[FAIL] ${n} ${d}`); } };

// 1. Home: public shell with main nav
await p.goto(BASE + "/", { waitUntil: "networkidle" }).catch(() => {});
check("spot-home-200", p.url().startsWith(BASE));
const pubNav = await p.evaluate(() =>
  [...document.querySelectorAll("header nav")].filter((n) =>
    (n.textContent || "").includes("الرئيسية"),
  ).length,
);
check("spot-home-public-shell", pubNav >= 1, `nav=${pubNav}`);

// 2. Login page renders + Arabic CTA
await p.goto(BASE + "/login", { waitUntil: "networkidle" }).catch(() => {});
const loginBtn = await p.locator('button:has-text("تسجيل الدخول")').count();
check("spot-login-cta-ar", loginBtn >= 1, `btn=${loginBtn}`);

// 3. Dashboard unauth -> redirect to login (auth gate, no private shell leak)
await p.goto(BASE + "/dashboard", { waitUntil: "networkidle" }).catch(() => {});
await p.waitForTimeout(1500);
const durl = p.url();
check("spot-dashboard-gate", durl.includes("/login"), durl);
// No public chrome false-positive: dashboard must not render app content unauth
const dashLeak = await p.content().then((h) => h.includes("لوحة التحكم") && !durl.includes("/login") ? true : false);
check("spot-no-private-leak", !dashLeak);

// 4. Prefs API unauth shape (Arabic 401)
const r = await p.request.get(BASE + "/api/v1/me/preferences").catch(() => null);
const j = r ? await r.json().catch(() => null) : null;
check("spot-prefs-401-ar", r?.status() === 401 && j?.error?.message?.includes("سجل"), `st=${r?.status()}`);

// 5. Catalog renders (empty or list, no crash)
await p.goto(BASE + "/courses", { waitUntil: "networkidle" }).catch(() => {});
const catBody = (await p.content()).length;
check("spot-catalog-renders", catBody > 5000, `len=${catBody}`);

// 6. 404 route -> handled (not blank 500)
await p.goto(BASE + "/no-such-route-ultra", { waitUntil: "domcontentloaded" }).catch(() => {});
const nf = await p.content();
check("spot-404-handled", nf.length > 1000);

// 7. Mobile viewport 390: login still usable
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(BASE + "/login", { waitUntil: "networkidle" }).catch(() => {});
const mBtn = await p.locator('button:has-text("تسجيل الدخول")').count();
check("spot-mobile-390-login", mBtn >= 1);

// 8. Slow network: home still resolves (recovery)
await ctx.route(/.*/, async (route) => { await new Promise((r) => setTimeout(r, 300)); await route.continue(); });
await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
check("spot-slow-recovery", p.url().startsWith(BASE));
await b.close();
console.log(`SPOT-DONE pass=${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
