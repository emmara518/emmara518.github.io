"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarNav } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  focus = false,
}: {
  user: ShellUser;
  unreadCount: number;
  notifications: ShellNotification[];
  children: React.ReactNode;
  /** Focus mode hides the sidebar and the mobile drawer trigger — used by
   *  the lesson room and exam room so the player gets the full viewport. */
  focus?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus on open (to the close button) and on close (back to the trigger).
  useEffect(() => {
    if (focus) return;
    if (mobileMenuOpen) {
      const t = window.setTimeout(() => closeRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    triggerRef.current?.focus();
  }, [mobileMenuOpen, focus]);

  return (
    <div className="flex min-h-screen bg-bg text-ink font-sans">
      {/* Desktop sidebar — hidden in focus mode */}
      {!focus && (
        <div className="hidden lg:block shrink-0">
          <SidebarNav user={user} className="sticky top-0 h-screen" />
        </div>
      )}

      {/* Mobile drawer backdrop */}
      {!focus && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          aria-hidden
        />
      )}

      {/* Mobile drawer (opens from the right in RTL) — kept invisible while
          closed so the translated element never extends scrollWidth. The
          `inert` attribute blocks focus and pointer interaction when the
          drawer is closed (a11y). */}
      {!focus && (
        <div
          id="mobile-nav-drawer"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
          className={`fixed inset-y-0 right-0 z-50 w-72 bg-surface shadow-2xl transition-[transform,visibility] duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? "visible translate-x-0" : "invisible translate-x-full"
          } type-corner-mark`}
        >
          <div className="relative h-full">
            <button
              ref={closeRef}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute top-4 left-4 grid size-9 place-items-center rounded-xl border border-line bg-surface2 text-muted hover:text-ink"
            >
              <X size={18} />
            </button>
            <SidebarNav user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
          onToggleMobileMenu={focus ? undefined : () => setMobileMenuOpen(true)}
          hideMobileMenu={focus}
          mobileMenuOpen={mobileMenuOpen}
          ref={triggerRef}
        />
        <main
          className={cn(
            "mx-auto w-full flex-1 space-y-6 p-4 sm:p-6 lg:p-8",
            focus ? "max-w-7xl" : "max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
