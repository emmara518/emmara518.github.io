"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "./theme";
import type { ShellNotification, ShellUser } from "./dashboard-shell";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  student: "طالب",
  parent: "ولي أمر",
  center: "سنتر",
  teacher: "مدرس",
};

function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-surface2 font-bold text-muted ring-1 ring-line",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Topbar({
  user,
  unreadCount,
  notifications,
  onToggleMobileMenu,
  identityHref = "/dashboard/account",
}: {
  user: ShellUser;
  unreadCount: number;
  notifications: ShellNotification[];
  onToggleMobileMenu?: () => void;
  /** Where the identity block links to — parent portal overrides it. */
  identityHref?: string;
}) {
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const [marking, setMarking] = useState(false);
  const [syncedCount, setSyncedCount] = useState(unreadCount);
  const bellRef = useRef<HTMLDivElement>(null);

  if (syncedCount !== unreadCount) {
    setSyncedCount(unreadCount);
    setUnread(unreadCount);
  }

  useEffect(() => {
    if (!bellOpen) return;
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
      {/* Mobile menu */}
      <button
        onClick={onToggleMobileMenu}
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2 text-muted hover:text-ink lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu size={18} />
      </button>

      {/* User identity → their portal */}
      <Link href={identityHref} className="flex min-w-0 flex-1 items-center gap-2.5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-line" />
        ) : (
          <Initials name={user.name} className="size-8 shrink-0 text-xs" />
        )}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-extrabold text-ink">{user.name}</p>
          <p className="text-[10px] font-semibold text-muted">{roleLabel}</p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative grid size-9 place-items-center rounded-xl border border-line bg-surface2 text-muted transition-colors hover:border-brand hover:text-ink"
            aria-label={`الإشعارات${unread > 0 ? ` (${unread} غير مقروءة)` : ""}`}
            aria-expanded={bellOpen}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 grid size-4 place-items-center rounded-full bg-danger font-mono text-[9px] font-bold text-white">
                {unread > 9 ? "+9" : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="text-xs font-extrabold text-ink">الإشعارات</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={marking}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline disabled:opacity-50"
                  >
                    <CheckCheck size={13} />
                    تعليم الكل كمقروء
                  </button>
                )}
              </div>
              <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs font-semibold text-muted">لا إشعارات بعد.</li>
                ) : (
                  notifications.map((n) => (
                    <li key={n.id} className={cn("px-4 py-3", !n.read && "bg-neon-lime-soft/40")}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-ink">{n.title}</p>
                        {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />}
                      </div>
                      {n.body ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted">{n.body}</p> : null}
                      <p className="mt-1 font-mono text-[10px] text-muted/70">{timeAgo(n.createdAt)}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <ThemeToggle className="size-9 rounded-xl" />

        <button
          onClick={logout}
          className="grid size-9 place-items-center rounded-xl border border-line bg-surface2 text-muted transition-colors hover:border-danger hover:text-danger"
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
        >
          <LogOut size={16} className="-scale-x-100" />
        </button>

        <Link
          href="/"
          className="hidden rounded-xl px-3 py-2 text-xs font-bold text-muted hover:text-ink sm:block"
        >
          الرئيسية العامة
        </Link>
      </div>
    </header>
  );
}
