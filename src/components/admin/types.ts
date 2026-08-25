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
  createdAt: string;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  balanceCents: number;
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
  mode: string;
  durationMin: number;
  isPublished: boolean;
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
  lessonTitle: string;
  courseTitle: string;
  sortOrder: number;
};

export type CourseFileRow = {
  id: string;
  title: string;
  kind: string;
  sizeBytes: number;
  storageKey: string;
  isFreePreview: boolean;
  courseTitle: string;
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
  likesCount: number;
  createdAt: string;
  authorName: string;
  authorRole: string;
  courseTitle: string | null;
};

export type StageRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};
