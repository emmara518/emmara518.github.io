import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * ─────────────────────────────────────────────────────────────────
 * DROS MATH · DATABASE CONTRACT
 * 26 tables covering all 28 product modules. Money = integer cents (EGP).
 * Videos are YouTube REFERENCES ONLY — no media bytes stored here.
 * ─────────────────────────────────────────────────────────────────
 */

export const userRoleEnum = pgEnum("user_role", ["student", "parent", "center", "teacher", "admin"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "failed", "refunded"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["wallet", "manual", "card"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed"]);
export const questionKindEnum = pgEnum("question_kind", ["mcq", "true_false"]);
export const examModeEnum = pgEnum("exam_mode", ["practice", "graded"]);
export const fileKindEnum = pgEnum("file_kind", ["book", "worksheet", "exam_paper", "attachment"]);
export const walletTxnKindEnum = pgEnum("wallet_txn_kind", ["topup", "purchase", "refund", "grant"]);

/* ── academics ── */
export const academicStages = pgTable("academic_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => academicStages.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("grades_stage_idx").on(t.stageId)],
);

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

/* ── people ── */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    /** Guardian mobile captured at student registration — the parent portal identity key. */
    guardianPhone: text("guardian_phone"),
    role: userRoleEnum("role").notNull().default("student"),
    gradeId: uuid("grade_id").references(() => grades.id, { onDelete: "set null" }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role), index("users_guardian_phone_idx").on(t.guardianPhone)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_token_idx").on(t.token)],
);

/* ── courses & content ── */
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    gradeId: uuid("grade_id")
      .notNull()
      .references(() => grades.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id),
    priceCents: integer("price_cents").notNull().default(0),
    status: courseStatusEnum("status").notNull().default("draft"),
    /** Custom card cover — falls back to the keyword heuristic when null. */
    coverImageUrl: text("cover_image_url"),
    /** Sequential learning guard: next video unlocks only after completing the previous one. */
    requireSequentialProgress: boolean("require_sequential_progress").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("courses_grade_idx").on(t.gradeId), index("courses_status_idx").on(t.status)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isFreePreview: boolean("is_free_preview").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lessons_course_idx").on(t.courseId)],
);

/** YouTube externally-hosted references only. */
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    youtubeVideoId: text("youtube_video_id").notNull(),
    youtubePlaylistId: text("youtube_playlist_id"),
    title: text("title").notNull(),
    durationSec: integer("duration_sec").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Max allowed views per student — null = unlimited. */
    maxViews: integer("max_views"),
  },
  (t) => [index("videos_lesson_idx").on(t.lessonId)],
);

export const courseFiles = pgTable(
  "course_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: fileKindEnum("kind").notNull().default("attachment"),
    storageKey: text("storage_key").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    isFreePreview: boolean("is_free_preview").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("files_course_idx").on(t.courseId)],
);

/* ── assessment ── */
export const questionBank = pgTable(
  "question_bank",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    topic: text("topic").notNull().default(""),
    kind: questionKindEnum("kind").notNull().default("mcq"),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation").notNull().default(""),
    difficulty: integer("difficulty").notNull().default(1),
    marks: integer("marks").notNull().default(1),
  },
  (t) => [index("qb_subject_idx").on(t.subjectId)],
);

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    mode: examModeEnum("mode").notNull().default("graded"),
    durationMin: integer("duration_min").notNull().default(20),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("exams_course_idx").on(t.courseId)],
);

export const examQuestions = pgTable(
  "exam_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionBank.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("eq_exam_idx").on(t.examId)],
);

export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    totalMarks: integer("total_marks").notNull().default(0),
    answers: jsonb("answers")
      .$type<{ questionId: string; choiceIndex: number | null; correct: boolean }[]>()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attempts_exam_idx").on(t.examId), index("attempts_user_idx").on(t.userId)],
);

