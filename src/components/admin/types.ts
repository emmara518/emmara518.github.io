import type { Role } from "@/lib/rbac";

/* ── Shared DTOs between the admin server page and console ── */

export type Overview = {
  stats: { students: number; publishedCourses: number; revenueCents: number; activeSubscriptions: number };
  revenueByMonth: { month: string; total: number }[];
  recentOrders: { id: string; totalCents: number; status: string; createdAt: string; studentName: string; courseTitle: string }[];
  recentAudit: { id: string; action: string; entity: string; createdAt: string; actorName: string | null }[];
};

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  priceCents: number;
  coverImageUrl: string | null;
  requireSequentialProgress: boolean;
  createdAt: string;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  balanceCents: number;
  enrolledCourseIds: string[];
};

export type CouponRow = {
  id: string;
  code: string;
  percentOff: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  amountCents: number | null;
  courseId: string | null;
  kind: "course_percent" | "wallet_balance" | "course_access";
};

export type OrderRow = {
  id: string;
  totalCents: number;
  discountCents: number;
  status: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
};

export type ExamRow = {
  id: string;
  title: string;
  description?: string;
  type: string;
  durationMin: number;
  groupId?: string | null;
  passingScore: number;
  maxAttempts?: number | null;
  shuffleQuestions: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  isPublished: boolean;
  isActive?: boolean;
  sortOrder: number;
  courseTitle: string;
  courseSlug: string;
  createdAt: string;
  attemptsCount: number;
  avgScore: number;
};

export type AttemptRow = {
  id: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
};

export type VideoRow = {
  id: string;
  title: string;
  youtubeVideoId: string;
  durationSec: number;
  maxViews: number | null;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  sortOrder: number;
};

export type LessonRow = {
  id: string;
  title: string;
  sortOrder: number;
  isFreePreview: boolean;
  courseId: string;
  courseTitle: string;
  videosCount: number;
};

export type CourseFileRow = {
  id: string;
  title: string;
  kind: string;
  sizeBytes: number;
  storageKey: string;
  courseId: string;
  courseTitle?: string;
  isFreePreview: boolean;
  createdAt: string;
};

export type QuestionRow = {
  id: string;
  topic: string;
  kind: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
  marks: number;
  subjectName: string;
  courseId?: string;
};

export type SubscriptionRow = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  priceCents: number;
};

export type InvoiceRow = {
  id: string;
  number: string;
  totalCents: number;
  issuedAt: string;
  orderId: string;
};

export type PostRow = {
  id: string;
  body: string;
  status: string;
  likesCount: number;
  createdAt: string;
  authorName: string;
  authorRole: string;
  courseTitle: string | null;
  repliesCount: number;
};

export type StageRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};
