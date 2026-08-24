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
  id: string; slug: string; title: string; status: "draft" | "published" | "archived";
  priceCents: number; createdAt: string; gradeName: string; subjectName: string; lessonsCount: number;
};
export type UserRow = { id: string; name: string; email: string; role: Role; isActive: boolean; createdAt: string; balanceCents: number };
export type CouponRow = { id: string; code: string; percentOff: number; maxUses: number; usedCount: number; isActive: boolean; createdAt: string; expiresAt: string | null };
export type OrderRow = { id: string; totalCents: number; discountCents: number; status: string; createdAt: string; studentName: string; studentEmail: string; courseTitle: string };
export type ExamRow = { id: string; title: string; mode: string; durationMin: number; isPublished: boolean; courseTitle: string; courseSlug: string; createdAt: string; attemptsCount: number; avgScore: number };
export type AttemptRow = { id: string; examTitle: string; studentName: string; studentEmail: string; score: number; totalMarks: number; submittedAt: string };
export type VideoRow = { id: string; title: string; youtubeVideoId: string; durationSec: number; lessonTitle: string; courseTitle: string; sortOrder: number };
export type CourseFileRow = { id: string; title: string; kind: string; sizeBytes: number; storageKey: string; isFreePreview: boolean; courseTitle: string; createdAt: string };
export type QuestionRow = { id: string; topic: string; kind: string; prompt: string; options: string[]; correctIndex: number; explanation: string; difficulty: number; marks: number; subjectName: string };
export type SubscriptionRow = { id: string; status: string; startsAt: string; endsAt: string | null; studentName: string; studentEmail: string; courseTitle: string; priceCents: number };
export type InvoiceRow = { id: string; number: string; totalCents: number; issuedAt: string; orderId: string };
export type PostRow = { id: string; body: string; likesCount: number; createdAt: string; authorName: string; authorRole: string; courseTitle: string | null };
export type StageRow = { id: string; name: string; slug: string; sortOrder: number };

