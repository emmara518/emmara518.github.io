"use client";

import { ChevronLeft, Gauge, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { findCategory, findSubFeature } from "./nav-config";
import { useAdminNav } from "./admin-nav-context";

interface AdminTopbarProps {
  actorName: string;
  onToggleMobileMenu: () => void;
}

export function AdminTopbar({ onToggleMobileMenu }: AdminTopbarProps) {
  const { category, subFeature, setCategory } = useAdminNav();

  const cat = findCategory(category);
  const sub = findSubFeature(subFeature);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-md sm:px-5">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        aria-label="فتح القائمة الجانبية"
        className="grid size-9 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-ink lg:hidden"
      >
        <Menu size={17} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="مسار التنقل" className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setCategory("overview")}
          title="العودة للرئيسية"
          className="hidden cursor-pointer items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1.5 text-brand transition-colors hover:bg-brand/20 sm:inline-flex"
        >
          <Gauge size={13} />
          لوحة الإدارة
        </button>
        <ChevronLeft size={13} className="hidden text-muted sm:block" aria-hidden />
        <button
          type="button"
          onClick={() => cat && setCategory(cat.id)}
          className="cursor-pointer truncate rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
        >
          {cat?.label ?? ""}
        </button>
        <ChevronLeft size={13} className="text-muted" aria-hidden />
        <span className="truncate rounded-lg px-2 py-1.5 type-subhead-roman text-brand">{sub?.sub.label ?? ""}</span>
      </nav>

      <div className="ms-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
