import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GRANULAR_PERMISSIONS,
  TEACHER_GRANTS,
  effectiveGranularPermissions,
  hasGranularPermission,
} from "@/lib/rbac";
import {
  visibleCategories,
  visibleSubFeatures,
  findCategory,
} from "@/components/admin/nav-config";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const adminRoutes = (relative: string) => read(`src/app/api/v1/admin/${relative}`);

describe("Phase A — teacher permission containment", () => {
  it("teacher gets only teaching permissions", () => {
    const effective = effectiveGranularPermissions("teacher", []);
    expect(effective).toEqual([...TEACHER_GRANTS]);
    for (const p of ["wallet.adjust", "wallet.view", "orders.view", "orders.manage", "subscriptions.view", "subscriptions.manage", "students.view", "students.edit", "users.view", "users.edit", "activation.create", "notifications.manage", "audit.view"] as const) {
      expect(effective).not.toContain(p);
      expect(hasGranularPermission("teacher", [], p)).toBe(false);
    }
  });

  it("teacher keeps content/exam/assignment/community operations", () => {
    for (const p of ["courses.view", "courses.edit", "content.create", "exams.manage", "assignments.manage", "community.manage"] as const) {
      expect(hasGranularPermission("teacher", [], p)).toBe(true);
    }
  });

  it("teacher sees content categories only", () => {
    const effective = effectiveGranularPermissions("teacher", []);
    const categories = visibleCategories(effective, "teacher").map((c) => c.id);
    expect(categories).toContain("academic");
    expect(categories).toContain("exams");
    expect(categories).toContain("communications");
    expect(categories).not.toContain("overview");
    expect(categories).not.toContain("billing_codes");
    expect(categories).not.toContain("users");
    expect(categories).not.toContain("advanced_search");
    expect(categories).not.toContain("assistants");
  });

  it("teacher sees community but not mass broadcast", () => {
    const effective = effectiveGranularPermissions("teacher", []);
    const communications = findCategory("communications");
    expect(communications).toBeTruthy();
    const subs = visibleSubFeatures(communications!, effective, "teacher").map((s) => s.id);
    expect(subs).toContain("community_groups");
    expect(subs).toContain("forum_pending_topics");
    expect(subs).not.toContain("sms_messages");
  });
});

describe("Phase A — assistant default deny and explicit grants", () => {
  it("zero-permission assistant sees no categories or sub-features", () => {
    expect(visibleCategories([], "assistant")).toEqual([]);
  });

  it("assistant with students.view sees users but not account mutation panels", () => {
    const effective = effectiveGranularPermissions("assistant", ["students.view"]);
    const users = findCategory("users");
    expect(users).toBeTruthy();
    const subs = visibleSubFeatures(users!, effective, "assistant").map((s) => s.id);
    expect(subs).toContain("users_table");
    expect(subs).not.toContain("add_student");
    expect(subs).not.toContain("manage_admin");
    expect(subs).not.toContain("login_sessions");
  });

  it("assistant with community.manage sees community but not broadcast", () => {
    const effective = effectiveGranularPermissions("assistant", ["community.manage"]);
    const communications = findCategory("communications");
    expect(communications).toBeTruthy();
    const subs = visibleSubFeatures(communications!, effective, "assistant").map((s) => s.id);
    expect(subs).toContain("community_groups");
    expect(subs).not.toContain("sms_messages");
  });

  it("admin sees every category and sub-feature", () => {
    const effective = effectiveGranularPermissions("admin", []);
    expect(effective).toEqual([...GRANULAR_PERMISSIONS]);
    const categories = visibleCategories(effective, "admin");
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(visibleSubFeatures(cat, effective, "admin")).toEqual(cat.subFeatures);
    }
  });
});

describe("Phase A — server route guards", () => {
  const superAdminRoutes = [
    "users/[id]/profile/route.ts",
    "users/[id]/route.ts",
    "users/[id]/wallet/route.ts",
    "users/create-student/route.ts",
    "orders/route.ts",
    "sessions/route.ts",
    "sessions/[id]/route.ts",
    "payment-requests/route.ts",
    "payment-requests/[id]/issue/route.ts",
    "payment-requests/[id]/reject/route.ts",
    "payment-requests/[id]/screenshot/route.ts",
    "payment-channels/route.ts",
    "payment-channels/[id]/route.ts",
    "payment-channels/reorder/route.ts",
    "coupons/route.ts",
    "coupons/[id]/route.ts",
    "coupons/batch/route.ts",
    "subscriptions/[id]/route.ts",
    "subscriptions/[id]/cancel/route.ts",
    "billing/manual-enroll/route.ts",
  ];

  for (const route of superAdminRoutes) {
    it(`${route} requires Super Admin`, () => {
      expect(adminRoutes(route)).toContain("requireSuperAdmin");
    });
  }

  it("content routes require granular teaching permissions", () => {
    const expectations: [string, string][] = [
      ["assignments/route.ts", 'requirePermission("assignments.manage")'],
      ["community/posts/[id]/route.ts", 'requirePermission("community.manage")'],
      ["community-groups/route.ts", 'requirePermission("community.manage")'],
      ["exam-groups/route.ts", 'requirePermission("exams.'],
      ["exams/[id]/route.ts", 'requirePermission("exams.edit")'],
      ["questions/route.ts", 'requirePermission("exams.create")'],
      ["stages/route.ts", 'requirePermission("courses.'],
      ["courses/route.ts", 'requirePermission("courses.'],
      ["lessons/route.ts", 'requirePermission("content.'],
      ["videos/route.ts", 'requirePermission("content.'],
      ["course-files/route.ts", 'requirePermission("content.'],
    ];
    for (const [route, needle] of expectations) {
      expect(adminRoutes(route)).toContain(needle);
    }
  });

  it("no admin route still uses the legacy admin:write/admin:read gates", () => {
    const root = path.join(process.cwd(), "src/app/api/v1/admin");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name === "route.ts") files.push(p);
      }
    };
    walk(root);
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, file).not.toContain('"admin:write"');
      expect(source, file).not.toContain('"admin:read"');
    }
  });

  it("profile PATCH is Super Admin-only and hashes the new password", () => {
    const source = adminRoutes("users/[id]/profile/route.ts");
    expect(source).toContain("requireSuperAdmin");
    expect(source).toContain("hashPassword");
    expect(source).toContain("newPassword");
  });
});
