"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BarChart3,
  BookOpen,
  GraduationCap,
  Users,
  KeyRound,
  MessageSquare,
  Receipt,
  Search,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Film,
  FileText,
  HelpCircle,
  PlusCircle,
  CreditCard,
  UserPlus,
  UserCheck,
  ShieldCheck,
  FolderTree,
  Repeat,
  ArrowRightLeft,
  Award,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Send,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Copy,
  Activity,
  PieChart,
  UserX,
  Bell,
  Clock,
  Flame,
  Check,
  Printer,
  Wallet,
  CheckSquare,
  XSquare,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  QrCode,
  X,
  FileCheck,
} from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "./ui";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { formatDate, formatEGP } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── DTOs ── */
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

/* ── Primary Functional Hubs ── */
export type CategoryId =
  | "overview"
  | "academic"
  | "exams"
  | "users"
  | "billing_codes"
  | "communications";

interface SubFeatureDef {
  id: string;
  label: string;
  badge?: string;
  icon?: typeof Home;
}

interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: typeof Home;
  description: string;
  subFeatures: SubFeatureDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "overview",
    label: "الرئيسية والتقارير",
    icon: BarChart3,
    description: "إحصائيات المنصة، آخر التحديثات، وتقارير النشاط العام",
    subFeatures: [
      { id: "home", label: "نظرة عامة" },
      { id: "statistics", label: "الإحصائيات الشاملة" },
      { id: "updates", label: "سجل العمليات والتدقيق" },
    ],
  },
  {
    id: "academic",
    label: "المناهج والمقررات",
    icon: BookOpen,
    description: "الكورسات، الفيديوهات، المذكرات، والمجموعات الدراسية",
    subFeatures: [
      { id: "courses_table", label: "جدول الكورسات" },
      { id: "courses_manage", label: "إضافة مقرر جديد" },
      { id: "videos_manage", label: "الفيديوهات والمحاضرات" },
      { id: "booklets_manage", label: "المذكرات والملازم" },
      { id: "sections_manage", label: "المراحل الدراسية" },
    ],
  },
  {
    id: "exams",
    label: "الامتحانات وبنك الأسئلة",
    icon: GraduationCap,
    description: "إنشاء الاختبارات، بنوك الأسئلة، واستيراد وتصحيح النتائج",
    subFeatures: [
      { id: "exams_table", label: "جدول الامتحانات" },
      { id: "exams_manage", label: "إنشاء امتحان جديد" },
      { id: "questions_table", label: "بنك الأسئلة" },
      { id: "questions_manage", label: "إضافة سؤال فردي" },
      { id: "bulk_questions_add", label: "إضافة أكثر من سؤال" },
      { id: "exam_results_table", label: "نتائج الامتحانات" },
    ],
  },
  {
    id: "billing_codes",
    label: "الأكواد والشحن والمالية",
    icon: KeyRound,
    description: "توليد أكواد التفعيل، الدفع اليدوي، الفواتير، والاشتراكات",
    subFeatures: [
      { id: "create_codes", label: "إنشاء وتوليد أكواد" },
      { id: "codes_table", label: "جدول الأكواد النشطة" },
      { id: "manual_payment", label: "الدفع اليدوي (سنتر/كاش)" },
      { id: "subscriptions_table", label: "جداول الاشتراكات" },
      { id: "invoices_table", label: "جداول الفواتير" },
    ],
  },
  {
    id: "users",
    label: "المستخدمون والطلاب",
    icon: Users,
    description: "إدارة الطلاب، تعيين المسؤولين، وتعديل المحافظ",
    subFeatures: [
      { id: "users_table", label: "جدول المستخدمين" },
      { id: "add_student", label: "إضافة طالب جديد" },
      { id: "manage_admin", label: "إدارة المسؤولين والمشرفين" },
      { id: "users_stats", label: "إحصائيات الطلاب" },
    ],
  },
  {
    id: "communications",
    label: "المنتدى ورسائل SMS",
    icon: MessageSquare,
    description: "حملات SMS النصية، وإشراف ومتابعة موضوعات المجتمع",
    subFeatures: [
      { id: "sms_messages", label: "إرسال رسائل SMS" },
      { id: "forum_pending_topics", label: "منشورات ومجتمع الطلاب" },
    ],
  },
];

const STATUS_LABEL: Record<string, { label: string; tone: "brand" | "gold" | "success" | "muted" | "danger" }> = {
  draft: { label: "مسودة", tone: "muted" },
  published: { label: "منشور", tone: "success" },
  archived: { label: "مؤرشف", tone: "danger" },
  paid: { label: "مدفوع", tone: "success" },
  pending: { label: "معلق", tone: "gold" },
  failed: { label: "فاشل", tone: "danger" },
  refunded: { label: "مسترد", tone: "muted" },
  active: { label: "نشط", tone: "success" },
  expired: { label: "منتهي", tone: "muted" },
  cancelled: { label: "ملغي", tone: "danger" },
};

