"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, Flame, Trophy, Calendar, Menu, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./theme";
import { isAdminRole, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user?: { name: string; role: Role } | null;
  onToggleMobileMenu?: () => void;
}

export function Topbar({ user, onToggleMobileMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-line/80 bg-surface/80 px-4 sm:px-8 backdrop-blur-xl transition-all">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className="grid size-11 place-items-center rounded-2xl border border-line bg-surface2 text-ink lg:hidden hover:border-brand transition-colors"
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full">
          <Search className="absolute inset-y-0 right-4 my-auto size-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث عن درس، كورس، أو مفهوم رياضي..."
            className="w-full rounded-2xl border border-line/80 bg-surface2/60 pr-11 pl-4 py-2.5 text-xs font-semibold text-ink placeholder:text-muted/70 focus:border-neon-lime focus:bg-surface focus:outline-none focus:ring-2 focus:ring-neon-lime/20 transition-all"
          />
        </div>
      </div>

      {/* Stats & Gamification Badges (Exact match to Mockup 1 & 2) */}
      <div className="hidden xl:flex items-center gap-4">
        {/* Golden Level Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 glow-gold">
            <Flame size={18} />
          </span>
          <div className="text-start">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted">مستواك الحالي</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[10px] font-black text-amber-600 dark:text-amber-400">
                المستوى الذهبي
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface3">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: "87%" }} />
              </div>
              <span className="font-mono text-[11px] font-black text-amber-500">87%</span>
            </div>
          </div>
        </div>

        {/* XP Points Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 glow-lime">
            <Trophy size={18} />
          </span>
          <div className="text-start">
            <span className="block text-[11px] font-bold text-muted">إجمالي النقاط</span>
            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
              12,540 <span className="text-[10px] font-sans font-bold text-muted">XP</span>
            </span>
          </div>
        </div>

        {/* Learning Streak Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 glow-cyan">
            <Calendar size={18} />
          </span>
          <div className="text-start">
            <span className="block text-[11px] font-bold text-muted">أيام التعلم المتتالية</span>
            <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
              18 <span className="text-[10px] font-sans font-bold text-muted">يوم </span>
            </span>
          </div>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative grid size-11 place-items-center rounded-2xl border border-line bg-surface2/80 text-muted transition-colors hover:text-ink hover:border-neon-lime"
          aria-label="الإشعارات"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 grid size-4 place-items-center rounded-full bg-rose-500 font-mono text-[9px] font-bold text-white ring-2 ring-surface">
            3
          </span>
        </button>

        {/* Theme Switcher */}
        <ThemeToggle className="size-11 rounded-2xl border border-line bg-surface2/80" />

        {/* User Account Pill */}
        {user ? (
          <div className="flex items-center gap-3 pl-1">
            <Link
              href={isAdminRole(user.role) ? "/admin" : "/dashboard"}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-1.5 transition-all hover:border-neon-lime hover:shadow-md"
            >
              <div className="relative size-8 overflow-hidden rounded-xl bg-slate-900 border border-neon-lime/40">
                <Image
                  src="/images/teacher.webp"
                  alt={user.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="hidden sm:block text-start">
                <span className="block text-xs font-black truncate max-w-28 text-ink">{user.name}</span>
                <span className="block text-[10px] font-bold text-neon-lime">
                  {isAdminRole(user.role) ? "مسؤول المنصة" : "طالب ممتاز"}
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-xs font-bold text-ink hover:bg-surface2 transition-colors"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-neon-lime px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-lime-400 transition-colors"
            >
              إنشاء حساب
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
