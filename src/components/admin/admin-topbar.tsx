"use client";

import { ChevronLeft, Gauge, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { findCategory, findSubFeature } from "./nav-config";
import { useAdminNav } from "./admin-nav-context";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  actorName: string;
  onToggleMobileMenu: () => void;
  /** Open state of the mobile drawer — drives the hamburger's icon and
   *  hides the breadcrumb + theme toggle on mobile so the topbar doesn't
   *  visually collide with the drawer's brand area. */
  mobileOpen?: boolean;
}

export function AdminTopbar({
  onToggleMobileMenu,
  mobileOpen = false,
}: AdminTopbarProps) {
  const { category, subFeature, setCategory } = useAdminNav();

  const cat = findCategory(category);
  const sub = findSubFeature(subFeature);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-md sm:px-5">
      {/* Mobile menu — becomes the close (X) toggle when the drawer is open. */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        aria-label={mobileOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}
        className="grid size-11 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-ink lg:hidden"
      >
        {mobileOpen ? <X size={17} /> : <Menu size={17} />}
      </button>

      {/* Breadcrumb — hidden on mobile when the drawer is open so it
          doesn't sit on top of the drawer's brand/logo area. */}
      <nav
        aria-label="مسار التنقل"
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-sm font-semibold",
          mobileOpen && "lg:flex hidden",
        )}
      >
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

      <div
        className={cn(
          "ms-auto flex items-center gap-2",
          mobileOpen && "lg:flex hidden",
        )}
      >
        <ThemeToggle />
      </div>
    </header>
  );
}
