"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminNavProvider } from "./admin-nav-context";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

interface AdminShellProps {
  actorName: string;
  actorRole: string;
  children: ReactNode;
}

export function AdminShell({ actorName, actorRole, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminNavProvider>
      <div className="flex min-h-screen bg-bg font-sans text-ink">
        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block">
          <AdminSidebar
            className="sticky top-0 h-screen"
            actorName={actorName}
            actorRole={actorRole}
          />
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            actorName={actorName}
            onToggleMobileMenu={() => setMobileOpen((v) => !v)}
            mobileOpen={mobileOpen}
          />
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile drawer — fixed-positioned, so it does not participate in
          the flex flow (no white space on the right when closed). When
          closed the drawer is translated off-screen and marked inert to
          block interaction and screen-reader exposure. We deliberately
          avoid `visibility: hidden` because it can interact badly with
          the fixed-position + flex parent combo on some browsers. */}
      {mobileOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      ) : null}
      <div
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-30 flex w-72 max-w-[80vw] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminSidebar
            variant="mobile"
            className="h-full border-e-0"
            actorName={actorName}
            actorRole={actorRole}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>
      </div>
    </AdminNavProvider>
  );
}
