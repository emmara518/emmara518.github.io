"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Home, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme";
import type { ShellNotification, ShellUser } from "./dashboard-shell";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  student: "طالب",
  parent: "ولي أمر",
  center: "سنتر",
  teacher: "مدرس",
};

type TopbarProps = {
  user: ShellUser;
  unreadCount: number;
  notifications: ShellNotification[];
  onToggleMobileMenu?: () => void;
  /** Where the identity block links to — parent portal overrides it. */
  identityHref?: string;
  /** Hides the hamburger trigger — used by focus mode (lesson/exam room). */
  hideMobileMenu?: boolean;
  /** Open state of the mobile drawer — drives the hamburger's aria-expanded. */
  mobileMenuOpen?: boolean;
};

export const Topbar = forwardRef<HTMLButtonElement, TopbarProps>(function Topbar(
  {
    user,
    unreadCount,
    notifications,
    onToggleMobileMenu,
    identityHref = "/dashboard/account",
    hideMobileMenu = false,
    mobileMenuOpen = false,
  },
  hamburgerRef,
) {
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const [marking, setMarking] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Sync prop changes into local state — avoid setting state during render.
  useEffect(() => {
    setUnread(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!bellOpen) return;
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBellOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/v1/me/notifications", { method: "PATCH" });
      if (res.ok) {
        setUnread(0);
        router.refresh();
      }
    } finally {
      setMarking(false);
    }
  }

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const roleLabel = ROLE_LABELS[user.role] ?? "طالب";
  const showViewAll = notifications.length > 0;

  return (
    <header className="sticky top-0 z-40 flex h-13 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-4">
      {/* Mobile menu — always present when not in focus mode, but visually
          becomes the X toggle when the drawer is open. */}
      {!hideMobileMenu && (
        <button
          ref={hamburgerRef}
          onClick={onToggleMobileMenu}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface2 text-muted hover:text-ink lg:hidden"
          aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* User identity + role — hidden when the drawer is open on mobile
          so the topbar's avatar/name don't visually collide with the
          drawer's brand area. The drawer carries the user's identity
          separately (inside SidebarNav). */}
      <Link
        href={identityHref}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5",
          mobileMenuOpen && "lg:flex hidden",
        )}
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-extrabold text-ink sm:text-base">{user.name}</p>
          <p className="hidden text-xs font-semibold uppercase tracking-tag text-muted sm:block">{roleLabel}</p>
        </div>
      </Link>

      {/* Actions — hidden on mobile when the drawer is open, so the topbar
          doesn't cover the drawer's close button / brand area. On lg+ the
          actions are always visible. */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5",
          mobileMenuOpen && "lg:flex hidden",
        )}
      >
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative grid size-11 place-items-center rounded-xl border border-line bg-surface2 text-muted transition-colors hover:border-brand hover:text-ink"
            aria-label={`الإشعارات${unread > 0 ? ` (${unread} غير مقروءة)` : ""}`}
            aria-expanded={bellOpen}
            aria-haspopup="dialog"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 grid size-4 place-items-center rounded-full bg-danger font-mono text-xs font-bold text-white">
                {unread > 9 ? "+9" : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              role="dialog"
              aria-label="قائمة الإشعارات"
              className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-lift type-corner-mark"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="type-card-heading">الإشعارات</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={marking}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-brand hover:bg-surface2 disabled:opacity-50"
                  >
                    <CheckCheck size={13} />
                    تعليم الكل كمقروء
                  </button>
                )}
              </div>
              <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm font-semibold text-muted">لا إشعارات بعد.</li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn("px-4 py-3 transition-colors hover:bg-surface2/60", !n.read && "bg-neon-lime-soft/40")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-ink">{n.title}</p>
                        {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-label="غير مقروء" />}
                      </div>
                      {n.body ? <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted">{n.body}</p> : null}
                      <p className="mt-1 font-mono text-xs text-muted/70">{timeAgo(n.createdAt)}</p>
                    </li>
                  ))
                )}
              </ul>
              {showViewAll ? (
                <div className="border-t border-line bg-surface2/40 px-4 py-2.5 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setBellOpen(false)}
                    className="inline-block rounded-md px-2 py-1 text-xs font-bold text-brand hover:bg-surface2"
                  >
                    عرض الكل ←
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <ThemeToggle className="size-11 rounded-xl" />

        <button
          onClick={logout}
          className="grid size-11 place-items-center rounded-xl border border-line bg-surface2 text-muted transition-colors hover:border-danger hover:text-danger"
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
        >
          <LogOut size={16} className="-scale-x-100" />
        </button>

        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted/80 hover:text-ink sm:inline-flex"
        >
          <span className="overline-glyph">▸</span>
          <Home size={14} />
          الرئيسية العامة
        </Link>
      </div>
    </header>
  );
});
