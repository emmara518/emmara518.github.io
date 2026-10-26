import {
  Banknote,
  BarChart3,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Database,
  FilePlus2,
  Film,
  Gauge,
  GraduationCap,
  HelpCircle,
  History,
  Home,
  KeyRound,
  Layers,
  ListPlus,
  ListVideo,
  Link2,
  MessageSquare,
  MessagesSquare,
  MonitorPlay,
  Notebook,
  PieChart,
  Receipt,
  Send,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  UserPlus,
  UserSearch,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GranularPermission } from "@/lib/rbac";

/* ── Primary Functional Hubs (shared by console, sidebar, topbar & palette) ── */
export type CategoryId =
  | "overview"
  | "academic"
  | "exams"
  | "users"
  | "billing_codes"
  | "communications"
  | "advanced_search"
  | "assistants";

export interface SubFeatureDef {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optional granular gate for this sub-feature. */
  requires?: GranularPermission[];
  /** When true, only the Super Admin sees this sub-feature. */
  superAdminOnly?: boolean;
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  subFeatures: SubFeatureDef[];
  /** Optional granular gate. A category is visible if `requires` is empty
   *  or the actor holds at least one of these permissions. */
  requires?: GranularPermission[];
  /** When true, only the Super Admin (role === "admin") sees the category. */
  superAdminOnly?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "overview",
    label: "الرئيسية والتقارير",
    icon: Home,
    description: "إحصائيات المنصة، آخر التحديثات، وتقارير النشاط العام",
    superAdminOnly: true,
    subFeatures: [
      { id: "home", label: "نظرة عامة", icon: Gauge },
      { id: "statistics", label: "الإحصائيات الشاملة", icon: PieChart },
      { id: "updates", label: "سجل العمليات والتدقيق", icon: History },
    ],
  },
  {
    id: "academic",
    label: "المناهج والمقررات",
    icon: BookOpen,
    description: "الكورسات، الفيديوهات، المذكرات، والمراحل الدراسية",
    requires: ["courses.view", "content.view"],
    subFeatures: [
      { id: "courses_table", label: "جدول الكورسات", icon: ListVideo },
      { id: "courses_manage", label: "إضافة مقرر جديد", icon: FilePlus2 },
      { id: "videos_manage", label: "الفيديوهات والمحاضرات", icon: MonitorPlay },
      { id: "booklets_manage", label: "المذكرات والملازم", icon: Notebook },
      { id: "sections_manage", label: "المراحل الدراسية", icon: Layers },
    ],
  },
  {
    id: "exams",
    label: "الامتحانات وبنك الأسئلة",
    icon: GraduationCap,
    description: "إنشاء الاختبارات، بنوك الأسئلة، واستيراد وتصحيح النتائج",
    requires: ["exams.view"],
    subFeatures: [
      { id: "exams_table", label: "جدول الامتحانات", icon: ClipboardList },
      { id: "exam_groups_table", label: "مجموعات الامتحانات", icon: Layers },
      { id: "exams_manage", label: "إنشاء امتحان جديد", icon: FilePlus2 },
      { id: "questions_table", label: "بنك الأسئلة", icon: Database },
      { id: "questions_manage", label: "إضافة سؤال فردي", icon: HelpCircle },
      { id: "bulk_questions_add", label: "إضافة أكثر من سؤال", icon: ListPlus },
      { id: "exam_results_table", label: "نتائج الامتحانات", icon: Trophy , requires: ["students.view"] },
    ],
  },
  {
    id: "billing_codes",
    label: "الأكواد والشحن والمالية",
    icon: KeyRound,
    description: "توليد أكواد التفعيل، الدفع اليدوي، الفواتير، والاشتراكات",
    superAdminOnly: true,
    subFeatures: [
      { id: "create_codes", label: "إنشاء وتوليد أكواد", icon: Sparkles },
      { id: "codes_table", label: "جدول الأكواد النشطة", icon: KeyRound },
      { id: "payment_requests", label: "طلبات شحن الرصيد", icon: Wallet },
      { id: "manual_payment", label: "الدفع اليدوي (سنتر/كاش)", icon: Banknote },
      { id: "orders_table", label: "جدول الطلبات", icon: ShoppingCart },
      { id: "subscriptions_table", label: "جداول الاشتراكات", icon: CalendarClock },
      { id: "invoices_table", label: "جداول الفواتير", icon: Receipt },
      { id: "cancel_subscription", label: "إلغاء اشتراك", icon: Banknote },
    ],
  },
  {
    id: "users",
    label: "المستخدمون والطلاب",
    icon: Users,
    description: "إدارة الطلاب، تعيين المسؤولين، وتعديل المحافظ",
    requires: ["students.view"],
    subFeatures: [
      { id: "users_table", label: "جدول المستخدمين", icon: Users },
      { id: "parent_links", label: "ربط ولي أمر بطالب", icon: Link2, superAdminOnly: true },
      { id: "add_student", label: "إضافة طالب جديد", icon: UserPlus , superAdminOnly: true },
      { id: "manage_admin", label: "إدارة المسؤولين والمشرفين", icon: ShieldCheck , superAdminOnly: true },
      { id: "users_stats", label: "إحصائيات الطلاب", icon: BarChart3 },
      { id: "login_sessions", label: "مراجعة جلسات الدخول", icon: History , superAdminOnly: true },
    ],
  },
  {
    id: "communications",
    label: "التنبيهات والمجتمع",
    icon: MessageSquare,
    description: "تنبيهات جماعية للطلاب، وإشراف ومتابعة منشورات المجتمع",
    requires: ["community.manage", "notifications.manage"],
    subFeatures: [
      { id: "sms_messages", label: "إرسال تنبيه جماعي", icon: Send, requires: ["notifications.manage"] },
      { id: "community_groups", label: "مجموعات المجتمع", icon: Users, requires: ["community.manage"] },
      { id: "forum_pending_topics", label: "منشورات ومجتمع الطلاب", icon: MessagesSquare, requires: ["community.manage"] },
      { id: "moderator_stats", label: "إحصائيات المشرفين", icon: BarChart3, requires: ["community.manage"] },
    ],
  },
  {
    id: "advanced_search",
    label: "البحث المتقدم والفلاتر",
    icon: SlidersHorizontal,
    description: "بحث دقيق في الطلاب والمشتركين حسب الكورس والحالة وتاريخ التسجيل وأكثر",
    requires: ["students.view"],
    subFeatures: [
      { id: "users_advanced", label: "بحث الطلاب المتقدم", icon: UserSearch },
    ],
  },
  {
    id: "assistants",
    label: "المساعدون والصلاحيات",
    icon: ShieldCheck,
    description: "إنشاء حسابات المساعدين وتحديد صلاحياتهم بدقة (للمدير العام فقط).",
    requires: ["users.view"],
    superAdminOnly: true,
    subFeatures: [
      { id: "assistants_manage", label: "إدارة المساعدين والصلاحيات", icon: UserPlus },
    ],
  },
];

