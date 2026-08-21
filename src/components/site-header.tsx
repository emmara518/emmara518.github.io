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

  // When on homepage, DrosUniverseShowcase provides its own specialized cyber navigation
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="دروس ماث — الرئيسية">
          <LogoWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                pathname === l.href ? "text-brand" : "text-muted hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link
              href={dashboardHref}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith(dashboardHref) ? "text-brand" : "text-muted hover:text-ink",
              )}
            >
              {isAdminRole(user.role) ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
              {isAdminRole(user.role) ? "لوحة الإدارة" : "لوحة الطالب"}
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold sm:inline-flex"
              >
                <span className="grid size-6 place-items-center rounded-lg bg-brand text-[11px] text-white">
                  {user.name.trim().charAt(0)}
                </span>
                <span className="max-w-28 truncate">{user.name}</span>
              </Link>
              <button
                onClick={logout}
                aria-label="تسجيل الخروج"
                className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-danger hover:border-danger/50"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonStyles("ghost", "sm"), "hidden sm:inline-flex")}>
                دخول
              </Link>
              <Link href="/register" className={buttonStyles("primary", "sm")}>
                إنشاء حساب
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-bg/95 px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
          <nav className="grid gap-1" aria-label="قائمة الجوال">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-brand hover:bg-surface2"
              >
                {isAdminRole(user.role) ? "لوحة الإدارة" : "لوحة الطالب"}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface2"
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
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
