"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LogoWordmark } from "./logo";
import { STUDENT_NAV } from "@/lib/nav";
import { Avatar } from "@/components/avatar";
import type { ShellUser } from "./dashboard-shell";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: ShellUser | null;
  className?: string;
  onCloseMobile?: () => void;
}

const COLLAPSE_KEY = "student-sidebar-collapsed";

export function SidebarNav({ user, className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed preference after mount (avoids SSR mismatch).
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    onCloseMobile?.();
    router.push("/");
    router.refresh();
  }

  const isRail = collapsed;

  return (
    <aside
      data-collapsed={isRail ? "true" : "false"}
      className={cn(
        "flex h-full flex-col border-e border-line bg-surface p-4 select-none transition-[width] duration-300 ease-in-out",
        isRail ? "w-[64px]" : "w-64",
        className,
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-b border-line pb-4 pt-1 type-corner-mark",
          isRail ? "flex-col px-0" : "px-2",
        )}
      >
        <div className="flex w-full min-w-0 flex-col">
          <Link
            href="/"
            onClick={onCloseMobile}
            aria-label="دروس ماث"
            className={cn(isRail ? "self-center" : "")}
          >
            <LogoWordmark />
          </Link>
          {!isRail ? (
            <div className="type-flourish mt-2" aria-hidden />
          ) : null}
        </div>
        {/* Collapse toggle (desktop) — keeps a clean row below the wordmark
            in expanded mode and centers in collapsed mode. The mentor
            identity row that used to sit here was removed because it
            overlapped the wordmark + flourish when the sidebar folded. */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isRail ? "توسيع القائمة الجانبية" : "تصغير القائمة الجانبية"}
          title={isRail ? "توسيع القائمة" : "تصغير القائمة"}
          className="hidden size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-ink lg:grid"
        >
          {isRail ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Navigation — existing routes only. Overflows internally when the
          drawer is shorter than the nav list (small phones, landscape
          orientation, accessibility text-zoom). */}
      <nav
        className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto"
        aria-label="تنقل مساحة الطالب"
      >
        {STUDENT_NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={isActive ? "page" : undefined}
              title={isRail ? item.label : undefined}
              className={cn(
                "relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                isActive
                  ? "bg-neon-lime-soft text-brand"
                  : "text-muted hover:bg-surface2 hover:text-ink active:bg-surface2/80",
                isRail && "justify-center",
              )}
            >
              {isActive && (
                <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-brand" aria-hidden />
              )}
              <Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
              {!isRail ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {/* Student identity + logout */}
      <div className="mt-auto shrink-0 space-y-2 border-t border-line pt-4">
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-surface2/60 px-3 py-2.5 type-corner-mark",
              isRail && "justify-center px-2",
            )}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            {!isRail ? (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-base font-extrabold text-ink">{user.name}</p>
                <p className="text-xs font-semibold text-muted">الإعدادات</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          onClick={logout}
          aria-label="تسجيل الخروج"
          className={cn(
            "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-extrabold text-muted transition-colors hover:border-danger hover:text-danger",
          )}
        >
          <LogOut size={14} className="-scale-x-100" />
          {!isRail ? "تسجيل الخروج" : null}
        </button>
      </div>
    </aside>
  );
}
