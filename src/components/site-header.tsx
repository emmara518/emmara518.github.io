"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { LogoWordmark } from "./logo";
import { ThemeToggle } from "./theme";
import { buttonStyles } from "./ui";
import { cn } from "@/lib/utils";
import { isAdminRole, type Role } from "@/lib/rbac";

type HeaderUser = { name: string; role: Role } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/courses", label: "الكورسات" },
  ];

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = user && isAdminRole(user.role) ? "/admin" : "/dashboard";

  // When on homepage, DrosUniverseShowcase provides the master interactive cyber navigation
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-bg/85 dark:bg-[#0F1413]/90 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="دروس ماث — الرئيسية">
          <LogoWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          {links.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors font-ui",
                  isActive
                    ? "text-ink font-bold after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                    : "text-muted hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          {user ? (
            <Link
              href={dashboardHref}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors font-ui",
                pathname.startsWith(dashboardHref)
                  ? "text-ink font-bold after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                  : "text-muted hover:text-ink",
              )}
            >
              {isAdminRole(user.role) ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
              {isAdminRole(user.role) ? "لوحة الإدارة" : "لوحة الطالب"}
            </Link>
          ) : null}
        </nav>

        {/* Action Controls & High-Fidelity Theme Switcher */}
        <div className="flex items-center gap-2.5">
          {/* High-Fidelity Document Root Theme Toggle */}
          <ThemeToggle
            className="shadow-sm"
            showLabel
          />

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold sm:inline-flex text-ink hover:border-brand/50 transition-colors"
              >
                <span className="grid size-6 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                  {user.name.trim().charAt(0)}
                </span>
                <span className="max-w-28 truncate">{user.name}</span>
              </Link>
              <button
                onClick={logout}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="grid size-9 sm:size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-danger hover:border-danger/50 cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonStyles("ghost", "sm"),
                  "hidden sm:inline-flex rounded-xl font-semibold text-ink hover:text-brand"
                )}
              >
                دخول
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonStyles("primary", "sm"),
                  "rounded-xl font-bold"
                )}
              >
                إنشاء حساب
              </Link>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="grid size-9 sm:size-10 place-items-center rounded-xl border border-line bg-surface text-ink md:hidden cursor-pointer"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open ? (
        <div className="border-t border-line bg-bg/95 dark:bg-[#0F1413]/95 px-4 pb-6 pt-3 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200 type-corner-mark">
          <nav className="grid gap-1.5" aria-label="قائمة الجوال">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2 transition-colors font-ui"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2 transition-colors font-ui"
              >
                {isAdminRole(user.role) ? "لوحة الإدارة" : "لوحة الطالب"}
              </Link>
            ) : (
              <div className="pt-2 border-t border-line flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2 transition-colors text-center border border-line"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-white"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            )}

            {/* Mobile Theme Quick Toggle Strip */}
            <div className="pt-3 mt-2 border-t border-line flex items-center justify-between px-2">
              <span className="text-xs font-ui text-muted font-medium">مظهر المنصة</span>
              <ThemeToggle variant="pill" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
