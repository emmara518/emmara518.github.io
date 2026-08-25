"use client";

import { useState, type ReactNode } from "react";
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

        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* Mobile drawer — RTL: slides in from the right edge */}
        <div
          aria-hidden={!mobileOpen}
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-surface shadow-2xl transition-[transform,visibility] duration-300 ease-in-out lg:hidden",
            mobileOpen ? "visible translate-x-0" : "invisible translate-x-full"
          )}
        >
          <AdminSidebar
            variant="mobile"
            className="h-full border-e-0"
            actorName={actorName}
            actorRole={actorRole}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar actorName={actorName} onToggleMobileMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminNavProvider>
  );
}
