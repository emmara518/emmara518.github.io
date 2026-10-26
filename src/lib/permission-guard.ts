import type { NextResponse } from "next/server";
import { requireApiUser, type SessionUser } from "./auth";
import { err } from "./http";
import {
  CONSOLE_ROLES,
  effectiveGranularPermissions,
  hasGranularPermission,
  type GranularPermission,
} from "./rbac";
import { getAssistantPermissionSet } from "./assistant-permissions";

/**
 * Server-side granular permission gates.
 *
 * Usage in a route handler:
 *   const gate = await requirePermission("students.edit");
 *   if ("response" in gate) return gate.response;
 *   // gate.user is the authenticated actor
 *
 * Enforced for every request, independent of any UI visibility. Assistants
 * are default-deny; Super Admins are implicitly allowed everything; teachers
 * receive only the explicit teaching allowlist.
 */

export type PermissionGrant = { user: SessionUser; granted: GranularPermission[] };

/** Resolve the effective granular permissions for the current console actor. */
export async function effectivePermissionsForUser(
  user: SessionUser,
): Promise<GranularPermission[]> {
  const granted =
    user.role === "assistant" ? await getAssistantPermissionSet(user.id) : [];
  return effectiveGranularPermissions(user.role, granted);
}

export async function requirePermission(
  permission: GranularPermission,
): Promise<PermissionGrant | { response: NextResponse }> {
  const auth = await requireApiUser(CONSOLE_ROLES);
  if (!("user" in auth)) {
    return {
      response: err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية"),
    };
  }
  const user = auth.user;
  const granted = user.role === "assistant" ? await getAssistantPermissionSet(user.id) : [];
  if (!hasGranularPermission(user.role, granted, permission)) {
    return { response: err(403, "FORBIDDEN", "لا تملك هذه الصلاحية") };
  }
  return { user, granted };
}

/** Assistant management is exclusive to the Super Admin role. */
export async function requireSuperAdmin(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const auth = await requireApiUser(CONSOLE_ROLES);
  if (!("user" in auth)) {
    return {
      response: err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية"),
    };
  }
  if (auth.user.role !== "admin") {
    return { response: err(403, "FORBIDDEN", "هذه العملية للمدير العام فقط") };
  }
  return { user: auth.user };
}
