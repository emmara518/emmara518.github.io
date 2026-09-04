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

      {/* Main column — sits next to the (desktop) sidebar in the flex flow */}
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
            "mx-auto w-full flex-1 space-y-6 p-4 sm:p-5 lg:p-6",
            focus ? "max-w-7xl" : "max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile drawer — fixed-positioned, so it does not participate in the
          flex flow (no white space on the right when closed). When closed
          the drawer is translated off-screen and marked inert to block
          interaction and screen-reader exposure. We deliberately avoid
          `visibility: hidden` because it can interact badly with the
          fixed-position + flex parent combo on some browsers.

          Z-index layering:
          - Backdrop: z-40 (above topbar so the scrim is always visible)
          - Drawer:    z-50 (above backdrop so the close button + nav
                          are always tappable, including the X in the
                          top-right corner of the drawer).
          The topbar's own X (hamburger-as-close toggle) is at z-40 and
          intentionally lives behind the drawer's right edge when the
          drawer is open, so the two close affordances do not visually
          collide. */}
      {!focus && mobileMenuOpen ? (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden
        />
      ) : null}
      {!focus ? (
        <div
          id="mobile-nav-drawer"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
          className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-surface shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-end px-3 pt-3">
            <button
              ref={closeRef}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="إغلاق القائمة"
              className="grid size-11 place-items-center rounded-xl border border-line bg-surface2 text-muted hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mobile-drawer-scroll min-h-0 flex-1 overflow-y-auto">
            <SidebarNav user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