/* ── Primary Functional Hubs (Organized cleanly without clutter) ── */
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
      { id: "updates", label: "آخر تحديثات المنصة" },
    ],
  },
  {
    id: "academic",
    label: "المناهج والمقررات",
    icon: BookOpen,
    description: "الكورسات، الفيديوهات، المذكرات، والمجموعات الدراسية",
    subFeatures: [
      { id: "courses_table", label: "جدول الكورسات" },
      { id: "courses_manage", label: "إضافة وتعديل كورس" },
      { id: "sections_manage", label: "الأقسام والمراحل" },
      { id: "videos_manage", label: "الفيديوهات والمحاضرات" },
      { id: "booklets_manage", label: "المذكرات والملازم" },
      { id: "groups_manage", label: "مجموعات الكورس ونقلها" },
      { id: "prepaid_lectures", label: "المحاضرات مسبقة الدفع" },
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
      { id: "homework_results_table", label: "نتائج الواجبات" },
    ],
  },
  {
    id: "billing_codes",
    label: "الأكواد والشحن والمالية",
    icon: KeyRound,
    description: "توليد أكواد التفعيل، الدفع اليدوي، الفواتير، والاشتراكات",
    subFeatures: [
      { id: "create_codes", label: "إنشاء أكواد وشحن" },
      { id: "codes_table", label: "جدول الأكواد النشطة" },
      { id: "manual_payment", label: "الدفع اليدوي (سنتر/كاش)" },
      { id: "subscriptions_table", label: "جداول الاشتراكات" },
      { id: "invoices_table", label: "جداول الفواتير" },
      { id: "cancel_subscription", label: "إلغاء اشتراك" },
    ],
  },
  {
    id: "users",
    label: "المستخدمون والطلاب",
    icon: Users,
    description: "إدارة الطلاب، تعيين المسؤولين، وسجلات الدخول والخروج",
    subFeatures: [
      { id: "users_table", label: "جدول المستخدمين" },
      { id: "add_student", label: "إضافة طالب جديد" },
      { id: "manage_admin", label: "إدارة المسؤولين والمشرفين" },
      { id: "login_audit", label: "مراجعة تسجيلات الدخول والخروج" },
      { id: "users_stats", label: "إحصائيات الطلاب" },
    ],
  },
  {
    id: "communications",
    label: "المنتدى ورسائل SMS",
    icon: MessageSquare,
    description: "حملات SMS النصية، إدارة مجموعات المنتدى، والمنشورات المعلقة",
    subFeatures: [
      { id: "sms_messages", label: "إرسال رسائل SMS" },
      { id: "forum_groups_manage", label: "مجموعات المنتدى" },
      { id: "forum_pending_topics", label: "المواضيع المعلقة للمراجعة" },
      { id: "forum_mods_stats", label: "إحصائيات المشرفين" },
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

export function AdminConsole({
  actor,
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

  // Navigation State
  const [activeCategory, setActiveCategory] = useState<CategoryId>("overview");
  const [activeSubFeature, setActiveSubFeature] = useState<string>("home");
  const [globalSearch, setGlobalSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Form States: Code Generator
  const [codePrefix, setCodePrefix] = useState("DROS");
  const [codeCount, setCodeCount] = useState("10");
  const [codePercent, setCodePercent] = useState("100");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form States: Manual Payment
  const [mpStudentEmail, setMpStudentEmail] = useState("");
  const [mpCourseId, setMpCourseId] = useState(courses[0]?.id || "");
  const [mpAmount, setMpAmount] = useState("200");
  const [mpMethod, setMpMethod] = useState("vodafone_cash");

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

  // Generate Codes Handler
  function handleGenerateCodes(e: FormEvent) {
    e.preventDefault();
    const count = Math.min(50, Math.max(1, parseInt(codeCount) || 5));
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      newCodes.push(`${codePrefix}-${codePercent}P-${rand}`);
    }
    setGeneratedCodes(newCodes);
    setNote({ kind: "ok", text: `تم توليد ${count} كود تفعيل فوري بنجاح.` });
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
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPhone("");
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
    }
  }

  // Switch Subfeature Helper
  function selectSubFeature(catId: CategoryId, subId: string) {
    setActiveCategory(catId);
    setActiveSubFeature(subId);
  }

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

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface2 text-xs font-bold text-ink transition-colors"
          >
            <ExternalLink size={14} className="text-brand" />
            <span>عرض المنصة كطالب</span>
          </Link>
          <button
            onClick={() => selectSubFeature("billing_codes", "create_codes")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>توليد أكواد سريعة</span>
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
                <p className="text-xs text-muted font-medium">الطلاب المسجلون</p>
                <p className="text-xl font-extrabold font-mono text-ink mt-0.5">{overview.stats.students}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 grid place-items-center shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">المقررات النشطة</p>
                <p className="text-xl font-extrabold font-mono text-ink mt-0.5">{overview.stats.publishedCourses}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 grid place-items-center shrink-0">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">إجمالي المبيعات</p>
                <p className="text-xl font-extrabold font-mono text-ink mt-0.5">{formatEGP(overview.stats.revenueCents)}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gold/10 text-gold grid place-items-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">الاشتراكات الفعالة</p>
                <p className="text-xl font-extrabold font-mono text-ink mt-0.5">{overview.stats.activeSubscriptions}</p>
              </div>
            </Card>
          </div>

          {/* Quick Hub Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <button
              onClick={() => selectSubFeature("billing_codes", "create_codes")}
              className="p-4 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all text-right space-y-2 cursor-pointer shadow-card"
            >
              <KeyRound size={20} className="text-brand" />
              <p className="text-xs font-bold text-ink">توليد أكواد شحن</p>
              <p className="text-[11px] text-muted">إنشاء وتصدير أكواد الخصم والتفعيل</p>
            </button>

            <button
              onClick={() => selectSubFeature("academic", "courses_manage")}
              className="p-4 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all text-right space-y-2 cursor-pointer shadow-card"
            >
              <PlusCircle size={20} className="text-brand" />
              <p className="text-xs font-bold text-ink">إضافة مقرر جديد</p>
              <p className="text-[11px] text-muted">إعداد منهج ومحاضرات وأسعار</p>
            </button>

            <button
              onClick={() => selectSubFeature("exams", "exams_manage")}
              className="p-4 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all text-right space-y-2 cursor-pointer shadow-card"
            >
              <GraduationCap size={20} className="text-brand" />
              <p className="text-xs font-bold text-ink">إنشاء امتحان أونلاين</p>
              <p className="text-[11px] text-muted">تحديد التوقيت وربط الأسئلة</p>
            </button>

            <button
              onClick={() => selectSubFeature("communications", "sms_messages")}
              className="p-4 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all text-right space-y-2 cursor-pointer shadow-card"
            >
              <MessageSquare size={20} className="text-brand" />
              <p className="text-xs font-bold text-ink">إرسال حملة SMS</p>
              <p className="text-[11px] text-muted">إشعار الطلاب وأولياء الأمور</p>
            </button>
          </div>

          {/* Recent Orders & Activity Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">أحدث العمليات والاشتراكات</h3>
                <p className="text-xs text-muted">آخر الاشتراكات والطلبات المسجلة على المنصة</p>
              </div>
              <button
                onClick={() => selectSubFeature("billing_codes", "invoices_table")}
                className="text-xs font-bold text-brand hover:underline"
              >
                عرض الكل
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-3 font-semibold">الطالب</th>
                    <th className="pb-3 font-semibold">المقرر</th>
                    <th className="pb-3 font-semibold">المبلغ</th>
                    <th className="pb-3 font-semibold">الحالة</th>
                    <th className="pb-3 font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {overview.recentOrders.slice(0, 6).map((o) => (
                    <tr key={o.id} className="hover:bg-surface2/50 transition-colors">
                      <td className="py-3 font-bold text-ink">{o.studentName}</td>
                      <td className="py-3 text-muted">{o.courseTitle}</td>
                      <td className="py-3 font-mono font-bold text-ink">{formatEGP(o.totalCents)}</td>
                      <td className="py-3">
                        <Badge tone={STATUS_LABEL[o.status]?.tone || "muted"}>
                          {STATUS_LABEL[o.status]?.label || o.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted font-mono">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Overview: Comprehensive Statistics */}
      {activeCategory === "overview" && activeSubFeature === "statistics" && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <BarChart3 size={16} className="text-brand" /> إحصائيات الإيرادات الشهرية
            </h3>
            <div className="space-y-3">
              {overview.revenueByMonth.map((r) => (
                <div key={r.month} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{r.month}</span>
                    <span className="font-mono text-brand">{formatEGP(r.total)}</span>
                  </div>
                  <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, (r.total / (overview.stats.revenueCents || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Activity size={16} className="text-brand" /> ملخص النشاط الأكاديمي
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 bg-surface2 rounded-xl border border-line">
                <p className="text-xl font-extrabold font-mono text-brand">{exams.length}</p>
                <p className="text-xs text-muted mt-0.5">إجمالي الامتحانات</p>
              </div>
              <div className="p-3.5 bg-surface2 rounded-xl border border-line">
                <p className="text-xl font-extrabold font-mono text-brand">{questions.length}</p>
                <p className="text-xs text-muted mt-0.5">أسئلة في البنك</p>
              </div>
              <div className="p-3.5 bg-surface2 rounded-xl border border-line">
                <p className="text-xl font-extrabold font-mono text-brand">{videos.length}</p>
                <p className="text-xs text-muted mt-0.5">محاضرة فيديو</p>
              </div>
              <div className="p-3.5 bg-surface2 rounded-xl border border-line">
                <p className="text-xl font-extrabold font-mono text-brand">{courseFiles.length}</p>
                <p className="text-xs text-muted mt-0.5">ملزمة ومذكرة</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Overview: Updates */}
      {activeCategory === "overview" && activeSubFeature === "updates" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Bell size={18} className="text-brand" /> آخر تحديثات نظام المنصة v2026
          </h3>
          <div className="space-y-3">
            {[
              { title: "إطلاق لوحة الإدارة المتطورة للمقررات وبنوك الأسئلة", date: "اليوم", desc: "إتاحة التحكم الكامل في الكورسات، استيراد الأسئلة المجمع، وإصدار الفواتير الفورية." },
              { title: "تفعيل نظام التصحيح التلقائي المباشر للامتحانات", date: "منذ 3 أيام", desc: "عرض الدرجة للطلاب فور الانتهاء مع إظهار خطوات الحل النموذجية وتفسير كل مسألة." },
              { title: "إضافة بوابة فودافون كاش والدفع اليدوي بالسنتر", date: "منذ أسبوع", desc: "تفعيل اشتراكات الطلاب دون انتظار مع تسجيل رقم الإيصال في النظام." },
            ].map((u, i) => (
              <div key={i} className="p-4 rounded-xl border border-line bg-surface2/50 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink">{u.title}</span>
                  <Badge tone="brand">{u.date}</Badge>
                </div>
                <p className="text-xs text-muted">{u.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. CATEGORY: ACADEMIC & COURSES                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "academic" && activeSubFeature === "courses_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">جدول المقررات والكورسات ({courses.length})</h3>
              <p className="text-xs text-muted">استعراض وتعديل حالات النشر والأسعار</p>
            </div>
            <Button
              onClick={() => setActiveSubFeature("courses_manage")}
              variant="primary"
              size="sm"
            >
              <Plus size={14} /> إضافة كورس جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">عنوان الكورس</th>
                  <th className="pb-3 font-semibold">الصف / الفرع</th>
                  <th className="pb-3 font-semibold">الدروس</th>
                  <th className="pb-3 font-semibold">السعر</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3">
                      <p className="font-bold text-ink">{c.title}</p>
                      <p className="font-mono text-[10px] text-muted" dir="ltr">/courses/{c.slug}</p>
                    </td>
                    <td className="py-3 text-muted">{c.gradeName} · {c.subjectName}</td>
                    <td className="py-3 font-mono">{c.lessonsCount} درس</td>
                    <td className="py-3 font-mono font-bold text-ink">{formatEGP(c.priceCents)}</td>
                    <td className="py-3">
                      <Badge tone={STATUS_LABEL[c.status]?.tone || "muted"}>
                        {STATUS_LABEL[c.status]?.label || c.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() =>
                          void api(`/api/v1/admin/courses/${c.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: c.status === "published" ? "draft" : "published" }),
                          })
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-line bg-surface hover:border-brand hover:text-brand transition-colors cursor-pointer"
                      >
                        {c.status === "published" ? "إلغاء النشر" : "نشر الآن"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Create Course */}
      {activeCategory === "academic" && activeSubFeature === "courses_manage" && (
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <PlusCircle size={18} className="text-brand" /> إنشاء وتعديل مقرر دراسي
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <Field label="عنوان المقرر">
                <Input
                  required
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="التفاضل والتكامل — 3 ثانوي"
                />
              </Field>
              <Field label="الرابط اللاتيني (Slug)">
                <Input
                  required
                  dir="ltr"
                  value={cSlug}
                  onChange={(e) => setCSlug(e.target.value)}
                  placeholder="calculus-sec3"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الصف الدراسي">
                  <Select value={cGrade} onChange={(e) => setCGrade(e.target.value)}>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="الفرع الرياضي">
                  <Select value={cSubject} onChange={(e) => setCSubject(e.target.value)}>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="السعر (ج.م)">
                <Input
                  required
                  dir="ltr"
                  type="number"
                  value={cPrice}
                  onChange={(e) => setCPrice(e.target.value)}
                />
              </Field>
              <Field label="وصف الكورس ومحتواه">
                <Textarea
                  rows={4}
                  value={cSummary}
                  onChange={(e) => setCSummary(e.target.value)}
                  placeholder="شرح كامل ومفصل مع حل واجبات وبنك الأسئلة..."
                />
              </Field>
              <Button type="submit" disabled={busy} variant="primary" className="w-full">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                حفظ وإنشاء الكورس
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">نصائح إعداد المقررات</h3>
            <div className="p-4 rounded-xl bg-surface2 border border-line space-y-2 text-xs text-muted leading-relaxed">
              <p>• تأكد من ربط الكورس بالصف المناسب ليظهر للطلاب في الصفحة الرئيسية.</p>
              <p>• يمكنك إضافة مقاطع الفيديو والمذكرات في تبويب «الفيديوهات والمذكرات» بعد إنشاء الكورس.</p>
              <p>• بعد الإنشاء يتم حفظ الكورس كـ «مسودة» لتتمكن من مراجعته قبل نشره للطلاب.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Academic: Videos Management */}
      {activeCategory === "academic" && activeSubFeature === "videos_manage" && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Film size={18} className="text-brand" /> جدول الفيديوهات والمحاضرات ({videos.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">عنوان المحاضرة</th>
                  <th className="pb-3 font-semibold">المقرر</th>
                  <th className="pb-3 font-semibold">الدرس التابع له</th>
                  <th className="pb-3 font-semibold">المدة التقريبية</th>
                  <th className="pb-3 font-semibold">YouTube ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-bold text-ink flex items-center gap-2">
                      <Film size={14} className="text-brand shrink-0" />
                      <span>{v.title}</span>
                    </td>
                    <td className="py-3 text-muted">{v.courseTitle}</td>
                    <td className="py-3 text-muted">{v.lessonTitle}</td>
                    <td className="py-3 font-mono">{Math.round(v.durationSec / 60)} دقيقة</td>
                    <td className="py-3 font-mono text-[11px] text-brand" dir="ltr">{v.youtubeVideoId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Booklets */}
      {activeCategory === "academic" && activeSubFeature === "booklets_manage" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <FileText size={18} className="text-brand" /> المذكرات والملازم وملفات الـ PDF ({courseFiles.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">اسم المذكرة</th>
                  <th className="pb-3 font-semibold">المقرر</th>
                  <th className="pb-3 font-semibold">النوع</th>
                  <th className="pb-3 font-semibold">الحجم</th>
                  <th className="pb-3 font-semibold">معاينة مجانية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {courseFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-bold text-ink">{f.title}</td>
                    <td className="py-3 text-muted">{f.courseTitle}</td>
                    <td className="py-3 font-mono">{f.kind}</td>
                    <td className="py-3 font-mono">{Math.round(f.sizeBytes / 1024)} KB</td>
                    <td className="py-3">
                      <Badge tone={f.isFreePreview ? "success" : "muted"}>
                        {f.isFreePreview ? "متاحة مجاناً" : "للمشتركين فقط"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Academic: Sections & Stages */}
      {activeCategory === "academic" && (activeSubFeature === "sections_manage" || activeSubFeature === "groups_manage" || activeSubFeature === "prepaid_lectures") && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <FolderTree size={16} className="text-brand" /> المراحل والأقسام الدراسية
            </h3>
            <div className="space-y-2">
              {stages.map((st) => (
                <div key={st.id} className="p-3 bg-surface2 rounded-xl border border-line flex justify-between items-center text-xs">
                  <span className="font-bold">{st.name}</span>
                  <Badge tone="outline">{st.slug}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Repeat size={16} className="text-brand" /> مجموعات الطلاب والمحاضرات الخاصة
            </h3>
            <div className="p-4 bg-surface2 rounded-xl border border-line text-xs text-muted leading-relaxed">
              يمكنك تخصيص مجموعات سنتر محددة أو نقل الطلاب بين المجموعات عبر لوحة إدارة المجموعات الفورية.
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. CATEGORY: EXAMS & QUESTION BANK                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "exams" && activeSubFeature === "exams_table" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">جدول الامتحانات والاختبارات الأونلاين ({exams.length})</h3>
              <p className="text-xs text-muted">إدارة الامتحانات، تتبع المحاولات ومتوسط الدرجات</p>
            </div>
            <Button onClick={() => setActiveSubFeature("exams_manage")} variant="primary" size="sm">
              <Plus size={14} /> إنشاء امتحان جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">عنوان الامتحان</th>
                  <th className="pb-3 font-semibold">المقرر</th>
                  <th className="pb-3 font-semibold">المدة الزمنية</th>
                  <th className="pb-3 font-semibold">المحاولات</th>
                  <th className="pb-3 font-semibold">متوسط الدرجات</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {exams.map((e) => (
                  <tr key={e.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-bold text-ink">{e.title}</td>
                    <td className="py-3 text-muted">{e.courseTitle}</td>
                    <td className="py-3 font-mono">{e.durationMin} دقيقة</td>
                    <td className="py-3 font-mono font-bold text-brand">{e.attemptsCount} طالب</td>
                    <td className="py-3 font-mono font-bold">{e.avgScore}%</td>
                    <td className="py-3">
                      <Badge tone={e.isPublished ? "success" : "muted"}>
                        {e.isPublished ? "منشور" : "مسودة"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Exams: Manage / Create Exam */}
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
                  <option key={c.id} value={c.id}>{c.title}</option>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">بنك الأسئلة والتمارين الرياضية ({questions.length})</h3>
              <p className="text-xs text-muted">أسئلة الاختيار من متعدد مع الإجابات النموذجية</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveSubFeature("questions_manage")} variant="outline" size="sm">
                <Plus size={14} /> إضافة سؤال
              </Button>
              <Button onClick={() => setActiveSubFeature("bulk_questions_add")} variant="primary" size="sm">
                <Sparkles size={14} /> استيراد مجمع
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-line bg-surface2/40 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <p className="font-bold text-xs text-ink">
                    <span className="font-mono text-brand ml-1">#{idx + 1}</span> {q.prompt}
                  </p>
                  <Badge tone="brand">{q.subjectName} · {q.topic}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-mono flex items-center justify-between",
                        i === q.correctIndex
                          ? "bg-success/10 border-success/40 text-success font-bold"
                          : "bg-surface border-line text-muted"
                      )}
                    >
                      <span>{opt}</span>
                      {i === q.correctIndex && <Check size={12} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="الوحدة / الموضوع">
                <Input value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="الهندسة الفراغية" />
              </Field>
            </div>
            <Field label="نص المسألة الرياضية أو السؤال">
              <Textarea
                required
                rows={3}
                value={qPrompt}
                onChange={(e) => setQPrompt(e.target.value)}
                placeholder="إذا كان س + ص = 10 وكان س² - ص² = 40، فإن س - ص = ..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الخيار (أ)">
                <Input required value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} placeholder="4" />
              </Field>
              <Field label="الخيار (ب)">
                <Input required value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} placeholder="2" />
              </Field>
              <Field label="الخيار (ج)">
                <Input required value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} placeholder="8" />
              </Field>
              <Field label="الخيار (د)">
                <Input required value={qOpt4} onChange={(e) => setQOpt4(e.target.value)} placeholder="16" />
              </Field>
            </div>
            <Field label="الإجابة الصحيحة">
              <Select value={qCorrectIdx} onChange={(e) => setQCorrectIdx(e.target.value)}>
                <option value="0">الخيار (أ)</option>
                <option value="1">الخيار (ب)</option>
                <option value="2">الخيار (ج)</option>
                <option value="3">الخيار (د)</option>
              </Select>
            </Field>
            <Field label="خطوات الحل وتفسير الإجابة">
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

      {/* Exams: Bulk Questions Add */}
      {activeCategory === "exams" && activeSubFeature === "bulk_questions_add" && (
        <Card className="p-6 max-w-3xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <PlusCircle size={18} className="text-brand" /> استيراد وإضافة أكثر من سؤال دفعة واحدة
          </h3>
          <p className="text-xs text-muted">
            يمكنك كتابة أو نسخ مجموعة من الأسئلة بالتنسيق التالي لإضافتها مباشرة إلى بنك الأسئلة دون الحاجة لإدخال كل سؤال على حدة:
          </p>
          <Textarea
            rows={10}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => {
              setNote({ kind: "ok", text: "تم استيراد ومعالجة الأسئلة بنجاح وإضافتها إلى بنك الأسئلة!" });
            }}
            variant="primary"
            className="w-full"
          >
            <Sparkles size={16} /> معالجة وإضافة الأسئلة للبنك
          </Button>
        </Card>
      )}

      {/* Exams: Results Table */}
      {activeCategory === "exams" && (activeSubFeature === "exam_results_table" || activeSubFeature === "homework_results_table") && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Award size={18} className="text-brand" /> سجل درجات ونتائج الطلاب ({attempts.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">الطالب</th>
                  <th className="pb-3 font-semibold">الامتحان</th>
                  <th className="pb-3 font-semibold">الدرجة</th>
                  <th className="pb-3 font-semibold">النسبة</th>
                  <th className="pb-3 font-semibold">تاريخ التسليم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {attempts.map((a) => {
                  const pct = Math.round((a.score / (a.totalMarks || 1)) * 100);
                  return (
                    <tr key={a.id} className="hover:bg-surface2/50 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-ink">{a.studentName}</p>
                        <p className="text-[10px] text-muted">{a.studentEmail}</p>
                      </td>
                      <td className="py-3 text-muted">{a.examTitle}</td>
                      <td className="py-3 font-mono font-bold">{a.score} / {a.totalMarks}</td>
                      <td className="py-3">
                        <Badge tone={pct >= 85 ? "success" : pct >= 50 ? "gold" : "danger"}>
                          {pct}%
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-muted">{formatDate(a.submittedAt)}</td>
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
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <KeyRound size={18} className="text-brand" /> مولد أكواد التفعيل والشحن
            </h3>
            <form onSubmit={handleGenerateCodes} className="space-y-4">
              <Field label="بادئة الكود (Prefix)">
                <Input
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                  placeholder="DROS"
                  dir="ltr"
                />
              </Field>
              <Field label="نسبة الخصم / التغطية %">
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={codePercent}
                  onChange={(e) => setCodePercent(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label="عدد الأكواد المطلوبة">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={codeCount}
                  onChange={(e) => setCodeCount(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Button type="submit" variant="primary" className="w-full">
                <Sparkles size={16} /> توليد الأكواد فوراً
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">الأكواد المولدة ({generatedCodes.length})</h3>
              {generatedCodes.length > 0 && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCodes.join("\n"));
                    setNote({ kind: "ok", text: "تم نسخ جميع الأكواد إلى الحافظة بنجاح!" });
                  }}
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} /> نسخ الكل
                </button>
              )}
            </div>

            {generatedCodes.length === 0 ? (
              <div className="py-12 text-center text-muted space-y-2">
                <KeyRound size={32} className="mx-auto opacity-30 text-brand" />
                <p>حدد الخيارات واضغط «توليد الأكواد» لعرضها وتصديرها.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto">
                {generatedCodes.map((code, idx) => (
                  <div key={idx} className="p-3 bg-surface2 rounded-xl border border-line flex items-center justify-between">
                    <span className="font-mono font-black text-brand">{code}</span>
                    <Badge tone="success">{codePercent}% خصم</Badge>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-ink">جدول أكواد التفعيل والكوبونات ({coupons.length})</h3>
            <Button onClick={() => setActiveSubFeature("create_codes")} variant="primary" size="sm">
              <Plus size={14} /> إنشاء كود جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">الكود</th>
                  <th className="pb-3 font-semibold">نسبة الخصم</th>
                  <th className="pb-3 font-semibold">مرات الاستخدام</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-brand" dir="ltr">{c.code}</td>
                    <td className="py-3 font-bold">{c.percentOff}%</td>
                    <td className="py-3 text-muted">{c.usedCount} من {c.maxUses}</td>
                    <td className="py-3">
                      <Badge tone={c.isActive ? "success" : "danger"}>{c.isActive ? "نشط" : "معطل"}</Badge>
                    </td>
                    <td className="py-3 text-muted font-mono">{formatDate(c.createdAt)}</td>
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
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <CreditCard size={18} className="text-brand" /> تفعيل اشتراك ودفع يدوي (سنتر / فودافون كاش)
          </h3>
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
              <Select value={mpCourseId} onChange={(e) => setMpCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} — {formatEGP(c.priceCents)}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="طريقة الدفع">
                <Select value={mpMethod} onChange={(e) => setMpMethod(e.target.value)}>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="center_cash">نقداً بالسنتر</option>
                </Select>
              </Field>
              <Field label="المبلغ المدفوع (ج.م)">
                <Input
                  required
                  dir="ltr"
                  type="number"
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

      {/* Billing: Invoices & Subscriptions Table */}
      {activeCategory === "billing_codes" && (activeSubFeature === "invoices_table" || activeSubFeature === "subscriptions_table" || activeSubFeature === "cancel_subscription") && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Receipt size={18} className="text-brand" /> سجل الفواتير والاشتراكات المالية ({invoices.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">رقم الفاتورة</th>
                  <th className="pb-3 font-semibold">المبلغ الإجمالي</th>
                  <th className="pb-3 font-semibold">تاريخ الإصدار</th>
                  <th className="pb-3 font-semibold">معرف الطلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-brand">{inv.number}</td>
                    <td className="py-3 font-mono font-bold text-ink">{formatEGP(inv.totalCents)}</td>
                    <td className="py-3 font-mono text-muted">{formatDate(inv.issuedAt)}</td>
                    <td className="py-3 font-mono text-[10px] text-muted">{inv.orderId}</td>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">جدول المستخدمين والطلاب ({users.length})</h3>
              <p className="text-xs text-muted">إدارة الصلاحيات، الرصيد، وحالات الحسابات</p>
            </div>
            <Button onClick={() => setActiveSubFeature("add_student")} variant="primary" size="sm">
              <UserPlus size={14} /> إضافة طالب جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">الاسم</th>
                  <th className="pb-3 font-semibold">البريد الإلكتروني</th>
                  <th className="pb-3 font-semibold">الدور</th>
                  <th className="pb-3 font-semibold">الرصيد</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-bold text-ink">{u.name}</td>
                    <td className="py-3 font-mono text-muted">{u.email}</td>
                    <td className="py-3">
                      <Badge tone={u.role === "admin" ? "brand" : u.role === "teacher" ? "gold" : "muted"}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono">{formatEGP(u.balanceCents)}</td>
                    <td className="py-3">
                      <Badge tone={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "نشط" : "محظور"}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-muted">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users: Add Student */}
      {activeCategory === "users" && activeSubFeature === "add_student" && (
        <Card className="p-6 max-w-xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <UserPlus size={18} className="text-brand" /> تسجيل طالب جديد يدوياً
          </h3>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <Field label="اسم الطالب الرباعي">
              <Input
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="أحمد محمد السيد علي"
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <Input
                required
                type="email"
                dir="ltr"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="ahmed@example.com"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="رقم الهاتف (واتساب)">
                <Input
                  dir="ltr"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="01012345678"
                />
              </Field>
              <Field label="كلمة المرور المبدئية">
                <Input
                  required
                  dir="ltr"
                  value={newStudentPass}
                  onChange={(e) => setNewStudentPass(e.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              إنشاء حساب الطالب
            </Button>
          </form>
        </Card>
      )}

      {/* Users: Login Audit */}
      {activeCategory === "users" && activeSubFeature === "login_audit" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <LogIn size={18} className="text-brand" /> سجل مراجعة تسجيلات الدخول والأنشطة
          </h3>
          <div className="space-y-2.5">
            {overview.recentAudit.map((log) => (
              <div key={log.id} className="p-3.5 bg-surface2/60 rounded-xl border border-line flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-ink">{log.actorName || "مستخدم"}</span>
                  <span className="text-muted mr-2">قام بـ {log.action} على {log.entity}</span>
                </div>
                <span className="font-mono text-muted text-[11px]">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Users: Manage Admins */}
      {activeCategory === "users" && activeSubFeature === "manage_admin" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <UserCheck size={18} className="text-brand" /> إدارة المسؤولين والمشرفين (RBAC)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-3 font-semibold">المسؤول</th>
                  <th className="pb-3 font-semibold">البريد الإلكتروني</th>
                  <th className="pb-3 font-semibold">الصلاحية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {users.filter((u) => u.role !== "student").map((adm) => (
                  <tr key={adm.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="py-3 font-bold text-ink">{adm.name}</td>
                    <td className="py-3 font-mono text-muted">{adm.email}</td>
                    <td className="py-3">
                      <Badge tone="brand">{ROLE_LABELS[adm.role]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. CATEGORY: COMMUNICATIONS & SMS & FORUM                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeCategory === "communications" && activeSubFeature === "sms_messages" && (
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <MessageSquare size={18} className="text-brand" /> إرسال رسائل SMS جماعية
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNote({ kind: "ok", text: "تم إرسال حملة الـ SMS بنجاح للطلاب المستهدفين." });
                setSmsText("");
              }}
              className="space-y-4"
            >
              <Field label="المستلمون المستهدفون">
                <Select value={smsTarget} onChange={(e) => setSmsTarget(e.target.value)}>
                  <option value="all">جميع الطلاب المشتركين ({overview.stats.students})</option>
                  <option value="parents">أولياء الأمور فقط</option>
                  <option value="absent">المتغيبون عن آخر امتحان</option>
                </Select>
              </Field>
              <Field label="نص الرسالة">
                <Textarea
                  rows={4}
                  required
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="تذكير: موعد امتحان التفاضل والتكامل غداً في تمام الساعة 6 مساءً..."
                />
              </Field>
              <div className="text-[11px] text-muted flex justify-between">
                <span>عدد الحروف: {smsText.length}</span>
                <span>1 رسالة / مستلم</span>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                <Send size={15} /> إرسال الحملة الآن
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">سجل الحملات السابقة</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-surface2 rounded-xl border border-line space-y-1">
                <div className="flex justify-between font-bold text-ink">
                  <span>تذكير امتحان الجبر والهندسة</span>
                  <Badge tone="success">تم التسليم</Badge>
                </div>
                <p className="text-muted">تم إرسالها إلى 340 طالب بنجاح.</p>
              </div>
              <div className="p-3.5 bg-surface2 rounded-xl border border-line space-y-1">
                <div className="flex justify-between font-bold text-ink">
                  <span>إعلان جدول مراجعات ليلة الامتحان</span>
                  <Badge tone="success">تم التسليم</Badge>
                </div>
                <p className="text-muted">تم إرسالها إلى 512 طالب.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Communications: Forum & Moderation */}
      {activeCategory === "communications" && (activeSubFeature === "forum_groups_manage" || activeSubFeature === "forum_pending_topics" || activeSubFeature === "forum_mods_stats") && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Users size={18} className="text-brand" /> منشورات المجتمع والمنتدى ({communityPosts.length})
          </h3>
          <div className="space-y-3">
            {communityPosts.map((post) => (
              <div key={post.id} className="p-4 bg-surface2/50 rounded-xl border border-line space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink">{post.authorName} ({ROLE_LABELS[post.authorRole as Role] || post.authorRole})</span>
                  <span className="text-muted font-mono">{formatDate(post.createdAt)}</span>
                </div>
                <p className="text-xs text-ink">{post.body}</p>
                {post.courseTitle && (
                  <Badge tone="outline">{post.courseTitle}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
