"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock user session representation for layout render
  const user = { name: "محمد سعيد", role: "student" as const };

  return (
    <div className="flex min-h-screen bg-bg text-ink font-sans transition-colors duration-300">
      {/* Desktop Sidebar (Persistent LTR/RTL depending on dir) */}
      <div className="hidden lg:block shrink-0">
        <SidebarNav user={user} className="sticky top-0 h-screen" />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 transform bg-surface transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
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

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar user={user} onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
