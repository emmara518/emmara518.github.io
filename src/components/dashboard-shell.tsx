"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { X } from "lucide-react";

export type ShellUser = { name: string; role: string; avatarUrl: string | null };
export type ShellNotification = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  createdAt: Date | string;
};

export function DashboardShell({
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg text-ink font-sans">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <SidebarNav user={user} className="sticky top-0 h-screen" />
      </div>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          aria-hidden
        />
      )}

      {/* Mobile drawer (opens from the right in RTL) — kept invisible while
          closed so the translated element never extends scrollWidth. */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-surface shadow-2xl transition-[transform,visibility] duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="إغلاق القائمة"
            className="absolute top-4 left-4 grid size-9 place-items-center rounded-xl border border-line bg-surface2 text-muted hover:text-ink"
          >
            <X size={18} />
          </button>
          <SidebarNav user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
