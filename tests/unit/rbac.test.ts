import { describe, it, expect } from "vitest";
import {
  ROLES,
  ROLE_LABELS,
  ADMIN_ROLES,
  CONSOLE_ROLES,
  isSuperAdmin,
  isAssistant,
  permissionsFor,
  can,
  isAdminRole,
  GRANULAR_PERMISSIONS,
  PERMISSION_GROUPS,
  HIGH_RISK_PERMISSIONS,
  isGranularPermission,
  hasGranularPermission,
  TEACHER_GRANTS,
  effectiveGranularPermissions,
  type Role,
  type Permission,
  type GranularPermission,
} from "@/lib/rbac";

const ALL_PERMISSIONS: Permission[] = [
  "catalog:read",
  "course:enroll",
  "course:learn",
  "exam:attempt",
  "progress:write",
  "wallet:use",
  "children:read",
  "admin:read",
  "admin:write",
  "users:manage",
  "audit:read",
];

describe("RBAC — roles", () => {
  it("exposes exactly 6 roles", () => {
    expect(ROLES).toHaveLength(6);
    expect(new Set(ROLES).size).toBe(6);
  });

  it("every role has an Arabic label", () => {
    for (const r of ROLES) {
      expect(ROLE_LABELS[r]).toBeTruthy();
      expect(typeof ROLE_LABELS[r]).toBe("string");
      expect(ROLE_LABELS[r].length).toBeGreaterThan(0);
    }
  });

  it("admin is the only super admin", () => {
    for (const r of ROLES) {
      expect(isSuperAdmin(r)).toBe(r === "admin");
    }
  });

  it("assistant detection is exact", () => {
    for (const r of ROLES) {
      expect(isAssistant(r)).toBe(r === "assistant");
    }
  });

  it("CONSOLE_ROLES ⊆ ROLES and includes admin", () => {
    for (const r of CONSOLE_ROLES) expect(ROLES).toContain(r);
    expect(CONSOLE_ROLES).toContain("admin");
  });

  it("ADMIN_ROLES excludes assistant (legacy default-deny gate)", () => {
    expect(ADMIN_ROLES).not.toContain("assistant");
    expect(ADMIN_ROLES).toContain("admin");
  });

  it("student/parent/center can never enter legacy admin routes", () => {
    expect(ADMIN_ROLES).not.toContain("student");
    expect(ADMIN_ROLES).not.toContain("parent");
    expect(ADMIN_ROLES).not.toContain("center");
  });
});

describe("RBAC — legacy permission matrix (exhaustive)", () => {
  const matrix: Record<Role, Permission[]> = {
    student: ["catalog:read", "course:enroll", "course:learn", "exam:attempt", "progress:write", "wallet:use"],
    parent: ["catalog:read", "children:read"],
    center: ["catalog:read", "admin:read"],
    teacher: ["catalog:read"],
    assistant: [],
    admin: ALL_PERMISSIONS.filter((p) => p !== "children:read"),
  };

  for (const role of ROLES) {
    for (const perm of ALL_PERMISSIONS) {
      const expected = matrix[role].includes(perm);
      it(`${role} ${expected ? "HAS" : "LACKS"} ${perm}`, () => {
        expect(can(role, perm)).toBe(expected);
        expect(permissionsFor(role).includes(perm)).toBe(expected);
      });
    }
  }

  it("permissionsFor returns empty for unknown role (defensive)", () => {
    // @ts-expect-error unknown role probe
    expect(permissionsFor("hacker")).toEqual([]);
    // @ts-expect-error unknown role probe
    expect(can("hacker", "admin:write")).toBe(false);
  });

  it("admin holds every permission EXCEPT children:read (DESIGN FINDING F-UNIT-1)", () => {
    for (const p of ALL_PERMISSIONS.filter((x) => x !== "children:read")) expect(can("admin", p)).toBe(true);
    // Documented gap: Super Admin cannot `children:read` — parent-management
    // surfaces must not rely on it. Flagged in the CTO report.
    expect(can("admin", "children:read")).toBe(false);
  });

  it("parent can never enroll/learn/attempt/wallet (children-only viewer)", () => {
    expect(can("parent", "course:enroll")).toBe(false);
    expect(can("parent", "course:learn")).toBe(false);
    expect(can("parent", "exam:attempt")).toBe(false);
    expect(can("parent", "wallet:use")).toBe(false);
    expect(can("parent", "children:read")).toBe(true);
  });

  it("student cannot reach admin surfaces", () => {
    expect(can("student", "admin:read")).toBe(false);
    expect(can("student", "admin:write")).toBe(false);
    expect(can("student", "users:manage")).toBe(false);
    expect(can("student", "audit:read")).toBe(false);
  });

  it("assistant has no legacy permissions (granular only)", () => {
    expect(permissionsFor("assistant")).toEqual([]);
  });

  it("teacher cannot manage users", () => {
    expect(can("teacher", "users:manage")).toBe(false);
  });

  it("isAdminRole matches CONSOLE_ROLES for every role", () => {
    for (const r of ROLES) {
      expect(isAdminRole(r)).toBe(CONSOLE_ROLES.includes(r));
    }
  });
});

