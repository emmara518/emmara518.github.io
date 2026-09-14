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
import { isAuthRoute } from "@/lib/chrome-routes";

type HeaderUser = { name: string; role: Role } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // On auth routes the shared header must never expose authenticated identity
  // (user chip / dashboard link / logout) — even when a valid session cookie
  // exists, e.g. after a redirected visit to /login. Render it anonymously.
  const viewer = isAuthRoute(pathname) ? null : user;

  const links = [
    { href: "/", label: "الرئيسية" },
    { href: "/courses", label: "الكورسات" },
  ];

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = viewer && isAdminRole(viewer.role) ? "/admin" : "/dashboard";

  // When on homepage, DrosUniverseShowcase provides the master interactive cyber navigation
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-bg/85 dark:bg-[#0F1413]/90 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Brand — compact mark below sm so the full wordmark + actions
            fit a 375px viewport; full wordmark restored at sm+ (desktop
            pixel-identical). */}
        <Link href="/" className="min-w-0 shrink-0" aria-label="دروس ماث — الرئيسية">
          <span className="sm:hidden">
            <LogoWordmark compact />
          </span>
          <span className="hidden sm:block">
            <LogoWordmark />
          </span>
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
          {viewer ? (
            <Link
              href={dashboardHref}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors font-ui",
                pathname.startsWith(dashboardHref)
                  ? "text-ink font-bold after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                  : "text-muted hover:text-ink",
              )}
            >
              {isAdminRole(viewer.role) ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
              {isAdminRole(viewer.role) ? "لوحة الإدارة" : "لوحة الطالب"}
            </Link>
          ) : null}
        </nav>

        {/* Action Controls & High-Fidelity Theme Switcher */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* High-Fidelity Document Root Theme Toggle */}
          <ThemeToggle
            className="shrink-0 shadow-sm"
            showLabel
          />

          {viewer ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold sm:inline-flex text-ink hover:border-brand/50 transition-colors"
              >
                <span className="grid size-6 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                  {viewer.name.trim().charAt(0)}
                </span>
                <span className="max-w-28 truncate">{viewer.name}</span>
              </Link>
              <button
                onClick={logout}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-danger hover:border-danger/50 cursor-pointer sm:size-10"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              {/* NOTE: ghost styling is inlined (not buttonStyles) because cn()
                  is clsx-only (no tailwind-merge): buttonStyles' base
                  `inline-flex` would survive alongside `hidden` and beat it
                  in CSS source order, leaking this link onto mobile. */}
              <Link
                href="/login"
                className="hidden h-9 shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-transparent px-3.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-surface2 hover:text-brand sm:inline-flex"
              >
                دخول
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonStyles("primary", "sm"),
                  "shrink-0 whitespace-nowrap rounded-xl font-bold"
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
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink md:hidden sm:size-10 cursor-pointer"
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
            {viewer ? (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2 transition-colors font-ui"
              >
                {isAdminRole(viewer.role) ? "لوحة الإدارة" : "لوحة الطالب"}
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
