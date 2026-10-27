import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSetupUrl,
  generateSetupToken,
  hashSetupToken,
  invitationExpiresAt,
  isValidSetupToken,
} from "@/lib/student-invitations";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("student invitation tokens", () => {
  it("generates high-entropy tokens and stores only a verifier", () => {
    const token = generateSetupToken();
    expect(isValidSetupToken(token)).toBe(true);
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashSetupToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSetupToken(token)).not.toBe(token);
    expect(hashSetupToken(token)).toBe(hashSetupToken(token));
  });

  it("rejects malformed tokens", () => {
    expect(isValidSetupToken("")).toBe(false);
    expect(isValidSetupToken("short")).toBe(false);
    expect(isValidSetupToken("a".repeat(39))).toBe(false);
    expect(isValidSetupToken("a".repeat(65))).toBe(false);
  });

  it("builds a fragment-based setup URL with a bounded TTL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uat.example.test/");
    vi.stubEnv("STUDENT_INVITATION_TTL_MINUTES", "30");
    const token = generateSetupToken();
    const url = new URL(buildSetupUrl(token));
    expect(url.origin).toBe("https://uat.example.test");
    expect(url.pathname).toBe("/setup-password");
    expect(url.hash).toBe(`#token=${token}`);
    expect(url.search).toBe("");
    const ttl = invitationExpiresAt(new Date("2026-01-01T00:00:00Z")).getTime() - new Date("2026-01-01T00:00:00Z").getTime();
    expect(ttl).toBe(30 * 60 * 1000);
  });

  it("fails closed when production has no configured app URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(() => buildSetupUrl(generateSetupToken())).toThrow();
  });

  it("rejects a production request origin that differs from the configured URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uat.example.test");
    expect(() => buildSetupUrl(generateSetupToken(), "https://other.example.test")).toThrow();
  });
});

describe("student invitation wiring", () => {
  it("keeps invitation creation Super Admin-only and password-free", () => {
    const route = read("src/app/api/v1/admin/users/create-student/route.ts");
    expect(route).toContain("requireSuperAdmin");
    expect(route).toContain("createStudentInvitation");
    expect(route).not.toContain("password");
  });

  it("uses the setup service with transaction, expiry, revocation, and audit", () => {
    const service = read("src/lib/student-invitations.ts");
    expect(service).toContain("tokenHash");
    expect(service).toContain("expiresAt");
    expect(service).toContain("consumedAt");
    expect(service).toContain("revokedAt");
    expect(service).toContain("db.transaction");
    expect(service).toContain("hashPassword");
    expect(service).toContain("student_invitations.create");
    expect(service).toContain("student_invitations.consume");
    expect(service).not.toContain("console.");
  });

  it("rate-limits setup and does not expose a token in audit meta", () => {
    const route = read("src/app/api/v1/auth/student-setup/route.ts");
    expect(route).toContain("applyRateLimit");
    expect(route).toContain("failClosed: true");
    expect(route).toContain("consumeStudentInvitation");
    const service = read("src/lib/student-invitations.ts");
    expect(service).toContain("meta: { invitationId: invitation.id }");
    expect(service).not.toContain("meta: { token");
  });

  it("reads the token from the fragment and clears it from the visible URL", () => {
    const form = read("src/components/student-setup-form.tsx");
    expect(form).toContain("window.location.hash");
    expect(form).toContain("history.replaceState");
    expect(form).toContain("/api/v1/auth/student-setup");
    expect(form).not.toContain("localStorage");
    expect(form).not.toContain("console.");
  });

  it("has the invitation table in schema, init SQL, and migration", () => {
    expect(read("src/db/schema.ts")).toContain('"student_invitations"');
    expect(read("src/db/init-sql.ts")).toContain('"student_invitations"');
    expect(read("drizzle/0002_student_invitations.sql")).toContain('"student_invitations"');
  });
});
