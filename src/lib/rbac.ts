/**
 * RBAC — single source of truth for roles and permissions.
 * Every authorization decision in pages, API handlers and services
 * resolves through this module. Never inline role strings elsewhere.
 */
export const ROLES = ["student", "parent", "center", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: "طالب",
  parent: "ولي أمر",
  center: "سنتر",
  teacher: "مدرّس",
  admin: "مدير النظام",
};

/** Roles that may enter the admin console. */
export const ADMIN_ROLES: readonly Role[] = ["teacher", "admin"];

export type Permission =
  | "catalog:read"
  | "course:enroll"
  | "course:learn"
  | "exam:attempt"
  | "progress:write"
  | "wallet:use"
  | "admin:read"
  | "admin:write"
  | "users:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  student: ["catalog:read", "course:enroll", "course:learn", "exam:attempt", "progress:write", "wallet:use"],
  parent: ["catalog:read"],
  center: ["catalog:read", "admin:read"],
  teacher: ["catalog:read", "admin:read", "admin:write", "audit:read"],
  admin: [
    "catalog:read",
    "course:enroll",
    "course:learn",
    "exam:attempt",
    "progress:write",
    "wallet:use",
    "admin:read",
    "admin:write",
    "users:manage",
    "audit:read",
  ],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