export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  instructions: text("instructions").notNull().default(""),
  dueAt: timestamp("due_at", { withTimezone: true }),
  maxScore: integer("max_score").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  storageKey: text("storage_key"),
  textAnswer: text("text_answer"),
  score: integer("score"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ── commerce ── */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    orderId: uuid("order_id"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
  },
  (t) => [
    index("subs_user_idx").on(t.userId),
    uniqueIndex("subs_user_course_unique").on(t.userId, t.courseId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    couponId: uuid("coupon_id"),
    status: orderStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" })
    .unique(),
  number: text("number").notNull().unique(),
  totalCents: integer("total_cents").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

export const couponKindEnum = pgEnum("coupon_kind", ["course_percent", "wallet_balance", "course_access"]);

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  /** course_percent → percent_off on purchase · wallet_balance → amount_cents to wallet · course_access → unlocks courseId subscription. */
  kind: couponKindEnum("kind").notNull().default("course_percent"),
  percentOff: integer("percent_off").notNull().default(0),
  /** Absolute balance value in EGP cents — required when kind = wallet_balance. */
  amountCents: integer("amount_cents"),
  /** Target course — required when kind = course_access (center-paid full course access). */
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One redemption per student per code (enforced by unique pair). */
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupon_redemptions_unique").on(t.couponId, t.userId)],
);

/**
 * Wallet top-up requests paid externally (InstaPay / digital wallets).
 * Student submits transfer screenshot → admin reviews → issues a
 * wallet_balance or course_access code, delivered via notifications.
 */
export const paymentRequests = pgTable(
  "payment_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountEgp: integer("amount_egp").notNull(),
    /** instapay | vodafone_cash | etisalat_cash | orange_cash */
    method: text("method").notNull(),
    senderName: text("sender_name").notNull().default(""),
    /** Storage key under /uploads/proofs/ — served to admins only. */
    screenshotKey: text("screenshot_key").notNull(),
    /** pending | approved | rejected */
    status: text("status").notNull().default("pending"),
    adminNote: text("admin_note").notNull().default(""),
    issuedCode: text("issued_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("payment_requests_user_idx").on(t.userId), index("payment_requests_status_idx").on(t.status)],
);

/* ── payment channels (configurable by admin) ── */
export const paymentChannelTypeEnum = pgEnum("payment_channel_type", [
  "instapay",
  "vodafone_cash",
  "etisalat_cash",
  "orange_cash",
  "bank_transfer",
  "other",
]);

export const paymentChannels = pgTable(
  "payment_channels",
  {
    id: text("id").primaryKey(),
    type: paymentChannelTypeEnum("type").notNull(),
    label: text("label").notNull(),
    account: text("account").notNull(),
    owner: text("owner").notNull(),
    hint: text("hint"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payment_channels_type_idx").on(t.type)],
);

/* ── wallet (append-only ledger) ── */
export const walletAccounts = pgTable("wallet_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balanceCents: integer("balance_cents").notNull().default(0),
});

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => walletAccounts.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    kind: walletTxnKindEnum("kind").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wallet_txn_wallet_idx").on(t.walletId)],
);

/* ── engagement ── */
export const studentProgress = pgTable(
  "student_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    watchedSeconds: integer("watched_seconds").notNull().default(0),
    /** Times the student opened this video (enforces videos.maxViews). */
    viewCount: integer("view_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("progress_user_idx").on(t.userId),
    uniqueIndex("progress_user_video_unique").on(t.userId, t.videoId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    kind: text("kind").notNull().default("system"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.userId)],
);

export const communityPosts = pgTable(
  "community_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    likesCount: integer("likes_count").notNull().default(0),
    /** pending | approved | rejected — posts go live after moderator review. */
    status: text("status").notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_course_idx").on(t.courseId), index("posts_status_idx").on(t.status)],
);

/** Moderator/assistant answers under a student post — text plus optional media (video/image/file). */
export const communityReplies = pgTable(
  "community_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    /** none | image | video | file */
    mediaKind: text("media_kind").notNull().default("none"),
    /** Storage key under /uploads/replies/ — served through the gated media route. */
    mediaKey: text("media_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("replies_post_idx").on(t.postId)],
);

/* ── parent portal ── */
export const parentLinks = pgTable(
  "parent_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("parent_child_unique").on(t.parentId, t.studentId)],
);

/* ── governance ── */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entity)],
);

/* ── inferred types ── */
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Question = typeof questionBank.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type WalletAccount = typeof walletAccounts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PaymentChannel = typeof paymentChannels.$inferSelect;