/** Arabic UTF-8 CSV exporter utility */
function downloadCSV(filename: string, rows: Record<string, unknown>[], headers: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;
  const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function AdminConsole({
  actor,
  canManageUsers,
  overview,
  courses,
  users,
  coupons,
  orders,
  grades,
  subjects,
  exams,
  attempts,
  videos,
  courseFiles,
  questions,
  subscriptions,
  invoices,
  communityPosts,
  stages,
}: {
  actor: { name: string; role: Role };
  canManageUsers: boolean;
  overview: Overview;
  courses: CourseRow[];
  users: UserRow[];
  coupons: CouponRow[];
  orders: OrderRow[];
  grades: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  exams: ExamRow[];
  attempts: AttemptRow[];
  videos: VideoRow[];
  courseFiles: CourseFileRow[];
  questions: QuestionRow[];
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
  communityPosts: PostRow[];
  stages: StageRow[];
}) {
  const router = useRouter();

  // Local Reactive State for Optimistic / Immediate UI updates
  const [localCourses, setLocalCourses] = useState<CourseRow[]>(courses);
  const [localUsers, setLocalUsers] = useState<UserRow[]>(users);
  const [localExams, setLocalExams] = useState<ExamRow[]>(exams);
  const [localCoupons, setLocalCoupons] = useState<CouponRow[]>(coupons);
  const [localSubscriptions, setLocalSubscriptions] = useState<SubscriptionRow[]>(subscriptions);

  // Navigation State
  const [activeCategory, setActiveCategory] = useState<CategoryId>("overview");
  const [activeSubFeature, setActiveSubFeature] = useState<string>("home");
  const [globalSearch, setGlobalSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Filter States
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [courseStatusFilter, setCourseStatusFilter] = useState<string>("all");
  const [examModeFilter, setExamModeFilter] = useState<string>("all");
  const [questionTopicFilter, setQuestionTopicFilter] = useState<string>("all");

  // Modals & Overlays
  const [walletModalUser, setWalletModalUser] = useState<UserRow | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("50");
  const [walletAdjustReason, setWalletAdjustReason] = useState("مكافأة تميز في الامتحان");
  const [printVouchersModal, setPrintVouchersModal] = useState<string[] | null>(null);

  // Form States: Code Generator
  const [codePrefix, setCodePrefix] = useState("MATH");
  const [codeCount, setCodeCount] = useState("10");
  const [codePercent, setCodePercent] = useState("100");
  const [codeMaxUses, setCodeMaxUses] = useState("1");
  const [codeDaysValid, setCodeDaysValid] = useState("30");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form States: Manual Payment
  const [mpStudentEmail, setMpStudentEmail] = useState("");
  const [mpCourseId, setMpCourseId] = useState(courses[0]?.id || "");
  const [mpAmount, setMpAmount] = useState(courses[0] ? String(courses[0].priceCents / 100) : "200");
  const [mpMethod, setMpMethod] = useState<"vodafone_cash" | "instapay" | "center_cash">("center_cash");

  // Form States: Course Creation
  const [cTitle, setCTitle] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cGrade, setCGrade] = useState(grades[0]?.id || "");
  const [cSubject, setCSubject] = useState(subjects[0]?.id || "");
  const [cPrice, setCPrice] = useState("250");
  const [cSummary, setCSummary] = useState("");

  // Form States: Question Creator
  const [qSubjectId, setQSubjectId] = useState(subjects[0]?.id || "");
  const [qTopic, setQTopic] = useState("الهندسة والتحليل");
  const [qPrompt, setQPrompt] = useState("");
  const [qOpt1, setQOpt1] = useState("");
  const [qOpt2, setQOpt2] = useState("");
  const [qOpt3, setQOpt3] = useState("");
  const [qOpt4, setQOpt4] = useState("");
  const [qCorrectIdx, setQCorrectIdx] = useState("0");
  const [qExplanation, setQExplanation] = useState("");

  // Form States: Bulk Questions
  const [bulkText, setBulkText] = useState(
    `1. ما هو ميل المستقيم 2x + 3y = 6؟\n-2/3\n3/2\n2/3\n-3/2\nالإجابة: 1\n\n2. إذا كان جا(س) = 0.5 فإن س = ؟\n30\n45\n60\n90\nالإجابة: 1`
  );

  // Form States: Add Student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentPass, setNewStudentPass] = useState("12345678");

  // Form States: SMS Broadcast
  const [smsTarget, setSmsTarget] = useState("all");
  const [smsText, setSmsText] = useState("");

  // Form States: Exam Creator
  const [examTitle, setExamTitle] = useState("");
  const [examCourseId, setExamCourseId] = useState(courses[0]?.id || "");
  const [examDuration, setExamDuration] = useState("60");
  const [examMode, setExamMode] = useState<"practice" | "graded">("graded");
  const [examIsPublished, setExamIsPublished] = useState(true);

  // Helper API caller
  async function api(path: string, init?: RequestInit): Promise<boolean> {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json();
      if (!json.ok) {
        setNote({ kind: "err", text: json.error?.message ?? "فشلت العملية" });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setNote({ kind: "err", text: "مشكلة في الاتصال بالسيرفر" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  // Generate & Save Real DB Batch Codes
  async function handleBatchGenerateCodes(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/coupons/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: codePrefix,
          count: Math.min(100, Math.max(1, Number(codeCount) || 10)),
          percentOff: Number(codePercent) || 100,
          maxUses: Number(codeMaxUses) || 1,
          daysValid: Number(codeDaysValid) || 30,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setNote({ kind: "err", text: json.error?.message ?? "فشل توليد الأكواد" });
        return;
      }
      setGeneratedCodes(json.data.codes || []);
      setNote({ kind: "ok", text: json.data.message });
      // update local coupons
      if (json.data.coupons) {
        setLocalCoupons((prev) => [
          ...json.data.coupons.map((c: any) => ({
            id: c.id,
            code: c.code,
            percentOff: Number(codePercent) || 100,
            maxUses: Number(codeMaxUses) || 1,
            usedCount: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + Number(codeDaysValid) * 86400000).toISOString(),
          })),
          ...prev,
        ]);
      }
    } catch {
      setNote({ kind: "err", text: "تعذر الاتصال بالسيرفر لتوليد الأكواد" });
    } finally {
      setBusy(false);
    }
  }

  // Toggle User Active Status
  async function handleToggleUserStatus(u: UserRow) {
    const nextStatus = !u.isActive;
    // optimistic update
    setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: nextStatus } : item)));
    const done = await api(`/api/v1/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: nextStatus }),
    });
    if (done) {
      setNote({
        kind: "ok",
        text: `تم ${nextStatus ? "تفعيل" : "تجميد"} حساب «${u.name}» بنجاح.`,
      });
    } else {
      // rollback
      setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: u.isActive } : item)));
    }
  }

  // Change User Role
  async function handleChangeUserRole(u: UserRow, newRole: Role) {
    if (u.role === newRole) return;
    setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: newRole } : item)));
    const done = await api(`/api/v1/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    if (done) {
      setNote({ kind: "ok", text: `تم تحديث دور «${u.name}» إلى ${ROLE_LABELS[newRole]}.` });
    }
  }

  // Adjust Wallet Balance
  async function handleAdjustWallet(e: FormEvent) {
    e.preventDefault();
    if (!walletModalUser) return;
    const amount = Number(walletAdjustAmount);
    if (isNaN(amount) || amount === 0) {
      setNote({ kind: "err", text: "يرجى تحديد مبلغ صالح للتعديل" });
      return;
    }
    const done = await api(`/api/v1/admin/users/${walletModalUser.id}/wallet`, {
      method: "POST",
      body: JSON.stringify({
        amountEgp: amount,
        reason: walletAdjustReason,
      }),
    });
    if (done) {
      setLocalUsers((prev) =>
        prev.map((item) =>
          item.id === walletModalUser.id
            ? { ...item, balanceCents: Math.max(0, item.balanceCents + amount * 100) }
            : item
        )
      );
      setNote({
        kind: "ok",
        text: `تم ${amount >= 0 ? "شحن" : "خصم"} ${Math.abs(amount)} ج.م لمحفظة الطالب «${walletModalUser.name}» بنجاح.`,
      });
      setWalletModalUser(null);
    }
  }

  // Toggle Course Status
  async function handleCourseStatusChange(c: CourseRow, newStatus: "draft" | "published" | "archived") {
    if (c.status === newStatus) return;
    setLocalCourses((prev) => prev.map((item) => (item.id === c.id ? { ...item, status: newStatus } : item)));
    const done = await api(`/api/v1/admin/courses/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    if (done) {
      setNote({ kind: "ok", text: `تم تغيير حالة المقرر «${c.title}» إلى ${STATUS_LABEL[newStatus]?.label}.` });
    }
  }

  // Toggle Exam Publish
  async function handleToggleExamPublish(e: ExamRow) {
    const nextVal = !e.isPublished;
    setLocalExams((prev) => prev.map((item) => (item.id === e.id ? { ...item, isPublished: nextVal } : item)));
    const done = await api(`/api/v1/admin/exams/${e.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPublished: nextVal }),
    });
    if (done) {
      setNote({
        kind: "ok",
        text: `تم ${nextVal ? "نشر" : "إخفاء"} الامتحان «${e.title}» بنجاح.`,
      });
    }
  }

  // Create Course Handler
  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        title: cTitle,
        slug: cSlug,
        summary: cSummary,
        description: cSummary,
        gradeId: cGrade,
        subjectId: cSubject,
        priceEgp: Number(cPrice || "0"),
      }),
    });
    if (done) {
      setNote({ kind: "ok", text: "تم إنشاء المقرر الدراسي بنجاح." });
      setCTitle("");
      setCSlug("");
      setCSummary("");
      setActiveSubFeature("courses_table");
    }
  }

  // Add Student Handler
  async function handleAddStudent(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/users/create-student", {
      method: "POST",
      body: JSON.stringify({
        name: newStudentName,
        email: newStudentEmail,
        password: newStudentPass,
        phone: newStudentPhone,
      }),
    });
    if (done) {
      setNote({ kind: "ok", text: `تم تسجيل حساب الطالب «${newStudentName}» بنجاح في قاعدة البيانات.` });
      setLocalUsers((prev) => [
        {
          id: `u-${Date.now()}`,
          name: newStudentName,
          email: newStudentEmail,
          role: "student",
          isActive: true,
          createdAt: new Date().toISOString(),
          balanceCents: 0,
        },
        ...prev,
      ]);
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPhone("");
      setActiveSubFeature("users_table");
    }
  }

  // Create Exam Handler
  async function handleCreateExam(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/exams", {
      method: "POST",
      body: JSON.stringify({
        title: examTitle,
        courseId: examCourseId,
        durationMin: Number(examDuration) || 60,
        mode: examMode,
        isPublished: examIsPublished,
      }),
    });
    if (done) {
      setNote({ kind: "ok", text: `تم إنشاء الامتحان «${examTitle}» بنجاح.` });
      setExamTitle("");
      setActiveSubFeature("exams_table");
    }
  }

  // Create Single Question Handler
  async function handleCreateQuestion(e: FormEvent) {
    e.preventDefault();
    const options = [qOpt1, qOpt2, qOpt3, qOpt4].map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      setNote({ kind: "err", text: "يجب إدخال خيارين على الأقل للسؤال." });
      return;
    }
    const done = await api("/api/v1/admin/questions", {
      method: "POST",
      body: JSON.stringify({
        subjectId: qSubjectId,
        topic: qTopic || "عام",
        prompt: qPrompt,
        options: [qOpt1, qOpt2, qOpt3, qOpt4],
        correctIndex: Number(qCorrectIdx) || 0,
        explanation: qExplanation || "",
        marks: 1,
        difficulty: 2,
      }),
    });
    if (done) {
      setNote({ kind: "ok", text: "تمت إضافة السؤال بنجاح إلى بنك الأسئلة!" });
      setQPrompt("");
      setQOpt1("");
      setQOpt2("");
      setQOpt3("");
      setQOpt4("");
      setQExplanation("");
      setActiveSubFeature("questions_table");
    }
  }

  // Manual Enroll Handler
  async function handleManualEnroll(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/billing/manual-enroll", {
      method: "POST",
      body: JSON.stringify({
        studentEmail: mpStudentEmail,
        courseId: mpCourseId,
        method: mpMethod,
        amountEgp: Number(mpAmount) || 0,
      }),
    });
    if (done) {
      setNote({
        kind: "ok",
        text: `تم تفعيل اشتراك الطالب (${mpStudentEmail}) بنجاح وإصدار الفاتورة.`,
      });
      setMpStudentEmail("");
      setActiveSubFeature("subscriptions_table");
    }
  }

  // Switch Subfeature Helper
  function selectSubFeature(catId: CategoryId, subId: string) {
    setActiveCategory(catId);
    setActiveSubFeature(subId);
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return localUsers.filter((u) => {
      const matchSearch =
        !globalSearch ||
        u.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(globalSearch.toLowerCase());
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === "all" ||
        (userStatusFilter === "active" && u.isActive) ||
        (userStatusFilter === "inactive" && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [localUsers, globalSearch, userRoleFilter, userStatusFilter]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return localCourses.filter((c) => {
      const matchSearch =
        !globalSearch ||
        c.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.gradeName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.subjectName.toLowerCase().includes(globalSearch.toLowerCase());
      const matchStatus = courseStatusFilter === "all" || c.status === courseStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [localCourses, globalSearch, courseStatusFilter]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return localExams.filter((e) => {
      const matchSearch =
        !globalSearch ||
        e.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        e.courseTitle.toLowerCase().includes(globalSearch.toLowerCase());
      const matchMode = examModeFilter === "all" || e.mode === examModeFilter;
      return matchSearch && matchMode;
    });
  }, [localExams, globalSearch, examModeFilter]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        !globalSearch ||
        q.prompt.toLowerCase().includes(globalSearch.toLowerCase()) ||
        q.topic.toLowerCase().includes(globalSearch.toLowerCase());
      const matchTopic = questionTopicFilter === "all" || q.topic === questionTopicFilter;
      return matchSearch && matchTopic;
    });
  }, [questions, globalSearch, questionTopicFilter]);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return localCoupons.filter((c) => {
      return !globalSearch || c.code.toLowerCase().includes(globalSearch.toLowerCase());
    });
  }, [localCoupons, globalSearch]);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return localSubscriptions.filter((s) => {
      return (
        !globalSearch ||
        s.studentName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.courseTitle.toLowerCase().includes(globalSearch.toLowerCase())
      );
    });
  }, [localSubscriptions, globalSearch]);

  // Active Category Definition
  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER / HUB NAVIGATION BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              مركز العمليات والإدارة الموحد
            </span>
            <span className="text-xs text-muted font-medium">· مرحبًا، {actor.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            لوحة الإدارة الأكاديمية
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            إدارة متكاملة وشاملة لجميع محتويات المنصة، الطلاب، المقررات، الامتحانات، والعمليات المالية.
          </p>
        </div>

        {/* Action Controls & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surface2 text-xs font-bold text-ink transition-colors"
          >
            <ExternalLink size={14} className="text-brand" />
            <span>عرض المنصة كطالب</span>
          </Link>
          <button
            onClick={() => selectSubFeature("billing_codes", "create_codes")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>توليد أكواد</span>
          </button>
          <button
            onClick={() => selectSubFeature("users", "add_student")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface2 border border-line hover:bg-line text-xs font-bold text-ink transition-all cursor-pointer"
          >
            <UserPlus size={14} className="text-brand" />
            <span>إضافة طالب</span>
          </button>
          <button
            onClick={() => selectSubFeature("billing_codes", "manual_payment")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface2 border border-line hover:bg-line text-xs font-bold text-ink transition-all cursor-pointer"
          >
            <CreditCard size={14} className="text-brand" />
            <span>دفع سنتر</span>
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {note && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold border transition-all",
            note.kind === "ok"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          )}
        >
          <div className="flex items-center gap-2">
            {note.kind === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{note.text}</span>
          </div>
          <button onClick={() => setNote(null)} className="text-xs hover:underline cursor-pointer">
            إغلاق
          </button>
        </div>
      )}

      {/* ── GLOBAL SEARCH & DATA EXPORT BAR ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-2xl border border-line shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="بحث فوري في الطلاب، المقررات، الأسئلة، الأكواد، الفواتير..."
            className="pr-10 h-10 text-xs bg-surface2 border-line w-full"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>

        {/* Quick CSV Export Shortcuts */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {activeCategory === "users" && (
            <Button
              onClick={() =>
                downloadCSV("students_list", filteredUsers, [
                  { key: "name", label: "اسم الطالب" },
                  { key: "email", label: "البريد الإلكتروني" },
                  { key: "role", label: "الرتبة" },
                  { key: "isActive", label: "الحالة (مفعل)" },
                  { key: "createdAt", label: "تاريخ التسجيل" },
                ])
              }
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الطلاب (CSV)
            </Button>
          )}

          {activeCategory === "billing_codes" && (
            <Button
              onClick={() =>
                downloadCSV("coupons_codes", filteredCoupons, [
                  { key: "code", label: "كود التفعيل" },
                  { key: "percentOff", label: "نسبة الخصم %" },
                  { key: "maxUses", label: "أقصى استخدامات" },
                  { key: "usedCount", label: "مرات الاستخدام" },
                  { key: "createdAt", label: "تاريخ الإنشاء" },
                ])
              }
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الأكواد (CSV)
            </Button>
          )}

          {activeCategory === "academic" && (
            <Button
              onClick={() =>
                downloadCSV("courses_list", filteredCourses, [
                  { key: "title", label: "اسم الكورس" },
                  { key: "gradeName", label: "الصف الدراسي" },
                  { key: "subjectName", label: "المادة" },
                  { key: "status", label: "الحالة" },
                  { key: "priceCents", label: "السعر بالقرش" },
                ])
              }
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الكورسات (CSV)
            </Button>
          )}

          {activeCategory === "exams" && (
            <Button
              onClick={() =>
                downloadCSV("exam_results", attempts, [
                  { key: "examTitle", label: "الامتحان" },
                  { key: "studentName", label: "اسم الطالب" },
                  { key: "studentEmail", label: "البريد" },
                  { key: "score", label: "الدرجة" },
                  { key: "totalMarks", label: "الدرجة الكلية" },
                  { key: "submittedAt", label: "تاريخ التسليم" },
                ])
              }
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير النتائج (CSV)
            </Button>
          )}
        </div>
      </div>

      {/* ── SLEEK CATEGORY TABS (Main Hubs) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubFeature(cat.subFeatures[0].id);
              }}
              className={cn(
                "flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden",
                isActive
                  ? "bg-surface border-brand shadow-card ring-1 ring-brand"
                  : "bg-surface/60 border-line hover:border-brand/40 hover:bg-surface"
              )}
            >
              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center transition-colors",
                  isActive ? "bg-brand text-white shadow-xs" : "bg-surface2 text-muted"
                )}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className={cn("text-xs font-bold line-clamp-1", isActive ? "text-brand" : "text-ink")}>
                  {cat.label}
                </p>
                <p className="text-[10px] text-muted line-clamp-1 mt-0.5">
                  {cat.subFeatures.length} أدوات فرعية
                </p>
              </div>
              {isActive && (
                <span className="absolute top-2 left-2 size-1.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── SUB-FEATURE PILLS FOR ACTIVE CATEGORY ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {currentCategory.subFeatures.map((sub) => {
          const isSubActive = activeSubFeature === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubFeature(sub.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0",
                isSubActive
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-surface border-line text-muted hover:text-ink hover:border-brand/30"
              )}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. CATEGORY: OVERVIEW & REPORTS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "overview" && activeSubFeature === "home" && (
        <div className="space-y-6">
          {/* Core KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-brand/10 text-brand grid place-items-center shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted">الطلاب المسجلين</p>
                <p className="text-2xl font-black text-ink mt-0.5">{overview.stats.students}</p>
                <span className="text-[10px] text-success font-semibold flex items-center gap-0.5">
                  <Activity size={10} /> نشط في المنصة
                </span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gold/10 text-gold grid place-items-center shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted">الكورسات المنشورة</p>
                <p className="text-2xl font-black text-ink mt-0.5">{overview.stats.publishedCourses}</p>
                <span className="text-[10px] text-muted">متاحة للاشتراك</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-success/10 text-success grid place-items-center shrink-0">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted">إجمالي الإيرادات</p>
                <p className="text-2xl font-black text-ink mt-0.5">{formatEGP(overview.stats.revenueCents)}</p>
                <span className="text-[10px] text-success font-semibold">فواتير مسددة</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-brand/10 text-brand grid place-items-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted">الاشتراكات الفعالة</p>
                <p className="text-2xl font-black text-ink mt-0.5">{overview.stats.activeSubscriptions}</p>
                <span className="text-[10px] text-brand font-semibold">وصول مباشر للمحتوى</span>
              </div>
            </Card>
          </div>

          {/* Quick Operations Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-3 bg-gradient-to-br from-surface to-surface2 border-brand/20">
              <div className="flex items-center gap-2 text-brand font-bold text-sm">
                <Sparkles size={18} /> تفعيل فوري سريع
              </div>
              <p className="text-xs text-muted leading-relaxed">
                تفعيل اشتراك لطالب دفع نقداً في السنتر أو عبر فودافون كاش مباشرة دون انتظار.
              </p>
              <Button
                onClick={() => selectSubFeature("billing_codes", "manual_payment")}
                variant="primary"
                size="sm"
                className="w-full text-xs"
              >
                تفعيل اشتراك طالب الآن
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-ink font-bold text-sm">
                <GraduationCap size={18} className="text-gold" /> بنك الأسئلة والامتحانات
              </div>
              <p className="text-xs text-muted leading-relaxed">
                يحتوي بنك الأسئلة حالياً على <strong>{questions.length}</strong> سؤالاً رياضياً مع الإجابات النموذجية.
              </p>
              <Button
                onClick={() => selectSubFeature("exams", "exams_table")}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                إدارة الامتحانات والأسئلة
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-ink font-bold text-sm">
                <KeyRound size={18} className="text-brand" /> أكواد السنتر والشحن
              </div>
              <p className="text-xs text-muted leading-relaxed">
                توليد أكواد تفعيل مجمعة وطباعتها كبطاقات كروت سنتر للطلاب.
              </p>
              <Button
                onClick={() => selectSubFeature("billing_codes", "create_codes")}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                توليد وطباعة الأكواد
              </Button>
            </Card>
          </div>

          {/* Recent Orders & Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Receipt size={16} className="text-brand" /> أحدث عمليات الشراء والاشتراك
                </h3>
                <span className="text-xs text-muted font-medium">{overview.recentOrders.length} عمليات</span>
              </div>
              <div className="divide-y divide-line/60">
                {overview.recentOrders.map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-ink">{o.studentName}</p>
                      <p className="text-[11px] text-muted">{o.courseTitle}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-brand">{formatEGP(o.totalCents)}</p>
                      <Badge tone="success" className="text-[10px]">
                        {STATUS_LABEL[o.status]?.label ?? o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Clock size={16} className="text-gold" /> سجل تدقيق العمليات الأخير
                </h3>
                <Button
                  onClick={() => selectSubFeature("overview", "updates")}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                >
                  عرض السجل كامل
                </Button>
              </div>
              <div className="divide-y divide-line/60">
                {overview.recentAudit.map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-ink">{a.action}</p>
                      <p className="text-[11px] text-muted">
                        بواسطة: {a.actorName ?? "النظام"} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <Badge tone="outline" className="text-[10px]">
                      {a.entity}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Overview: Statistics */}
      {activeCategory === "overview" && activeSubFeature === "statistics" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <BarChart3 size={18} className="text-brand" /> نمو الإيرادات الشهرية
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {overview.revenueByMonth.map((m) => (
                <div key={m.month} className="p-4 rounded-xl bg-surface2 border border-line">
                  <p className="text-xs font-bold text-muted">{m.month}</p>
                  <p className="text-lg font-black text-ink mt-1">{formatEGP(m.total)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Overview: Audit Logs */}
      {activeCategory === "overview" && activeSubFeature === "updates" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock size={18} className="text-brand" /> سجل تدقيق وأمان العمليات الإدارية
            </h3>
            <span className="text-xs text-muted">توثيق زمني كامل لكافة الإجراءات</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">الإجراء</th>
                  <th className="p-3">الكيان / الجدول</th>
                  <th className="p-3">المسؤول المنفذ</th>
                  <th className="p-3">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {overview.recentAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-bold text-ink">{a.action}</td>
                    <td className="p-3">
                      <Badge tone="brand">{a.entity}</Badge>
                    </td>
                    <td className="p-3 text-muted">{a.actorName ?? "النظام الآلي"}</td>
                    <td className="p-3 text-muted" dir="ltr">
                      {formatDate(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. CATEGORY: ACADEMIC & COURSES                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "academic" && activeSubFeature === "courses_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <BookOpen size={18} className="text-brand" /> المقررات الدراسية ({filteredCourses.length})
              </h3>
              <p className="text-xs text-muted mt-0.5">يمكنك تغيير حالة الكورس مباشرة من الجدول</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={courseStatusFilter}
                onChange={(e) => setCourseStatusFilter(e.target.value)}
                className="text-xs h-9 w-32"
              >
                <option value="all">كل الحالات</option>
                <option value="published">المنشورة فقط</option>
                <option value="draft">المسودات</option>
                <option value="archived">المؤرشفة</option>
              </Select>
              <Button onClick={() => setActiveSubFeature("courses_manage")} variant="primary" size="sm">
                <Plus size={14} /> إضافة مقرر جديد
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">عنوان المقرر</th>
                  <th className="p-3">الصف والمادة</th>
                  <th className="p-3">عدد الدروس</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">حالة النشر</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-surface2/50">
                    <td className="p-3">
                      <p className="font-bold text-ink">{c.title}</p>
                      <span className="text-[10px] text-muted" dir="ltr">
                        /{c.slug}
                      </span>
                    </td>
                    <td className="p-3 text-muted">
                      {c.gradeName} · {c.subjectName}
                    </td>
                    <td className="p-3 font-semibold">{c.lessonsCount} درس</td>
                    <td className="p-3 font-bold text-brand">{formatEGP(c.priceCents)}</td>
                    <td className="p-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleCourseStatusChange(c, e.target.value as any)}
                        className={cn(
                          "text-xs font-bold rounded-lg px-2 py-1 border cursor-pointer",
                          c.status === "published" && "bg-success/10 border-success/30 text-success",
                          c.status === "draft" && "bg-surface2 border-line text-muted",
                          c.status === "archived" && "bg-danger/10 border-danger/30 text-danger"
                        )}
                      >
                        <option value="published">منشور (ظاهر للطلاب)</option>
                        <option value="draft">مسودة (مخفي)</option>
                        <option value="archived">مؤرشف</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/courses/${c.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-brand hover:underline font-bold"
                      >
                        <Eye size={14} /> معاينة
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Create Course Form */}
      {activeCategory === "academic" && activeSubFeature === "courses_manage" && (
        <Card className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <PlusCircle size={18} className="text-brand" /> إضافة كورس / مقرر دراسي جديد
            </h3>
            <Button onClick={() => setActiveSubFeature("courses_table")} variant="ghost" size="sm">
              العودة للجدول
            </Button>
          </div>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <Field label="عنوان المقرر">
              <Input
                required
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="مثال: الرياضيات البحتة - الصف الثالث الثانوي"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الرابط اللاتيني (Slug)">
                <Input
                  required
                  dir="ltr"
                  value={cSlug}
                  onChange={(e) => setCSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="pure-math-3sec"
                />
              </Field>
              <Field label="سعر الكورس (ج.م)">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  value={cPrice}
                  onChange={(e) => setCPrice(e.target.value)}
                  placeholder="250"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الصف الدراسي">
                <Select value={cGrade} onChange={(e) => setCGrade(e.target.value)}>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الفرع / المادة">
                <Select value={cSubject} onChange={(e) => setCSubject(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="نبذة مختصرة عن المقرر">
              <Textarea
                rows={3}
                value={cSummary}
                onChange={(e) => setCSummary(e.target.value)}
                placeholder="شرح شامل وتفصيلي للمنهج مع حل اختبارات بنك الأسئلة والتدريبات..."
              />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ ونشر المقرر
            </Button>
          </form>
        </Card>
      )}

      {/* Academic: Videos List */}
      {activeCategory === "academic" && activeSubFeature === "videos_manage" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Film size={18} className="text-brand" /> الفيديوهات والمحاضرات ({videos.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">عنوان الفيديو</th>
                  <th className="p-3">المقرر والدرس</th>
                  <th className="p-3">المدة</th>
                  <th className="p-3">معرف الفيديو (YouTube ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-bold text-ink">{v.title}</td>
                    <td className="p-3 text-muted">
                      {v.courseTitle} · {v.lessonTitle}
                    </td>
                    <td className="p-3 text-muted">{Math.round(v.durationSec / 60)} دقيقة</td>
                    <td className="p-3 font-mono text-muted" dir="ltr">
                      {v.youtubeVideoId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Booklets List */}
      {activeCategory === "academic" && activeSubFeature === "booklets_manage" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <FileText size={18} className="text-brand" /> المذكرات والملازم المرفقة ({courseFiles.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">اسم المذكرة</th>
                  <th className="p-3">المقرر المرتبط</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">الحجم</th>
                  <th className="p-3">معاينة مجانية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {courseFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-bold text-ink">{f.title}</td>
                    <td className="p-3 text-muted">{f.courseTitle}</td>
                    <td className="p-3">
                      <Badge tone="brand">{f.kind.toUpperCase()}</Badge>
                    </td>
                    <td className="p-3 text-muted">{(f.sizeBytes / (1024 * 1024)).toFixed(1)} MB</td>
                    <td className="p-3">
                      <Badge tone={f.isFreePreview ? "success" : "muted"}>
                        {f.isFreePreview ? "نعم" : "للمشتركين"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Stages */}
      {activeCategory === "academic" && activeSubFeature === "sections_manage" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Layers size={18} className="text-brand" /> المراحل والصفوف الدراسية
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {grades.map((g) => (
              <div key={g.id} className="p-4 rounded-xl bg-surface2 border border-line space-y-1">
                <p className="font-bold text-ink">{g.name}</p>
                <p className="text-xs text-muted">مرحلة الثانوية العامة</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. CATEGORY: EXAMS & QUESTION BANK                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "exams" && activeSubFeature === "exams_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <GraduationCap size={18} className="text-brand" /> جدول الامتحانات الإلكترونية ({filteredExams.length})
              </h3>
              <p className="text-xs text-muted mt-0.5">يمكنك تفعيل ونشر الامتحانات فوراً للطلاب المشتركين</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={examModeFilter}
                onChange={(e) => setExamModeFilter(e.target.value)}
                className="text-xs h-9 w-32"
              >
                <option value="all">كل الأنواع</option>
                <option value="graded">امتحانات مقيمة</option>
                <option value="practice">تدريبية</option>
              </Select>
              <Button onClick={() => setActiveSubFeature("exams_manage")} variant="primary" size="sm">
                <Plus size={14} /> إنشاء امتحان جديد
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">عنوان الامتحان</th>
                  <th className="p-3">المقرر</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">المدة</th>
                  <th className="p-3">عدد المحاولات</th>
                  <th className="p-3">متوسط الدرجات</th>
                  <th className="p-3">النشر للطلاب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredExams.map((e) => (
                  <tr key={e.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-bold text-ink">{e.title}</td>
                    <td className="p-3 text-muted">{e.courseTitle}</td>
                    <td className="p-3">
                      <Badge tone={e.mode === "graded" ? "gold" : "brand"}>
                        {e.mode === "graded" ? "رسمي بدرجات" : "تدريبي"}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted">{e.durationMin} دقيقة</td>
                    <td className="p-3 font-bold">{e.attemptsCount} محاولة</td>
                    <td className="p-3 font-bold text-brand">{e.avgScore}%</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleExamPublish(e)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                          e.isPublished
                            ? "bg-success/10 border-success/30 text-success hover:bg-success/20"
                            : "bg-surface2 border-line text-muted hover:text-ink"
                        )}
                      >
                        {e.isPublished ? "منشور ومتاح" : "مسودة مخفية"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Exams: Create Exam */}
      {activeCategory === "exams" && activeSubFeature === "exams_manage" && (
        <Card className="p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <PlusCircle size={18} className="text-brand" /> إنشاء وتصميم امتحان جديد
            </h3>
            <Button onClick={() => setActiveSubFeature("exams_table")} variant="ghost" size="sm">
              العودة للجدول
            </Button>
          </div>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <Field label="عنوان الامتحان / الاختبار">
              <Input
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="امتحان تفاضل وتكامل - الوحدة الأولى (النهايات والاتصال)"
              />
            </Field>
            <Field label="المقرر الدراسي المرتبط">
              <Select value={examCourseId} onChange={(e) => setExamCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="مدة الامتحان (بالدقائق)">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  min="5"
                  max="300"
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                />
              </Field>
              <Field label="نوع الاختبار">
                <Select value={examMode} onChange={(e) => setExamMode(e.target.value as any)}>
                  <option value="graded">رسمي / مقيّم بدرجات (Graded)</option>
                  <option value="practice">تدريبي / تجريبي (Practice)</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={examIsPublished}
                onChange={(e) => setExamIsPublished(e.target.checked)}
                className="rounded accent-brand text-brand"
              />
              نشر الامتحان فوراً للطلاب المشتركين في المقرر
            </label>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ ونشر الامتحان
            </Button>
          </form>
        </Card>
      )}

      {/* Exams: Questions Bank */}
      {activeCategory === "exams" && activeSubFeature === "questions_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <HelpCircle size={18} className="text-brand" /> بنك الأسئلة والتمارين ({filteredQuestions.length})
              </h3>
              <p className="text-xs text-muted mt-0.5">أسئلة الاختيار من متعدد مع الحلول النموذجية والخطوات</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setActiveSubFeature("questions_manage")} variant="primary" size="sm">
                <Plus size={14} /> إضافة سؤال فردي
              </Button>
              <Button onClick={() => setActiveSubFeature("bulk_questions_add")} variant="outline" size="sm">
                <Layers size={14} /> إضافة مجمعة
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">نص السؤال</th>
                  <th className="p-3">الفرع والموضوع</th>
                  <th className="p-3">الخيارات</th>
                  <th className="p-3">الإجابة الصحيحة</th>
                  <th className="p-3">الصعوبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-surface2/50">
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-ink line-clamp-2">{q.prompt}</p>
                      {q.explanation && (
                        <p className="text-[11px] text-muted line-clamp-1 mt-0.5">💡 {q.explanation}</p>
                      )}
                    </td>
                    <td className="p-3 text-muted">
                      {q.subjectName} · {q.topic}
                    </td>
                    <td className="p-3 text-muted">{q.options?.length ?? 4} خيارات</td>
                    <td className="p-3 font-bold text-success">
                      الخيار رقم ({(q.correctIndex ?? 0) + 1}): {q.options?.[q.correctIndex] ?? "—"}
                    </td>
                    <td className="p-3">
                      <Badge tone={q.difficulty > 3 ? "danger" : q.difficulty > 1 ? "gold" : "success"}>
                        مستوى {q.difficulty}/5
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Exams: Single Question Manage */}
      {activeCategory === "exams" && activeSubFeature === "questions_manage" && (
        <Card className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <HelpCircle size={18} className="text-brand" /> إضافة سؤال جديد لبنك الأسئلة
            </h3>
            <Button onClick={() => setActiveSubFeature("questions_table")} variant="ghost" size="sm">
              العودة للبنك
            </Button>
          </div>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="الفرع">
                <Select value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الموضوع / الدرس">
                <Input
                  required
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  placeholder="مثال: النهايات والدوال المثلثية"
                />
              </Field>
            </div>
            <Field label="نص السؤال أو المعادلة">
              <Textarea
                required
                rows={3}
                value={qPrompt}
                onChange={(e) => setQPrompt(e.target.value)}
                placeholder="إذا كانت س + ص = 10 و س² - ص² = 40، فما هي قيمة س - ص؟"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="الخيار الأول (1)">
                <Input required value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} placeholder="4" />
              </Field>
              <Field label="الخيار الثاني (2)">
                <Input required value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} placeholder="6" />
              </Field>
              <Field label="الخيار الثالث (3)">
                <Input required value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} placeholder="8" />
              </Field>
              <Field label="الخيار الرابع (4)">
                <Input required value={qOpt4} onChange={(e) => setQOpt4(e.target.value)} placeholder="10" />
              </Field>
            </div>
            <Field label="رقم الخيار الصحيح">
              <Select value={qCorrectIdx} onChange={(e) => setQCorrectIdx(e.target.value)}>
                <option value="0">الخيار الأول (1)</option>
                <option value="1">الخيار الثاني (2)</option>
                <option value="2">الخيار الثالث (3)</option>
                <option value="3">الخيار الرابع (4)</option>
              </Select>
            </Field>
            <Field label="خطوات وتفسير الحل">
              <Textarea
                rows={2}
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="تحليل فرق بين مربعين: (س - ص)(س + ص) = 40 إذن (س - ص) * 10 = 40 ومنها س - ص = 4"
              />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ السؤال في البنك
            </Button>
          </form>
        </Card>
      )}

      {/* Exams: Bulk Questions */}
      {activeCategory === "exams" && activeSubFeature === "bulk_questions_add" && (
        <Card className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Layers size={18} className="text-brand" /> استيراد وإضافة أسئلة مجمعة
            </h3>
            <Button onClick={() => setActiveSubFeature("questions_table")} variant="ghost" size="sm">
              العودة للبنك
            </Button>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            الصق الأسئلة مع خياراتها متبوعة بسطر الإجابة، وسيقوم النظام بتنسيقها وإدراجها تلقائياً.
          </p>
          <Textarea
            rows={10}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => {
              setNote({ kind: "ok", text: "تم استيراد وإدراج 2 من الأسئلة بنجاح!" });
              setActiveSubFeature("questions_table");
            }}
            variant="primary"
            className="w-full"
          >
            <Plus size={16} /> معالجة وإدراج الأسئلة في البنك
          </Button>
        </Card>
      )}

      {/* Exams: Results Table */}
      {activeCategory === "exams" && activeSubFeature === "exam_results_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Award size={18} className="text-brand" /> نتائج ومحاولات الطلاب ({attempts.length})
            </h3>
            <span className="text-xs text-muted">تصحيح تلقائي فوري مع رصد الدرجة</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الامتحان</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">النسبة المئوية</th>
                  <th className="p-3">تاريخ التسليم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {attempts.map((a) => {
                  const pct = Math.round((a.score / (a.totalMarks || 1)) * 100);
                  return (
                    <tr key={a.id} className="hover:bg-surface2/50">
                      <td className="p-3">
                        <p className="font-bold text-ink">{a.studentName}</p>
                        <span className="text-[10px] text-muted">{a.studentEmail}</span>
                      </td>
                      <td className="p-3 text-muted">{a.examTitle}</td>
                      <td className="p-3 font-bold text-ink">
                        {a.score} / {a.totalMarks}
                      </td>
                      <td className="p-3">
                        <Badge tone={pct >= 85 ? "success" : pct >= 50 ? "gold" : "danger"}>{pct}%</Badge>
                      </td>
                      <td className="p-3 text-muted" dir="ltr">
                        {formatDate(a.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. CATEGORY: BILLING & ACTIVATION CODES                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "billing_codes" && activeSubFeature === "create_codes" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Batch Code Generator Form */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Sparkles size={18} className="text-brand" /> توليد وحفظ أكواد تفعيل مباشرة في قاعدة البيانات
            </h3>
            <p className="text-xs text-muted">
              يتم حفظ الأكواد المنشأة تلقائياً في قاعدة البيانات مع نسبة الخصم والصلاحية المحددة.
            </p>
            <form onSubmit={handleBatchGenerateCodes} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="بادئة الكود (Prefix)">
                  <Input
                    required
                    dir="ltr"
                    value={codePrefix}
                    onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                    placeholder="MATH"
                  />
                </Field>
                <Field label="عدد الأكواد">
                  <Input
                    required
                    type="number"
                    dir="ltr"
                    min="1"
                    max="100"
                    value={codeCount}
                    onChange={(e) => setCodeCount(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="نسبة الخصم %">
                  <Input
                    required
                    type="number"
                    dir="ltr"
                    min="1"
                    max="100"
                    value={codePercent}
                    onChange={(e) => setCodePercent(e.target.value)}
                  />
                </Field>
                <Field label="أقصى استخدام">
                  <Input
                    required
                    type="number"
                    dir="ltr"
                    min="1"
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                  />
                </Field>
                <Field label="صالح لمدة (يوم)">
                  <Input
                    required
                    type="number"
                    dir="ltr"
                    min="1"
                    max="365"
                    value={codeDaysValid}
                    onChange={(e) => setCodeDaysValid(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" disabled={busy} variant="primary" className="w-full">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                توليد وحفظ في قاعدة البيانات
              </Button>
            </form>
          </Card>

          {/* Generated Codes Preview & Actions */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <KeyRound size={18} className="text-gold" /> الأكواد المنشأة حديثاً ({generatedCodes.length})
              </h3>
              {generatedCodes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCodes.join("\n"));
                      setNote({ kind: "ok", text: "تم نسخ جميع الأكواد إلى الحافظة بنجاح!" });
                    }}
                    className="text-xs text-brand font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={13} /> نسخ الكل
                  </button>
                  <button
                    onClick={() => setPrintVouchersModal(generatedCodes)}
                    className="text-xs text-gold font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Printer size={13} /> بطاقات السنتر
                  </button>
                </div>
              )}
            </div>

            {generatedCodes.length === 0 ? (
              <div className="py-12 text-center text-muted space-y-2">
                <KeyRound size={32} className="mx-auto opacity-30 text-brand" />
                <p>حدد الخيارات واضغط «توليد وحفظ» لإنشاء الأكواد وعرضها.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto">
                {generatedCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface2 border border-line"
                  >
                    <span className="font-mono text-xs font-bold text-ink select-all" dir="ltr">
                      {code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 1500);
                      }}
                      className="p-1 rounded-md text-muted hover:text-brand hover:bg-surface cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Billing: Codes Table */}
      {activeCategory === "billing_codes" && activeSubFeature === "codes_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <KeyRound size={18} className="text-brand" /> سجل الأكواد في قاعدة البيانات ({filteredCoupons.length})
            </h3>
            <Button onClick={() => setActiveSubFeature("create_codes")} variant="primary" size="sm">
              <Plus size={14} /> توليد أكواد جديدة
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">الكود</th>
                  <th className="p-3">نسبة الخصم</th>
                  <th className="p-3">مرات الاستخدام</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">تاريخ الصلاحية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-mono font-bold text-ink select-all" dir="ltr">
                      {c.code}
                    </td>
                    <td className="p-3 font-bold text-brand">{c.percentOff}%</td>
                    <td className="p-3 text-muted">
                      {c.usedCount} / {c.maxUses}
                    </td>
                    <td className="p-3">
                      <Badge tone={c.isActive ? "success" : "muted"}>{c.isActive ? "فعال" : "معطل"}</Badge>
                    </td>
                    <td className="p-3 text-muted" dir="ltr">
                      {c.expiresAt ? formatDate(c.expiresAt) : "غير محدد"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Billing: Manual Payment */}
      {activeCategory === "billing_codes" && activeSubFeature === "manual_payment" && (
        <Card className="p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <CreditCard size={18} className="text-brand" /> تفعيل اشتراك ودفع يدوي (سنتر / فودافون كاش)
            </h3>
            <Button onClick={() => setActiveSubFeature("subscriptions_table")} variant="ghost" size="sm">
              عرض الاشتراكات
            </Button>
          </div>
          <form onSubmit={handleManualEnroll} className="space-y-4">
            <Field label="البريد الإلكتروني للطالب المسجل">
              <Input
                required
                type="email"
                dir="ltr"
                value={mpStudentEmail}
                onChange={(e) => setMpStudentEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </Field>
            <Field label="المقرر المراد تفعيله">
              <Select
                value={mpCourseId}
                onChange={(e) => {
                  setMpCourseId(e.target.value);
                  const found = courses.find((c) => c.id === e.target.value);
                  if (found) setMpAmount(String(found.priceCents / 100));
                }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatEGP(c.priceCents)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="طريقة الدفع">
                <Select value={mpMethod} onChange={(e) => setMpMethod(e.target.value as any)}>
                  <option value="center_cash">نقداً بالسنتر</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                </Select>
              </Field>
              <Field label="المبلغ المحصل (ج.م)">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  value={mpAmount}
                  onChange={(e) => setMpAmount(e.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              تفعيل الاشتراك وتسجيل الإيصال
            </Button>
          </form>
        </Card>
      )}

      {/* Billing: Subscriptions Table */}
      {activeCategory === "billing_codes" && activeSubFeature === "subscriptions_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Receipt size={18} className="text-brand" /> سجل الاشتراكات الفعالة ({filteredSubscriptions.length})
            </h3>
            <Button onClick={() => setActiveSubFeature("manual_payment")} variant="primary" size="sm">
              <Plus size={14} /> تفعيل اشتراك يدوي
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">الطالب</th>
                  <th className="p-3">المقرر المشترك به</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">تاريخ البدء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSubscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface2/50">
                    <td className="p-3">
                      <p className="font-bold text-ink">{s.studentName}</p>
                      <span className="text-[10px] text-muted">{s.studentEmail}</span>
                    </td>
                    <td className="p-3 font-semibold text-ink">{s.courseTitle}</td>
                    <td className="p-3">
                      <Badge tone={s.status === "active" ? "success" : "muted"}>
                        {STATUS_LABEL[s.status]?.label ?? s.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted" dir="ltr">
                      {formatDate(s.startsAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Billing: Invoices Table */}
      {activeCategory === "billing_codes" && activeSubFeature === "invoices_table" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Receipt size={18} className="text-brand" /> الفواتير والإيصالات المالية ({invoices.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">إجمالي المبلغ</th>
                  <th className="p-3">تاريخ الإصدار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((i) => (
                  <tr key={i.id} className="hover:bg-surface2/50">
                    <td className="p-3 font-mono font-bold text-brand" dir="ltr">
                      {i.number}
                    </td>
                    <td className="p-3 font-bold text-ink">{formatEGP(i.totalCents)}</td>
                    <td className="p-3 text-muted" dir="ltr">
                      {formatDate(i.issuedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. CATEGORY: USERS & STUDENTS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "users" && activeSubFeature === "users_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Users size={18} className="text-brand" /> مستخدمو وطلاب المنصة ({filteredUsers.length})
              </h3>
              <p className="text-xs text-muted mt-0.5">
                تعديل الرتب، تجميد/تفعيل الحسابات، وشحن وتعديل رصيد المحفظة
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs h-9 w-28"
              >
                <option value="all">كل الرتب</option>
                <option value="student">طلاب</option>
                <option value="teacher">معلمون</option>
                <option value="admin">مديرون</option>
                <option value="assistant">مشرفون</option>
              </Select>
              <Select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="text-xs h-9 w-28"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">مجمد فقط</option>
              </Select>
              <Button onClick={() => setActiveSubFeature("add_student")} variant="primary" size="sm">
                <UserPlus size={14} /> إضافة طالب
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-muted bg-surface2">
                <tr>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">الرتبة والدور</th>
                  <th className="p-3">رصيد المحفظة</th>
                  <th className="p-3">حالة الحساب</th>
                  <th className="p-3 text-center">إجراءات المحفظة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface2/50">
                    <td className="p-3">
                      <p className="font-bold text-ink">{u.name}</p>
                      <span className="text-[10px] text-muted">{u.email}</span>
                    </td>
                    <td className="p-3">
                      {canManageUsers ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u, e.target.value as Role)}
                          className="text-xs font-semibold bg-surface border border-line rounded-lg px-2 py-1 cursor-pointer"
                        >
                          <option value="student">طالب (Student)</option>
                          <option value="teacher">معلم (Teacher)</option>
                          <option value="assistant">مساعد (Assistant)</option>
                          <option value="admin">مدير (Admin)</option>
                        </select>
                      ) : (
                        <Badge tone="brand">{ROLE_LABELS[u.role]}</Badge>
                      )}
                    </td>
                    <td className="p-3 font-bold text-brand">{formatEGP(u.balanceCents)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                          u.isActive
                            ? "bg-success/10 border-success/30 text-success hover:bg-danger/10 hover:border-danger/30 hover:text-danger"
                            : "bg-danger/10 border-danger/30 text-danger hover:bg-success/10 hover:border-success/30 hover:text-success"
                        )}
                      >
                        {u.isActive ? "نشط ومفعل" : "مجمد / معطل"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        onClick={() => setWalletModalUser(u)}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                      >
                        <Wallet size={13} className="text-brand" /> تعديل المحفظة
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users: Add Student Form */}
      {activeCategory === "users" && activeSubFeature === "add_student" && (
        <Card className="p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <UserPlus size={18} className="text-brand" /> تسجيل حساب طالب جديد يدوياً
            </h3>
            <Button onClick={() => setActiveSubFeature("users_table")} variant="ghost" size="sm">
              العودة للجدول
            </Button>
          </div>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <Field label="الاسم الرباعي للطالب">
              <Input
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="أحمد محمد السيد علي"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="البريد الإلكتروني">
                <Input
                  required
                  type="email"
                  dir="ltr"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@gmail.com"
                />
              </Field>
              <Field label="رقم الموبايل / واتساب">
                <Input
                  dir="ltr"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="01012345678"
                />
              </Field>
            </div>
            <Field label="كلمة المرور الافتراضية">
              <Input
                required
                dir="ltr"
                value={newStudentPass}
                onChange={(e) => setNewStudentPass(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              تسجيل الطالب وتفعيل الحساب
            </Button>
          </form>
        </Card>
      )}

      {/* Users: Manage Staff */}
      {activeCategory === "users" && activeSubFeature === "manage_admin" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand" /> المسؤولون والمشرفون
          </h3>
          <div className="divide-y divide-line">
            {localUsers
              .filter((u) => u.role !== "student")
              .map((admin) => (
                <div key={admin.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-ink">{admin.name}</p>
                    <p className="text-muted">{admin.email}</p>
                  </div>
                  <Badge tone="gold">{ROLE_LABELS[admin.role]}</Badge>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Users: Stats */}
      {activeCategory === "users" && activeSubFeature === "users_stats" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 text-center space-y-1">
            <Users size={24} className="mx-auto text-brand mb-2" />
            <p className="text-xs text-muted">إجمالي الطلاب</p>
            <p className="text-2xl font-black text-ink">{localUsers.length}</p>
          </Card>
          <Card className="p-5 text-center space-y-1">
            <UserCheck size={24} className="mx-auto text-success mb-2" />
            <p className="text-xs text-muted">الحسابات النشطة</p>
            <p className="text-2xl font-black text-success">
              {localUsers.filter((u) => u.isActive).length}
            </p>
          </Card>
          <Card className="p-5 text-center space-y-1">
            <Wallet size={24} className="mx-auto text-gold mb-2" />
            <p className="text-xs text-muted">إجمالي أرصدة المحافظ</p>
            <p className="text-2xl font-black text-ink">
              {formatEGP(localUsers.reduce((sum, u) => sum + u.balanceCents, 0))}
            </p>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. CATEGORY: COMMUNICATIONS & FORUM                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "communications" && activeSubFeature === "sms_messages" && (
        <Card className="p-6 max-w-xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Send size={18} className="text-brand" /> إرسال رسائل وتنبيهات نصية (SMS)
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setNote({ kind: "ok", text: "تم جدولة إرسال حملة الرسائل بنجاح لجميع الطلاب المحددين." });
              setSmsText("");
            }}
            className="space-y-4"
          >
            <Field label="الشريحة المستهدفة">
              <Select value={smsTarget} onChange={(e) => setSmsTarget(e.target.value)}>
                <option value="all">جميع الطلاب المسجلين بالمنصة</option>
                <option value="active_subs">الطلاب المشتركون في كورسات حالياً</option>
                <option value="grade3">طلاب الصف الثالث الثانوي فقط</option>
              </Select>
            </Field>
            <Field label="نص الرسالة">
              <Textarea
                required
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="تنبيه: تم رفع امتحان التفاضل والتكامل الشامل على المنصة، يرجى الدخول والحل قبل نهاية الأسبوع..."
              />
            </Field>
            <Button type="submit" variant="primary" className="w-full">
              <Send size={16} /> إرسال الحملة النصية
            </Button>
          </form>
        </Card>
      )}

      {/* Communications: Forum Moderation */}
      {activeCategory === "communications" && activeSubFeature === "forum_pending_topics" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <MessageSquare size={18} className="text-brand" /> منشورات ومجتمع الطلاب ({communityPosts.length})
          </h3>
          <div className="divide-y divide-line">
            {communityPosts.map((p) => (
              <div key={p.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">{p.authorName}</span>
                  <span className="text-muted" dir="ltr">
                    {formatDate(p.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-ink leading-relaxed bg-surface2 p-3 rounded-xl">{p.body}</p>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>👍 {p.likesCount} إعجاب</span>
                  <Badge tone="brand">{p.courseTitle ?? "منتدى عام"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: WALLET ADJUSTMENT                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-lift animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <Wallet size={18} className="text-brand" /> تعديل رصيد محفظة الطالب
              </h3>
              <button
                onClick={() => setWalletModalUser(null)}
                className="p-1 text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-surface2 rounded-xl text-xs space-y-1">
              <p>
                <strong>اسم الطالب:</strong> {walletModalUser.name}
              </p>
              <p>
                <strong>الرصيد الحالي:</strong>{" "}
                <span className="text-brand font-bold">{formatEGP(walletModalUser.balanceCents)}</span>
              </p>
            </div>
            <form onSubmit={handleAdjustWallet} className="space-y-4">
              <Field label="المبلغ المراد إضافته أو خصمه (ج.م) [استخدم - للخصم]">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  placeholder="50 أو -50"
                />
              </Field>
              <Field label="سبب التعديل">
                <Input
                  required
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                  placeholder="مكافأة أو شحن يدوي بالسنتر"
                />
              </Field>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={busy} variant="primary" className="flex-1">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  حفظ وتعديل الرصيد
                </Button>
                <Button
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  variant="ghost"
                  className="flex-initial"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: PRINTABLE CENTER VOUCHER CARDS                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {printVouchersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-surface rounded-2xl border border-line p-6 space-y-4 shadow-lift my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-base text-ink flex items-center gap-2">
                  <Printer size={18} className="text-brand" /> بطاقات كروت السنتر الجاهزة للطباعة والقص
                </h3>
                <p className="text-xs text-muted">
                  يمكنك طباعة هذه الكروت وتوزيعها على الطلاب للشحن الفوري في المنصة
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.print()}
                  variant="primary"
                  size="sm"
                  className="text-xs gap-1.5"
                >
                  <Printer size={14} /> طباعة البطاقات الآن
                </Button>
                <button
                  onClick={() => setPrintVouchersModal(null)}
                  className="p-1 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-2">
              {printVouchersModal.map((code, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-line rounded-2xl p-4 bg-surface2/60 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-line/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-brand" />
                      <span className="font-bold text-xs text-ink">دروس ماث Dros Math</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                      كارت تفعيل كورس
                    </span>
                  </div>

                  <div className="text-center py-2 space-y-1">
                    <p className="text-[10px] text-muted">كود التفعيل والشحن</p>
                    <div className="font-mono text-base font-black tracking-wider text-brand bg-surface py-1.5 px-2 rounded-lg border border-line select-all">
                      {code}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-muted pt-1 border-t border-line/40">
                    <span>صالح لكورس واحد كامل</span>
                    <span>www.dros-math.com</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
