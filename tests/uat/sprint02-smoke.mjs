/**
 * Local UAT regression smoke — 38 checks.
 * Runs only against an explicitly supplied local base URL and generated local
 * credentials. It never targets Production and prints no secrets.
 */
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.UAT_BASE;
const password = process.env.UAT_PASSWORD;
if (!base || !password) {
  console.error("UAT_BASE and UAT_PASSWORD are required");
  process.exit(2);
}

const jars = new Map();
let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${passed.toString().padStart(2, "0")} ${name}`);
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ""}`);
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

function storeCookie(name, response) {
  const list = response.headers.getSetCookie?.() ?? [];
  const raw = list[0] ?? response.headers.get("set-cookie");
  if (!raw) return;
  jars.set(name, raw.split(";")[0]);
}

async function request(name, path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (jars.has(name)) headers.cookie = jars.get(name);
  const response = await fetch(`${base}${path}`, { ...options, headers });
  storeCookie(name, response);
  return response;
}

async function login(name, email, secret = password) {
  const response = await request(name, "/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: secret }),
  });
  return response;
}

async function main() {
  const health = await request("anon", "/api/health");
  check("health endpoint", health.status === 200);

  const catalog = await request("anon", "/api/v1/catalog");
  check("catalog endpoint", catalog.status === 200);

  const courses = await request("anon", "/api/v1/courses");
  check("courses endpoint", courses.status === 200);

  const invalid = await login("anon", "student@dros-math.com", "wrong-password");
  check("invalid login rejected", invalid.status === 401);

  const studentLogin = await login("student", "student@dros-math.com");
  check("student login", studentLogin.status === 200);

  const me = await request("student", "/api/v1/auth/me");
  const meJson = await me.json().catch(() => null);
  check("student me", me.status === 200 && meJson?.data?.user?.role === "student");

  const unauthMe = await request("anon2", "/api/v1/auth/me");
  check("unauthenticated me rejected", unauthMe.status === 401);

  const dashboard = await request("student", "/api/v1/me/dashboard");
  const dashboardJson = await dashboard.json().catch(() => null);
  check("student dashboard", dashboard.status === 200);
  check("student wallet", dashboard.status === 200 && typeof dashboardJson?.data?.wallet?.balanceCents === "number");

  const course = await request("student", "/api/v1/courses/algebra-1sec-term1");
  const courseJson = await course.json().catch(() => null);
  check("learning room", course.status === 200 && courseJson?.data?.lessons?.length > 0);

  const videos = courseJson?.data?.lessons?.flatMap((lesson) => lesson.videos) ?? [];
  const video = videos[3] ?? videos.find((v) => v.durationSec > 0);
  const videoDuration = video?.durationSec ?? 600;

  const zero = await request("student", `/api/v1/videos/${video?.id}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId: video?.id, watchedSeconds: 0, completed: true }),
  });
  const zeroJson = await zero.json().catch(() => null);
  check("zero watch does not complete", zero.status === 200 && zeroJson?.data?.completed === false);

  const negative = await request("student", `/api/v1/videos/${video?.id}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId: video?.id, watchedSeconds: -1, completed: true }),
  });
  check("negative watch rejected", negative.status === 422);

  const excessive = await request("student", `/api/v1/videos/${video?.id}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId: video?.id, watchedSeconds: videoDuration + 1, completed: true }),
  });
  check("excessive watch rejected", excessive.status === 422);

  const unauthProgress = await request("anon2", `/api/v1/videos/${video?.id}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId: video?.id, watchedSeconds: 0 }),
  });
  check("unauthenticated progress rejected", unauthProgress.status === 401);

  const exam = courseJson?.data?.exams?.[0];
  const examRoom = await request("student", `/api/v1/exams/${exam?.id}`);
  const examJson = await examRoom.json().catch(() => null);
  check("exam room", examRoom.status === 200 && examJson?.data?.questions?.length > 0);
  check("server-owned attempt clock", Boolean(examJson?.data?.attemptStart?.id));

  const hidden =
    examJson?.data?.questions?.every(
      (q) => !("correctIndex" in q) && !("explanation" in q),
    ) ?? false;
  check("answers hidden before submit", hidden === true);

  const invalidAnswer = await request("student", `/api/v1/exams/${exam?.id}/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers: [{ questionId: "00000000-0000-4000-8000-000000000000", choiceIndex: 0 }] }),
  });
  check("foreign question rejected", invalidAnswer.status === 422);

  const submitted = await request("student", `/api/v1/exams/${exam?.id}/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers: [] }),
  });
  const submittedJson = await submitted.json().catch(() => null);
  check("exam submitted and graded server-side", submitted.status === 201 && typeof submittedJson?.data?.score === "number");

  const repeated = await request("student", `/api/v1/exams/${exam?.id}/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers: [] }),
  });
  check("repeated attempt rejected", repeated.status === 409);

  const logout = await request("student", "/api/v1/auth/logout", { method: "POST" });
  check("student logout", logout.status === 200);
  const afterLogout = await request("student", "/api/v1/auth/me");
  check("session invalidated after logout", afterLogout.status === 401);

  const teacherLogin = await login("teacher", "teacher@dros-math.com");
  check("teacher login", teacherLogin.status === 200);
  const teacherUsers = await request("teacher", "/api/v1/admin/users");
  check("teacher admin users denied", teacherUsers.status === 403);
  const teacherOrders = await request("teacher", "/api/v1/admin/orders");
  check("teacher financial data denied", teacherOrders.status === 403);
  const teacherInvite = await request("teacher", "/api/v1/admin/users/create-student", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Teacher Invite", email: `teacher-invite-${Date.now()}@example.test` }),
  });
  check("teacher invitation denied", teacherInvite.status === 403);

  const parentLogin = await login("parent", "parent@dros-math.com");
  check("parent login", parentLogin.status === 200);
  const children = await request("parent", "/api/v1/parent/children");
  check("parent children", children.status === 200);
  const parentAdmin = await request("parent", "/api/v1/admin/users");
  check("parent admin denied", parentAdmin.status === 403);

  const adminLogin = await login("admin", "admin", password);
  check("admin login", adminLogin.status === 200);
  const adminUsers = await request("admin", "/api/v1/admin/users");
  check("admin users", adminUsers.status === 200);

  const registration = await request("anon3", "/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Disabled", email: "disabled@example.test", password: "Password123!" }),
  });
  check("registration remains disabled", registration.status === 403);

  const topup = await request("anon3", "/api/v1/me/wallet/topup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amountEgp: 100 }),
  });
  check("self top-up remains disabled", topup.status === 401 || topup.status === 403);

  const email = `uat-sprint02-${Date.now()}@example.test`;
  const invitation = await request("admin", "/api/v1/admin/users/create-student", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "UAT Sprint 02", email }),
  });
  const invitationJson = await invitation.json().catch(() => null);
  const setupUrl = invitationJson?.data?.invitation?.setupUrl;
  check("admin invitation created", invitation.status === 201 && Boolean(setupUrl));

  const setupPage = await request("anon4", "/setup-password");
  check("setup page renders", setupPage.status === 200);

  const token = setupUrl?.split("#token=")[1];
  const setupPassword = `Sprint02-${Date.now()}!`;
  const setup = await request("anon4", "/api/v1/auth/student-setup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: setupPassword }),
  });
  check("invitation consumed", setup.status === 200);

  const replay = await request("anon4", "/api/v1/auth/student-setup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: setupPassword }),
  });
  check("invitation replay rejected", replay.status === 410);

  await delay(50);
  const newLogin = await login("newstudent", email, setupPassword);
  check("new student login after setup", newLogin.status === 200);

  console.log(`\nUAT_SMOKE ${passed}/38`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