describe("RBAC — granular permissions", () => {
  it("catalog is non-empty and every permission is a valid GranularPermission", () => {
    expect(GRANULAR_PERMISSIONS.length).toBeGreaterThanOrEqual(20);
    for (const p of GRANULAR_PERMISSIONS) expect(isGranularPermission(p)).toBe(true);
  });

  it("rejects invalid granular values", () => {
    expect(isGranularPermission("system.settings")).toBe(false);
    expect(isGranularPermission("wallet")).toBe(false);
    expect(isGranularPermission("")).toBe(false);
    expect(isGranularPermission("Wallet.Adjust")).toBe(false);
  });

  it("every grouped permission exists in the catalog and appears exactly once", () => {
    const seen: GranularPermission[] = [];
    for (const g of PERMISSION_GROUPS) {
      for (const p of g.permissions) {
        expect(isGranularPermission(p)).toBe(true);
        seen.push(p);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    for (const p of GRANULAR_PERMISSIONS) expect(seen).toContain(p);
  });

  it("every high-risk permission exists in the catalog", () => {
    for (const p of HIGH_RISK_PERMISSIONS) expect(isGranularPermission(p)).toBe(true);
  });

  it("hasGranularPermission: admin full access", () => {
    for (const p of GRANULAR_PERMISSIONS) {
      expect(hasGranularPermission("admin", [], p)).toBe(true);
      expect(hasGranularPermission("admin", undefined, p)).toBe(true);
    }
  });

  it("hasGranularPermission: teacher gets only the explicit teaching allowlist", () => {
    for (const p of TEACHER_GRANTS) {
      expect(hasGranularPermission("teacher", [], p)).toBe(true);
    }
    for (const p of GRANULAR_PERMISSIONS.filter((x) => !TEACHER_GRANTS.includes(x))) {
      expect(hasGranularPermission("teacher", [], p)).toBe(false);
    }
  });

  it("hasGranularPermission: assistant default-deny, exact grant only", () => {
    for (const p of GRANULAR_PERMISSIONS) {
      expect(hasGranularPermission("assistant", undefined, p)).toBe(false);
      expect(hasGranularPermission("assistant", [], p)).toBe(false);
      expect(hasGranularPermission("assistant", [p], p)).toBe(true);
      expect(hasGranularPermission("assistant", [p], p === "wallet.adjust" ? "audit.view" : "wallet.adjust")).toBe(false);
    }
  });

  it("effectiveGranularPermissions: admin all, teacher allowlist, assistant grants, others none", () => {
    expect(effectiveGranularPermissions("admin", [])).toEqual([...GRANULAR_PERMISSIONS]);
    expect(effectiveGranularPermissions("teacher", [])).toEqual([...TEACHER_GRANTS]);
    expect(effectiveGranularPermissions("assistant", ["students.view", "students.view"])).toEqual(["students.view"]);
    expect(effectiveGranularPermissions("student", ["students.view"])).toEqual([]);
  });

  it("teacher cannot access financial, account, activation or PII permissions", () => {
    for (const p of ["wallet.view", "wallet.adjust", "orders.view", "orders.manage", "subscriptions.view", "subscriptions.manage", "users.view", "users.edit", "students.view", "students.edit", "activation.view", "activation.create", "activation.revoke", "audit.view", "notifications.manage"] as const) {
      expect(hasGranularPermission("teacher", [], p)).toBe(false);
    }
  });

  it("hasGranularPermission: student/parent/center always denied", () => {
    for (const p of GRANULAR_PERMISSIONS) {
      expect(hasGranularPermission("student", ["*"], p)).toBe(false);
      expect(hasGranularPermission("parent", GRANULAR_PERMISSIONS as unknown as string[], p)).toBe(false);
      expect(hasGranularPermission("center", GRANULAR_PERMISSIONS as unknown as string[], p)).toBe(false);
    }
  });
});
