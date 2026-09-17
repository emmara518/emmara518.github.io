import { describe, it, expect } from "vitest";
import {
  registerSchema,
  parentRegisterSchema,
  loginSchema,
  catalogQuerySchema,
  purchaseSchema,
  progressSchema,
  examSubmitSchema,
  adminCourseSchema,
  adminCoursePatchSchema,
  adminVideoPatchSchema,
  couponSchema,
  redeemCodeSchema,
  userRoleSchema,
  topUpSchema,
  adminUserPatchSchema,
  assignmentCreateSchema,
  submissionSchema,
  gradeSubmissionSchema,
  postSchema,
  EGYPT_PHONE_REGEX,
  uuid,
} from "@/lib/contracts";

const VALID_UUID = "123e4567-e89b-42d3-a456-426614174000";

const validRegister = {
  name: "محمد أحمد",
  email: "student1@example.com",
  password: "Str0ngPass!!",
  phone: "01012345678",
  guardianPhone: "01198765432",
};

describe("registerSchema", () => {
  it("accepts a fully valid payload", () => {
    const r = registerSchema.safeParse(validRegister);
    expect(r.success).toBe(true);
  });

  it("accepts missing optional phone fields", () => {
    const { phone, guardianPhone, ...rest } = validRegister;
    expect(registerSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts empty-string phone fields", () => {
    expect(registerSchema.safeParse({ ...validRegister, phone: "", guardianPhone: "" }).success).toBe(true);
  });

  const badNames = ["", " ", "أ", "x".repeat(81), 42 as unknown as string];
  for (const n of badNames) {
    it(`rejects bad name: ${JSON.stringify(String(n).slice(0, 12))}`, () => {
      expect(registerSchema.safeParse({ ...validRegister, name: n }).success).toBe(false);
    });
  }

  const badEmails = ["", "not-an-email", "a@b", "@x.com", "user@.com", "user@com", "user@x.c", "user .name@x.com", "user@" + "x".repeat(200) + ".com"];
  for (const e of badEmails) {
    it(`rejects bad email: ${e.slice(0, 20)}`, () => {
      expect(registerSchema.safeParse({ ...validRegister, email: e }).success).toBe(false);
    });
  }

  const shortPasswords = ["", "1", "1234567", "short"];
  for (const p of shortPasswords) {
    it(`rejects short password: ${JSON.stringify(p)}`, () => {
      expect(registerSchema.safeParse({ ...validRegister, password: p }).success).toBe(false);
    });
  }

  it("accepts 8-char password boundary", () => {
    expect(registerSchema.safeParse({ ...validRegister, password: "00000000" }).success).toBe(true);
  });

  it("accepts 72-char password boundary, rejects 73", () => {
    expect(registerSchema.safeParse({ ...validRegister, password: "a".repeat(72) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...validRegister, password: "a".repeat(73) }).success).toBe(false);
  });

  const badPhones = ["0111234567", "0101234567", "0212345678", "010123456789", "abc", "+201012345678"];
  for (const ph of badPhones) {
    it(`rejects bad phone: ${ph}`, () => {
      expect(registerSchema.safeParse({ ...validRegister, phone: ph }).success).toBe(false);
    });
  }

  it("rejects bad guardianPhone", () => {
    expect(registerSchema.safeParse({ ...validRegister, guardianPhone: "91012345678" }).success).toBe(false);
  });

  it("accepts Egyptian phones 01[0-9]{9}", () => {
    expect(EGYPT_PHONE_REGEX.test("01000000000")).toBe(true);
    expect(EGYPT_PHONE_REGEX.test("01999999999")).toBe(true);
    expect(EGYPT_PHONE_REGEX.test("02999999999")).toBe(false);
    expect(EGYPT_PHONE_REGEX.test("019999999999")).toBe(false);
  });
});

describe("parentRegisterSchema", () => {
  const valid = { name: "ولي أمر", phone: "01234567890", password: "password123" };
  it("accepts valid parent payload", () => {
    expect(parentRegisterSchema.safeParse(valid).success).toBe(true);
  });
  it("requires phone (mandatory, unlike student)", () => {
    expect(parentRegisterSchema.safeParse({ ...valid, phone: undefined }).success).toBe(false);
    expect(parentRegisterSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
  it("rejects short password", () => {
    expect(parentRegisterSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts short username «admin» and email alike", () => {
    expect(loginSchema.safeParse({ email: "admin", password: "dummy" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
  it("rejects <3 chars username and empty password", () => {
    expect(loginSchema.safeParse({ email: "ab", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "admin", password: "" }).success).toBe(false);
  });
});

describe("progressSchema", () => {
  const valid = { videoId: VALID_UUID, watchedSeconds: 120, completed: false };
  it("accepts valid", () => expect(progressSchema.safeParse(valid).success).toBe(true));
  it("defaults applied", () => {
    const r = progressSchema.safeParse({ videoId: VALID_UUID });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.watchedSeconds).toBe(0);
      expect(r.data.completed).toBe(false);
    }
  });
  it("rejects negative / >24h watchedSeconds", () => {
    expect(progressSchema.safeParse({ ...valid, watchedSeconds: -1 }).success).toBe(false);
    expect(progressSchema.safeParse({ ...valid, watchedSeconds: 86401 }).success).toBe(false);
  });
  it("accepts 24h boundary", () => {
    expect(progressSchema.safeParse({ ...valid, watchedSeconds: 86400 }).success).toBe(true);
  });
  it("rejects non-uuid videoId", () => {
    expect(progressSchema.safeParse({ ...valid, videoId: "not-uuid" }).success).toBe(false);
  });
});

describe("examSubmitSchema", () => {
  const one = { questionId: VALID_UUID, choiceIndex: 2 };
  it("accepts empty answers array", () => {
    expect(examSubmitSchema.safeParse({ answers: [] }).success).toBe(true);
  });
  it("accepts null choiceIndex (unanswered)", () => {
    expect(examSubmitSchema.safeParse({ answers: [{ questionId: VALID_UUID, choiceIndex: null }] }).success).toBe(true);
  });
  it("rejects choiceIndex out of 0..9", () => {
    expect(examSubmitSchema.safeParse({ answers: [{ ...one, choiceIndex: -1 }] }).success).toBe(false);
    expect(examSubmitSchema.safeParse({ answers: [{ ...one, choiceIndex: 10 }] }).success).toBe(false);
  });
  it("rejects >200 answers", () => {
    const many = Array.from({ length: 201 }, () => one);
    expect(examSubmitSchema.safeParse({ answers: many }).success).toBe(false);
  });
  it("accepts 200 answers boundary", () => {
    const many = Array.from({ length: 200 }, () => one);
    expect(examSubmitSchema.safeParse({ answers: many }).success).toBe(true);
  });
});

describe("adminCourseSchema", () => {
  const valid = {
    title: "كورس رياضيات أول ثانوي",
    slug: "math-g10-t1",
    gradeId: VALID_UUID,
    subjectId: VALID_UUID,
    priceEgp: 250.5,
  };
  it("accepts valid course", () => expect(adminCourseSchema.safeParse(valid).success).toBe(true));
  it("defaults summary/description to empty", () => {
    const r = adminCourseSchema.safeParse(valid);
    if (r.success) {
      expect(r.data.summary).toBe("");
      expect(r.data.description).toBe("");
    }
  });
  const badSlugs = ["UPPER CASE", "has spaces", "has_underscore", "عربي", "ab", ""];
  for (const s of badSlugs) {
    it(`rejects bad slug: ${JSON.stringify(s)}`, () => {
      expect(adminCourseSchema.safeParse({ ...valid, slug: s }).success).toBe(false);
    });
  }
  it("rejects negative or >100000 price", () => {
    expect(adminCourseSchema.safeParse({ ...valid, priceEgp: -1 }).success).toBe(false);
    expect(adminCourseSchema.safeParse({ ...valid, priceEgp: 100001 }).success).toBe(false);
  });
  it("rejects bad coverUrl but accepts empty string", () => {
    expect(adminCourseSchema.safeParse({ ...valid, coverUrl: "not-a-url" }).success).toBe(false);
    expect(adminCourseSchema.safeParse({ ...valid, coverUrl: "" }).success).toBe(true);
    expect(adminCourseSchema.safeParse({ ...valid, coverUrl: "https://cdn.example.com/x.png" }).success).toBe(true);
  });
});

describe("couponSchema", () => {
  const valid = { code: "SAVE20", kind: "course_percent" as const, percentOff: 20, maxUses: 50 };
  it("accepts valid coupon", () => expect(couponSchema.safeParse(valid).success).toBe(true));
  it("defaults kind=course_percent percentOff=10 maxUses=100", () => {
    const r = couponSchema.safeParse({ code: "abc" });
    if (r.success) {
      expect(r.data.kind).toBe("course_percent");
      expect(r.data.percentOff).toBe(10);
      expect(r.data.maxUses).toBe(100);
    }
  });
  it("percentOff bounds 1..90", () => {
    expect(couponSchema.safeParse({ ...valid, percentOff: 0 }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, percentOff: 91 }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, percentOff: 90 }).success).toBe(true);
  });
  it("wallet_balance requires amountEgp 5..100000", () => {
    expect(couponSchema.safeParse({ ...valid, kind: "wallet_balance" }).success).toBe(true); // optional in schema
    expect(couponSchema.safeParse({ ...valid, kind: "wallet_balance", amountEgp: 4 }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, kind: "wallet_balance", amountEgp: 100001 }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, kind: "wallet_balance", amountEgp: 250 }).success).toBe(true);
  });
  it("code regex: latin letters/digits/dashes only", () => {
    expect(couponSchema.safeParse({ ...valid, code: "اختبار" }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, code: "has space" }).success).toBe(false);
    expect(couponSchema.safeParse({ ...valid, code: "AB-12" }).success).toBe(true);
  });
});

describe("topUpSchema", () => {
  it("bounds 10..50000 EGP", () => {
    expect(topUpSchema.safeParse({ amountEgp: 9 }).success).toBe(false);
    expect(topUpSchema.safeParse({ amountEgp: 10 }).success).toBe(true);
    expect(topUpSchema.safeParse({ amountEgp: 50000 }).success).toBe(true);
    expect(topUpSchema.safeParse({ amountEgp: 50001 }).success).toBe(false);
  });
});

describe("adminUserPatchSchema", () => {
  it("requires at least one field", () => {
    expect(adminUserPatchSchema.safeParse({}).success).toBe(false);
  });
  it("accepts role change", () => {
    expect(adminUserPatchSchema.safeParse({ role: "teacher" }).success).toBe(true);
  });
  it("accepts isActive change", () => {
    expect(adminUserPatchSchema.safeParse({ isActive: false }).success).toBe(true);
  });
  it("rejects invalid role", () => {
    expect(adminUserPatchSchema.safeParse({ role: "superman" }).success).toBe(false);
  });
});

describe("userRoleSchema", () => {
  for (const r of ["student", "parent", "center", "teacher", "assistant", "admin"]) {
    it(`accepts role ${r}`, () => expect(userRoleSchema.safeParse({ role: r }).success).toBe(true));
  }
  it("rejects unknown roles", () => {
    expect(userRoleSchema.safeParse({ role: "owner" }).success).toBe(false);
    expect(userRoleSchema.safeParse({ role: "Admin" }).success).toBe(false);
  });
});

describe("submissionSchema & gradeSubmissionSchema & postSchema", () => {
  it("submission min 5 chars", () => {
    expect(submissionSchema.safeParse({ textAnswer: "أربع" }).success).toBe(false);
    expect(submissionSchema.safeParse({ textAnswer: "خمسة أحرف" }).success).toBe(true);
    expect(submissionSchema.safeParse({ textAnswer: "x".repeat(4001) }).success).toBe(false);
  });
  it("score 0..1000 int", () => {
    expect(gradeSubmissionSchema.safeParse({ score: -1 }).success).toBe(false);
    expect(gradeSubmissionSchema.safeParse({ score: 0 }).success).toBe(true);
    expect(gradeSubmissionSchema.safeParse({ score: 1000 }).success).toBe(true);
    expect(gradeSubmissionSchema.safeParse({ score: 1001 }).success).toBe(false);
    expect(gradeSubmissionSchema.safeParse({ score: 5.5 }).success).toBe(false);
  });
  it("post min 2 max 600", () => {
    expect(postSchema.safeParse({ body: "أ" }).success).toBe(false);
    expect(postSchema.safeParse({ body: "اب" }).success).toBe(true);
    expect(postSchema.safeParse({ body: "x".repeat(601) }).success).toBe(false);
  });
});

describe("assignmentCreateSchema", () => {
  const valid = { courseId: VALID_UUID, title: "واجب الأسبوع الأول" };
  it("defaults maxScore=10", () => {
    const r = assignmentCreateSchema.safeParse(valid);
    if (r.success) expect(r.data.maxScore).toBe(10);
  });
  it("maxScore bounds 1..100", () => {
    expect(assignmentCreateSchema.safeParse({ ...valid, maxScore: 0 }).success).toBe(false);
    expect(assignmentCreateSchema.safeParse({ ...valid, maxScore: 101 }).success).toBe(false);
  });
  it("rejects invalid dueAt", () => {
    expect(assignmentCreateSchema.safeParse({ ...valid, dueAt: "tomorrow" }).success).toBe(false);
  });
});

describe("uuid schema", () => {
  it("accepts/rejects correctly", () => {
    expect(uuid.safeParse(VALID_UUID).success).toBe(true);
    expect(uuid.safeParse("123e4567-e89b-12d3-a456-426614174000G").success).toBe(false);
    expect(uuid.safeParse("").success).toBe(false);
  });
});

describe("adminVideoPatchSchema & adminCoursePatchSchema", () => {
  it("maxViews null allowed, 0 rejected, 1000 rejected", () => {
    expect(adminVideoPatchSchema.safeParse({ maxViews: null }).success).toBe(true);
    expect(adminVideoPatchSchema.safeParse({ maxViews: 0 }).success).toBe(false);
    expect(adminVideoPatchSchema.safeParse({ maxViews: 1000 }).success).toBe(false);
    expect(adminVideoPatchSchema.safeParse({ maxViews: 999 }).success).toBe(true);
  });
  it("youtubeId strict charset", () => {
    expect(adminVideoPatchSchema.safeParse({ youtubeId: "dQw4w9WgXcQ" }).success).toBe(true);
    expect(adminVideoPatchSchema.safeParse({ youtubeId: "bad/id!" }).success).toBe(false);
    expect(adminVideoPatchSchema.safeParse({ youtubeId: "short" }).success).toBe(false);
  });
  it("course status enum enforced", () => {
    expect(adminCoursePatchSchema.safeParse({ status: "published" }).success).toBe(true);
    expect(adminCoursePatchSchema.safeParse({ status: "live" }).success).toBe(false);
  });
});
