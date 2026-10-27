import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDemoSeedAllowed, seedDatabase } from "@/db/seed";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo seed production guard", () => {
  it("allows demo seeding only in explicit development/test environments", () => {
    expect(isDemoSeedAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isDemoSeedAllowed({ NODE_ENV: "test" })).toBe(true);
    expect(isDemoSeedAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isDemoSeedAllowed({})).toBe(false);
  });

  it("refuses demo seeding before touching the database in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(seedDatabase({} as never)).rejects.toThrow("disabled");
  });
});

describe("public demo credential remediation", () => {
  it("removes demo quick-login credentials from the login form", () => {
    const source = read("src/components/auth-forms.tsx");
    expect(source).not.toContain("quickLogin");
    expect(source).not.toContain("IS_DEV");
    expect(source).not.toContain("dros-math.com");
    expect(source).toContain("/api/v1/auth/login");
  });

  it("removes credential display from the public hero", () => {
    const source = read("src/components/hero-math-3d.tsx");
    expect(source).not.toContain("DEMO ACCESS");
    expect(source).not.toContain("dros-math.com");
  });

  it("removes the fixed new-student password from the admin console", () => {
    const source = read("src/components/admin-console.tsx");
    expect(source).not.toContain("newStudentPass");
    expect(source).toContain("تدفق آمن");
  });

  it("disables student provisioning until a secure setup flow exists", () => {
    const route = read("src/app/api/v1/admin/users/create-student/route.ts");
    expect(route).toContain("STUDENT_PROVISIONING_DISABLED");
    expect(route).toContain("requireSuperAdmin");
    expect(route).not.toContain("registerSchema");
    expect(route).not.toContain("passwordHash");
  });

  it("does not keep a hard-coded demo password in seed source", () => {
    const source = read("src/db/seed.ts");
    expect(source).toContain("isDemoSeedAllowed");
    expect(source).toContain("resolveSeedPassword");
    expect(source).toContain("DEMO_SEED_PASSWORD");
    expect(source).not.toContain("const DEMO_PASSWORD =");
    expect(source).not.toContain('const MASTER_ADMIN_PASSWORD = "');
  });

  it("keeps the production database bootstrap from demo seeding", () => {
    const source = read("src/db/index.ts");
    expect(source).toContain("isDemoSeedAllowed");
  });

  it("redacts reusable demo credentials in security documentation", () => {
    const source = read("docs/audit-AGENT-06-auth-rbac-security.md");
    expect(source).toContain("[REDACTED_DEMO_PASSWORD]");
    expect(source).not.toContain("dros-math.com");
    expect(source).not.toMatch(/\b\d{8}\b/);
  });
});
