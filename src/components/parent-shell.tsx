"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Topbar } from "./topbar";
import { PARENT_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { ShellNotification, ShellUser } from "./dashboard-shell";

/** Guardian portal shell — same topbar, guardian-scoped navigation. */
export function ParentShell({
  user,
  unreadCount,
  notifications,
  children,
}: {
  user: ShellUser;
  unreadCount: number;
  notifications: ShellNotification[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink font-sans">
      <Topbar user={user} unreadCount={unreadCount} notifications={notifications} identityHref="/parent" />

      {/* Guardian nav strip */}
      <div className="border-b border-line bg-surface">
        <nav aria-label="تنقل بوابة ولي الأمر" className="mx-auto flex w-full max-w-6xl items-center gap-1.5 px-4 sm:px-6">
          {PARENT_NAV.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-3 text-sm font-bold transition-colors",
                  isActive ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                <Icon size={16} strokeWidth={isActive ? 2.4 : 2} />
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />
                )}
              </Link>
            );
          })}
          <div className="ms-auto" />
          <button
            type="button"
            onClick={logout}
            aria-label="تسجيل الخروج"
            className="flex items-center gap-2 px-3.5 py-3 text-sm font-bold text-muted transition-colors hover:text-danger"
          >
            <LogOut size={14} className="-scale-x-100" />
            تسجيل الخروج
          </button>
        </nav>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
