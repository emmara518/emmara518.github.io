"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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

export function SidebarNav({ user, className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    onCloseMobile?.();
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-e border-line bg-surface p-4 select-none",
        className,
      )}
    >
      {/* Brand */}
      <div className="border-b border-line px-2 pb-4 pt-1">
        <Link href="/" onClick={onCloseMobile} aria-label="دروس ماث">
          <LogoWordmark />
        </Link>
        {/* Light mentor identity */}
        <div className="mt-3 flex items-center gap-2">
          <Avatar name="محمد سعيد" src="/images/assets/teacher.webp" size="xs" />
          <span className="text-[11px] font-bold text-muted">مع مستر محمد سعيد</span>
        </div>
      </div>

      {/* Navigation — existing routes only */}
      <nav className="mt-4 space-y-1" aria-label="تنقل مساحة الطالب">
        {STUDENT_NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                isActive
                  ? "bg-neon-lime-soft text-brand"
                  : "text-muted hover:bg-surface2 hover:text-ink",
              )}
            >
              {isActive && (
                <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-brand" aria-hidden />
              )}
              <Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Student identity + logout */}
      <div className="mt-auto space-y-2 border-t border-line pt-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface2/60 px-3 py-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-extrabold text-ink">{user.name}</p>
              <p className="text-[10px] font-semibold text-muted">حسابي</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-xs font-bold text-muted transition-colors hover:border-danger hover:text-danger"
        >
          <LogOut size={14} className="-scale-x-100" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
