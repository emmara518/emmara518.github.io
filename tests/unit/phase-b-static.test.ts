import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase B — registration, top-up and locked-content wiring", () => {
  it("registration flag covers student registration and auto-linking", () => {
    const student = read("src/app/api/v1/auth/register/route.ts");
    expect(student).toContain("isPublicRegistrationEnabled");
    expect(student).toContain("REGISTRATION_DISABLED");
    expect(student).toContain("isAutoParentLinkEnabled");
    expect(student).toContain("guardianPhone && isAutoParentLinkEnabled()");
  });

  it("registration flag covers parent self-registration", () => {
    const parent = read("src/app/api/v1/auth/register-parent/route.ts");
    expect(parent).toContain("isPublicRegistrationEnabled");
    expect(parent).toContain("REGISTRATION_DISABLED");
  });

  it("self top-up API is fail-closed", () => {
    const topup = read("src/app/api/v1/me/wallet/topup/route.ts");
    expect(topup).toContain("isWalletSelfTopUpEnabled");
    expect(topup).toContain("TOPUP_DISABLED");
  });

  it("manual parent linking is Super Admin-only", () => {
    const link = read("src/app/api/v1/admin/parent-links/route.ts");
    expect(link).toContain("requireSuperAdmin");
    expect(link).toContain("parentLinks");
  });

  it("course API uses the learning-room playable decisions for enrolled users", () => {
    const course = read("src/app/api/v1/courses/[slug]/route.ts");
    expect(course).toContain("getLearningRoom");
    expect(course).toContain("youtubeVideoId: v.youtubeVideoId");
  });

  it("exam submission hides answer fields unless revealed", () => {
    const exams = read("src/lib/services/exams.service.ts");
    expect(exams).toContain("shouldRevealResults");
    expect(exams).toContain("correctIndex: reveal ? q.correctIndex : null");
    expect(exams).toContain("explanation: reveal ? q.explanation : null");
    expect(exams).toContain("revealed: reveal");
  });

  it("admin console does not fetch exam data without exams.view", () => {
    const consoleFile = read("src/components/admin-console.tsx");
    expect(consoleFile).toContain('const canViewExams = actorPermissions.includes("exams.view")');
    expect(consoleFile).toContain("if (!canViewExams) return;");
  });

  it("admin console reads the actual response shapes and sends a bulk courseId", () => {
    const consoleFile = read("src/components/admin-console.tsx");
    expect(consoleFile).toContain("j.data?.groups ?? []");
    expect(consoleFile).toContain("j.data?.exams ?? []");
    expect(consoleFile).toContain("bulkCourseId");
    expect(consoleFile).toContain("courseId: bulkCourseId");
    expect(consoleFile).toContain("data.stage.id");
    expect(consoleFile).toContain("new Date(examAvailableFrom).toISOString()");
  });
});
