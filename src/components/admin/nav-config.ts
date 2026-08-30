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
import type { Permission } from "@/lib/rbac";

/* ── Primary Functional Hubs (shared by console, sidebar, topbar & palette) ── */
export type CategoryId =
  | "overview"
  | "academic"
  | "exams"
  | "users"
  | "billing_codes"
  | "communications"
  | "advanced_search";

export interface SubFeatureDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  subFeatures: SubFeatureDef[];
  /** Optional RBAC gate. A category is visible if `requires` is empty
   *  or the actor's role grants at least one of these permissions. */
  requires?: Permission[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "overview",
    label: "الرئيسية والتقارير",
    icon: Home,
    description: "إحصائيات المنصة، آخر التحديثات، وتقارير النشاط العام",
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
    requires: ["admin:write"],
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
    requires: ["admin:write"],
    subFeatures: [
      { id: "exams_table", label: "جدول الامتحانات", icon: ClipboardList },
      { id: "exam_groups_table", label: "مجموعات الامتحانات", icon: Layers },
      { id: "exams_manage", label: "إنشاء امتحان جديد", icon: FilePlus2 },
      { id: "questions_table", label: "بنك الأسئلة", icon: Database },
      { id: "questions_manage", label: "إضافة سؤال فردي", icon: HelpCircle },
      { id: "bulk_questions_add", label: "إضافة أكثر من سؤال", icon: ListPlus },
      { id: "exam_results_table", label: "نتائج الامتحانات", icon: Trophy },
    ],
  },
  {
    id: "billing_codes",
    label: "الأكواد والشحن والمالية",
    icon: KeyRound,
    description: "توليد أكواد التفعيل، الدفع اليدوي، الفواتير، والاشتراكات",
    requires: ["admin:write"],
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
    requires: ["admin:read"],
    subFeatures: [
      { id: "users_table", label: "جدول المستخدمين", icon: Users },
      { id: "add_student", label: "إضافة طالب جديد", icon: UserPlus },
      { id: "manage_admin", label: "إدارة المسؤولين والمشرفين", icon: ShieldCheck },
      { id: "users_stats", label: "إحصائيات الطلاب", icon: BarChart3 },
      { id: "login_sessions", label: "مراجعة جلسات الدخول", icon: History },
    ],
  },
  {
    id: "communications",
    label: "التنبيهات والمجتمع",
    icon: MessageSquare,
    description: "تنبيهات جماعية للطلاب، وإشراف ومتابعة منشورات المجتمع",
    requires: ["admin:write"],
    subFeatures: [
      { id: "sms_messages", label: "إرسال تنبيه جماعي", icon: Send },
      { id: "community_groups", label: "مجموعات المجتمع", icon: Users },
      { id: "forum_pending_topics", label: "منشورات ومجتمع الطلاب", icon: MessagesSquare },
      { id: "moderator_stats", label: "إحصائيات المشرفين", icon: BarChart3 },
    ],
  },
  {
    id: "advanced_search",
    label: "البحث المتقدم والفلاتر",
    icon: SlidersHorizontal,
    description: "بحث دقيق في الطلاب والمشتركين حسب الكورس والحالة وتاريخ التسجيل وأكثر",
    requires: ["admin:read"],
    subFeatures: [
      { id: "users_advanced", label: "بحث الطلاب المتقدم", icon: UserSearch },
    ],
  },
];

export function findCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Returns the categories an actor is allowed to see based on RBAC.
 *  If the actor has no permissions (e.g. dev preview fallback) the
 *  full set is returned so the dev path keeps working. */
export function visibleCategories(
  actorPermissions: readonly string[] | undefined
): CategoryDef[] {
  if (!actorPermissions || actorPermissions.length === 0) return CATEGORIES;
  return CATEGORIES.filter((cat) => {
    if (!cat.requires || cat.requires.length === 0) return true;
    return cat.requires.some((p) => actorPermissions.includes(p));
  });
}

/** Locates a sub-feature anywhere in the tree, returning its owning category. */
export function findSubFeature(
  id: string
): { category: CategoryDef; sub: SubFeatureDef } | undefined {
  for (const category of CATEGORIES) {
    const sub = category.subFeatures.find((s) => s.id === id);
    if (sub) return { category, sub };
  }
  return undefined;
}
