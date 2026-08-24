"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  BookOpen,
  ClipboardList,
  Users,
  Trophy,
  Library,
  Calendar,
  Bell,
  Pi,
  Settings,
  Flame,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";
import { LogoWordmark } from "./logo";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: { name: string; role: string; avatarUrl?: string } | null;
  className?: string;
  onCloseMobile?: () => void;
}

export function SidebarNav({ user, className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "الرئيسية", english: "Home", icon: Home },
    { href: "/admin", label: "لوحة الإدارة", english: "Admin Panel", icon: ShieldCheck, badge: "إدارة" },
    { href: "/courses", label: "المقررات", english: "Courses", icon: BookOpen },
    { href: "/dashboard/exams", label: "الاختبارات", english: "Quizzes", icon: ClipboardList },
    { href: "/dashboard/community", label: "المجتمع", english: "Community", icon: Users },
    { href: "/dashboard/achievements", label: "إنجازاتي", english: "Achievements", icon: Trophy, badge: "جديد" },
    { href: "/dashboard/library", label: "المكتبة", english: "Library", icon: Library },
    { href: "/dashboard/schedule", label: "الجدول", english: "Schedule", icon: Calendar },
    { href: "/dashboard/notifications", label: "الإشعارات", english: "Notifications", icon: Bell, count: 3 },
    { href: "/dashboard/formulas", label: "القوانين", english: "Formulas", icon: Pi },
    { href: "/dashboard/settings", label: "الإعدادات", english: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col justify-between border-l border-line/80 bg-surface/90 backdrop-blur-xl p-5 select-none transition-all duration-300",
        className
      )}
    >
      <div className="space-y-6">
        {/* Logo Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-line/60">
          <Link href="/" className="group" onClick={onCloseMobile}>
            <LogoWordmark />
          </Link>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1.5" aria-label="شريط التنقل الرئيسي">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-neon-lime text-slate-950 shadow-md shadow-lime-500/20 font-extrabold"
                    : "text-muted hover:bg-surface2 hover:text-ink"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-slate-950 text-neon-lime"
                        : "bg-surface2/80 text-muted group-hover:text-neon-lime group-hover:bg-slate-900"
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <div className="flex flex-col text-start">
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-mono leading-none tracking-wider",
                        isActive ? "text-slate-900/70" : "text-muted/60"
                      )}
                    >
                      {item.english}
                    </span>
                  </div>
                </div>

                {item.count ? (
                  <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[11px] font-mono font-bold text-white shadow-sm">
                    {item.count}
                  </span>
                ) : null}

                {item.badge ? (
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-400/30">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo & Profile Section */}
      <div className="space-y-4 pt-4 border-t border-line/60">
        {/* Trophy Arena Card (Exact Match to Mockup 1 & 2) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-4 text-white shadow-lg border border-emerald-500/30 group">
          <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Trophy size={18} />
              </span>
              <span className="font-bold text-xs text-emerald-400 tracking-wider font-mono">
                THE ARENA
              </span>
            </div>
            
            <p className="text-xs font-bold leading-relaxed text-slate-200">
              جاهز لتحدي نفسك؟ ادخل ساحة الرياضيات الآن
            </p>

            <Link
              href="/dashboard/arena"
              onClick={onCloseMobile}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neon-lime px-3 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-lime-400 transition-all duration-200"
            >
              <span>ابدأ التحدي الان</span>
              <ChevronLeft size={14} />
            </Link>
          </div>
        </div>

        {/* User Card at Bottom */}
        {user ? (
          <div className="flex items-center justify-between rounded-2xl bg-surface2/60 p-3 border border-line/50">
            <div className="flex items-center gap-3 truncate">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-neon-lime/40">
                <Image
                  src="/images/assets/teacher.webp"
                  alt={user.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-extrabold truncate text-ink">{user.name}</p>
                <p className="text-[10px] font-bold text-neon-lime flex items-center gap-1">
                  <Flame size={12} />
                  طالب مميز
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
