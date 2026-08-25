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
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Primary Functional Hubs (shared by console, sidebar, topbar & palette) ── */
export type CategoryId =
  | "overview"
  | "academic"
  | "exams"
  | "users"
  | "billing_codes"
  | "communications";

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
    subFeatures: [
      { id: "exams_table", label: "جدول الامتحانات", icon: ClipboardList },
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
    subFeatures: [
      { id: "create_codes", label: "إنشاء وتوليد أكواد", icon: Sparkles },
      { id: "codes_table", label: "جدول الأكواد النشطة", icon: KeyRound },
      { id: "payment_requests", label: "طلبات شحن الرصيد", icon: Wallet },
      { id: "manual_payment", label: "الدفع اليدوي (سنتر/كاش)", icon: Banknote },
      { id: "orders_table", label: "جدول الطلبات", icon: ShoppingCart },
      { id: "subscriptions_table", label: "جداول الاشتراكات", icon: CalendarClock },
      { id: "invoices_table", label: "جداول الفواتير", icon: Receipt },
    ],
  },
  {
    id: "users",
    label: "المستخدمون والطلاب",
    icon: Users,
    description: "إدارة الطلاب، تعيين المسؤولين، وتعديل المحافظ",
    subFeatures: [
      { id: "users_table", label: "جدول المستخدمين", icon: Users },
      { id: "add_student", label: "إضافة طالب جديد", icon: UserPlus },
      { id: "manage_admin", label: "إدارة المسؤولين والمشرفين", icon: ShieldCheck },
      { id: "users_stats", label: "إحصائيات الطلاب", icon: BarChart3 },
    ],
  },
  {
    id: "communications",
    label: "التنبيهات والمجتمع",
    icon: MessageSquare,
    description: "تنبيهات جماعية للطلاب، وإشراف ومتابعة منشورات المجتمع",
    subFeatures: [
      { id: "sms_messages", label: "إرسال تنبيه جماعي", icon: Send },
      { id: "forum_pending_topics", label: "منشورات ومجتمع الطلاب", icon: MessagesSquare },
    ],
  },
];

export function findCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
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
