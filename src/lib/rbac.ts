/**
 * RBAC — single source of truth for roles and permissions.
 * Every authorization decision in pages, API handlers and services
 * resolves through this module. Never inline role strings elsewhere.
 *
 * Two layers exist side by side:
 *  1. LEGACY role permissions (`Permission`, `admin:read`, `admin:write`, …)
 *     drive the admin console shell and existing role behaviour. Unchanged.
 *  2. GRANULAR permissions (`GranularPermission`, `students.edit`, …) exist
 *     so a Super Admin can grant an Assistant a precise, least-privilege set.
 *     Assistants start with NOTHING and receive only what is explicitly
 *     granted (see src/lib/assistant-permissions.ts).
 */
export const ROLES = ["student", "parent", "center", "teacher", "assistant", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: "طالب",
  parent: "ولي أمر",
  center: "سنتر",
  teacher: "مدرّس",
  assistant: "مساعد إداري",
  admin: "مدير النظام",
};

/** Roles that may enter the admin console. */
export const ADMIN_ROLES: readonly Role[] = ["teacher", "admin"];

/**
 * Roles permitted to OPEN the admin console shell. Assistants get the shell,
 * but every admin API they can reach is gated individually by requirePermission.
 * NB: ADMIN_ROLES intentionally excludes assistants so that any admin route
 * that still uses the legacy `requireApiUser(ADMIN_ROLES)` gate stays closed to
 * them (default deny).
 */
export const CONSOLE_ROLES: readonly Role[] = ["teacher", "assistant", "admin"];

/** Only the Super Admin role. Assistant management is exclusive to it. */
export function isSuperAdmin(role: Role): boolean {
  return role === "admin";
}

export function isAssistant(role: Role): boolean {
  return role === "assistant";
}

export type Permission =
  | "catalog:read"
  | "course:enroll"
  | "course:learn"
  | "exam:attempt"
  | "progress:write"
  | "wallet:use"
  | "children:read"
  | "admin:read"
  | "admin:write"
  | "users:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  student: ["catalog:read", "course:enroll", "course:learn", "exam:attempt", "progress:write", "wallet:use"],
  parent: ["catalog:read", "children:read"],
  center: ["catalog:read", "admin:read"],
  // Teachers manage teaching content only. Financial, account and PII
  // capabilities are granular and deliberately absent from this legacy list.
  teacher: ["catalog:read"],
  // Assistants get the console shell via CONSOLE_ROLES; every capability is
  // an explicit granular grant (default deny). No legacy admin:read.
  assistant: [],
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
  return CONSOLE_ROLES.includes(role);
}

/* ── Granular permission catalog ────────────────────────────────────────────
 * Only real capabilities that exist in the platform. Each maps to a specific
 * server operation enforced via requirePermission(). Assistant management and
 * system settings are intentionally NOT grantable — they remain Super-Admin
 * exclusive by design. */

export const GRANULAR_PERMISSIONS = [
  "users.view",
  "users.edit",
  "students.view",
  "students.edit",
  "courses.view",
  "courses.create",
  "courses.edit",
  "courses.delete",
  "content.view",
  "content.create",
  "content.edit",
  "content.delete",
  "activation.view",
  "activation.create",
  "activation.revoke",
  "orders.view",
  "orders.manage",
  "subscriptions.view",
  "subscriptions.manage",
  "exams.view",
  "exams.create",
  "exams.edit",
  "exams.manage",
  "assignments.manage",
  "community.manage",
  "wallet.view",
  "wallet.adjust",
  "notifications.view",
  "notifications.manage",
  "audit.view",
] as const;

export type GranularPermission = (typeof GRANULAR_PERMISSIONS)[number];

const GRANULAR_SET: ReadonlySet<string> = new Set(GRANULAR_PERMISSIONS);

export function isGranularPermission(value: string): value is GranularPermission {
  return GRANULAR_SET.has(value);
}

/** Grouped for the admin UI checkbox matrix. */
export const PERMISSION_GROUPS: { key: string; label: string; permissions: GranularPermission[] }[] = [
  { key: "students", label: "الطلاب والمستخدمون", permissions: ["students.view", "students.edit", "users.view", "users.edit"] },
  { key: "courses", label: "الكورسات والمقررات", permissions: ["courses.view", "courses.create", "courses.edit", "courses.delete"] },
  { key: "content", label: "المحتوى (دروس/فيديو/ملفات/واجبات)", permissions: ["content.view", "content.create", "content.edit", "content.delete", "assignments.manage"] },
  { key: "activation", label: "الأكواد والتفعيل", permissions: ["activation.view", "activation.create", "activation.revoke"] },
  { key: "orders", label: "الطلبات والاشتراكات", permissions: ["orders.view", "orders.manage", "subscriptions.view", "subscriptions.manage"] },
  { key: "exams", label: "الامتحانات وبنك الأسئلة", permissions: ["exams.view", "exams.create", "exams.edit", "exams.manage"] },
  { key: "wallet", label: "المحفظة والمالية", permissions: ["wallet.view", "wallet.adjust"] },
  { key: "notifications", label: "التنبيهات والمجتمع", permissions: ["notifications.view", "notifications.manage", "community.manage"] },
  { key: "audit", label: "سجل التدقيق", permissions: ["audit.view"] },
];

/** Highest-risk capabilities. Never granted implicitly; flagged in the UI. */
export const HIGH_RISK_PERMISSIONS: readonly GranularPermission[] = [
  "wallet.adjust",
  "subscriptions.manage",
  "users.edit",
  "courses.delete",
  "content.delete",
  "activation.revoke",
];

/**
 * Explicit teaching allowlist. Teachers keep content operations only.
 * Financial, account, PII, activation and broadcast permissions are absent.
 */
export const TEACHER_GRANTS: readonly GranularPermission[] = [
  "courses.view",
  "courses.create",
  "courses.edit",
  "courses.delete",
  "content.view",
  "content.create",
  "content.edit",
  "content.delete",
  "exams.view",
  "exams.create",
  "exams.edit",
  "exams.manage",
  "assignments.manage",
  "community.manage",
];

/**
 * Pure permission decision for a granular capability.
 * - admin (Super Admin): implicit full access.
 * - teacher: ONLY the explicit teaching allowlist above.
 * - assistant: ONLY explicitly granted permissions (default deny).
 * - everyone else: denied.
 */
export function hasGranularPermission(
  role: Role,
  granted: readonly string[] | undefined,
  permission: GranularPermission,
): boolean {
  if (role === "admin") return true;
  if (role === "teacher") return TEACHER_GRANTS.includes(permission);
  if (role === "assistant") return (granted ?? []).includes(permission);
  return false;
}

/** Effective granular permissions for console navigation and data loading. */
export function effectiveGranularPermissions(
  role: Role,
  granted: readonly string[] | undefined,
): GranularPermission[] {
  if (role === "admin") return [...GRANULAR_PERMISSIONS];
  if (role === "teacher") return [...TEACHER_GRANTS];
  if (role === "assistant") {
    return [...new Set((granted ?? []).filter(isGranularPermission))];
  }
  return [];
}