export function findCategory(id: string | null | undefined): CategoryDef | undefined {
  if (!id) return undefined;
  return CATEGORIES.find((c) => c.id === id);
}

/** Returns the categories an actor is allowed to see based on granular RBAC.
 *  Super Admin sees all; everyone else sees only categories they hold a
 *  required permission for. An empty permission set yields no categories. */
export function visibleCategories(
  actorPermissions: readonly string[] | undefined,
  actorRole?: string,
): CategoryDef[] {
  if (actorRole === "admin") return CATEGORIES;
  const perms = actorPermissions ?? [];
  return CATEGORIES.filter((cat) => {
    if (cat.superAdminOnly) return false;
    if (!cat.requires || cat.requires.length === 0) return true;
    return cat.requires.some((p) => perms.includes(p));
  });
}

/** Returns the sub-features an actor may see inside a category. */
export function visibleSubFeatures(
  category: CategoryDef,
  actorPermissions: readonly string[] | undefined,
  actorRole?: string,
): SubFeatureDef[] {
  if (actorRole === "admin") return category.subFeatures;
  const perms = actorPermissions ?? [];
  return category.subFeatures.filter((sub) => {
    if (sub.superAdminOnly) return false;
    return !sub.requires || sub.requires.some((p) => perms.includes(p));
  });
}

/** Locates a sub-feature anywhere in the tree, returning its owning category. */
export function findSubFeature(
  id: string | null | undefined
): { category: CategoryDef; sub: SubFeatureDef } | undefined {
  if (!id) return undefined;
  for (const category of CATEGORIES) {
    const sub = category.subFeatures.find((s) => s.id === id);
    if (sub) return { category, sub };
  }
  return undefined;
}
