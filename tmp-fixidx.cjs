const fs = require("fs");
const { Pool } = require("pg");
const url = fs.readFileSync(".env.local", "utf8").trim().replace("DATABASE_URL=", "");
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 1 });

// All uniqueness the drizzle schema requires
const REQUIRED = {
  users: [{ name: "users_email_unique", cols: ["email"] }],
  sessions: [{ name: "sessions_token_unique", cols: ["token"] }],
  academic_stages: [{ name: "academic_stages_slug_unique", cols: ["slug"] }],
  grades: [{ name: "grades_slug_unique", cols: ["slug"] }],
  subjects: [{ name: "subjects_slug_unique", cols: ["slug"] }],
  courses: [{ name: "courses_slug_unique", cols: ["slug"] }],
  subscriptions: [{ name: "subs_user_course_unique", cols: ["user_id", "course_id"] }],
  coupons: [{ name: "coupons_code_unique", cols: ["code"] }],
  coupon_redemptions: [{ name: "coupon_redemptions_unique", cols: ["coupon_id", "user_id"] }],
  wallet_accounts: [{ name: "wallet_accounts_user_unique", cols: ["user_id"] }],
  invoices: [
    { name: "invoices_number_unique", cols: ["number"] },
    { name: "invoices_order_unique", cols: ["order_id"] },
  ],
  parent_links: [{ name: "parent_child_unique", cols: ["parent_id", "student_id"] }],
  student_progress: [{ name: "progress_user_video_unique", cols: ["user_id", "video_id"] }],
};

(async () => {
  const existing = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public'
  `);
  const have = new Set(existing.rows.map((r) => r.indexname));
  // also treat table-level UNIQUE constraints as coverage
  const cons = await pool.query(`
    SELECT conrelid::regclass::text as tbl, conname
    FROM pg_constraint WHERE contype='u' AND connamespace='public'::regnamespace
  `);
  cons.rows.forEach((r) => have.add(r.conname));

  const fixes = [];
  for (const [table, items] of Object.entries(REQUIRED)) {
    for (const item of items) {
      if (!have.has(item.name)) {
        const cols = item.cols.join(",");
        fixes.push(
          `CREATE UNIQUE INDEX IF NOT EXISTS ${item.name} ON "${table}" (${cols});`
        );
      }
    }
  }
  console.log(fixes.length ? "MISSING:\n" + fixes.join("\n") : "none missing");
  for (const stmt of fixes) {
    await pool.query(stmt);
    console.log("applied:", stmt.slice(0, 70));
  }
  await pool.end();
})();
