import {
  Activity,
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  LineChart,
  MessagesSquare,
  UserRound,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  exact?: boolean;
};

/** Sidebar nav for the student workspace shell. */
export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: Home, exact: true },
  { href: "/dashboard/courses", label: "كورساتي", icon: BookOpen },
  { href: "/dashboard/exams", label: "الاختبارات", icon: ClipboardList },
  { href: "/dashboard/progress", label: "تقدمي", icon: LineChart },
  { href: "/dashboard/activity", label: "نشاطي", icon: Activity },
  { href: "/dashboard/community", label: "مجتمع الطلاب", icon: MessagesSquare },
  { href: "/dashboard/wallet", label: "المحفظة", icon: Wallet },
  { href: "/dashboard/account", label: "حسابي", icon: UserRound },
  { href: "/courses", label: "استكشاف الكورسات", icon: BookOpen },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
];

/** Top-strip nav for the parent portal. */
export const PARENT_NAV: NavItem[] = [
  { href: "/parent", label: "أبنائي", icon: Home, exact: true },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
];
