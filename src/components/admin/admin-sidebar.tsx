"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Command,
  ExternalLink,
  Gauge,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { CATEGORIES, visibleCategories } from "./nav-config";
import { useAdminNav } from "./admin-nav-context";
import { ROLE_LABELS, permissionsFor, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "admin-sidebar-collapsed";

interface AdminSidebarProps {
  className?: string;
  /** "mobile" forces the expanded layout inside the drawer. */
  variant?: "desktop" | "mobile";
  actorName: string;
  actorRole: string;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  className,
  variant = "desktop",
  actorName,
  actorRole,
  onCloseMobile,
}: AdminSidebarProps) {
  const router = useRouter();
  const {
    category: activeCategory,
    subFeature: activeSubFeature,
    setCategory,
    setSubFeature,
    badges,
  } = useAdminNav();

  const [collapsed, setCollapsed] = useState(false);
  /* Explicit open/closed overrides; hubs without an entry follow the active one. */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* Restore collapsed preference after mount (avoids SSR mismatch) */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function toggleHub(id: string, currentlyOpen: boolean) {
    setExpanded((prev) => ({ ...prev, [id]: !currentlyOpen }));
  }

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  /* Ctrl+B toggles the rail — a world-class panel shortcut. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    onCloseMobile?.();
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* best effort */
    }
    router.push("/");
    router.refresh();
  }

  const isMobile = variant === "mobile";
  const isRail = !isMobile && collapsed;
  const roleLabel = ROLE_LABELS[actorRole as Role] ?? actorRole;
  const initials = actorName.trim().charAt(0) || "م";
  const actorPerms = permissionsFor((actorRole as Role) || "student");
  const cats = visibleCategories(actorPerms);

  return (
    <aside
      className={cn(
        "flex h-full select-none flex-col border-e border-line bg-surface transition-[width] duration-300 ease-in-out",
        isRail ? "w-[76px]" : "w-72",
        className
      )}
    >
      {/* ── Brand ── */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-line py-3.5",
          isRail ? "flex-col px-2" : "px-3"
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-xs">
          <Gauge size={18} />
        </div>
        {!isRail && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-brand text-sm font-bold text-ink">دروس ماث</p>
            <p className="text-xs font-medium text-muted">مركز تحكم الإدارة</p>
          </div>
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
            className="ms-auto grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isRail ? "توسيع القائمة الجانبية" : "تصغير القائمة الجانبية"}
            title={isRail ? "توسيع القائمة" : "تصغير القائمة"}
            className={cn(
              "hidden size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-ink lg:grid",
              isRail ? "" : "ms-auto"
            )}
          >
            {isRail ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav aria-label="تنقل لوحة الإدارة" className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-3">
        <ul className={cn("space-y-1", isRail && "space-y-2")}>
          {cats.map((cat) => {
            const CatIcon = cat.icon;
            const isActiveCat = cat.id === activeCategory;

            /* Icon rail mode */
            if (isRail) {
              return (
                <li key={cat.id} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    title={cat.label}
                    aria-label={cat.label}
                    aria-current={isActiveCat ? "true" : undefined}
                    className={cn(
                      "grid size-10 cursor-pointer place-items-center rounded-xl transition-colors",
                      isActiveCat
                        ? "bg-brand/10 text-brand ring-1 ring-brand/40"
                        : "text-muted hover:bg-surface2 hover:text-ink"
                    )}
                  >
                    <CatIcon size={18} />
                  </button>
                </li>
              );
            }

            const isOpen = expanded[cat.id] ?? isActiveCat;
            // Hub badge: total pending items across this hub's sub-features.
            // Falls back to the static sub-feature count when there are no
            // pending items, so the number is never wrong (it always
            // represents something meaningful).
            const hubPending = cat.subFeatures.reduce(
              (sum, sub) => sum + (badges[sub.id] ?? 0),
              0
            );
            const hubBadgeLabel =
              hubPending > 0
                ? `${hubPending} بند بانتظار المراجعة في ${cat.label}`
                : `${cat.subFeatures.length} ميزة في ${cat.label}`;
            return (
              <li key={cat.id}>
                {/* Hub header */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleHub(cat.id, isOpen)}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold transition-colors",
                    isActiveCat ? "text-brand" : "text-muted hover:bg-surface2 hover:text-ink"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
                      isActiveCat
                        ? "bg-brand text-white shadow-xs"
                        : "bg-surface2 text-muted group-hover:text-ink"
                    )}
                  >
                    <CatIcon size={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-start type-overline">
                    <span className="overline-glyph">◆</span>
                    {cat.label}
                  </span>
                  <span
                    aria-label={hubBadgeLabel}
                    title={hubBadgeLabel}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                      hubPending > 0
                        ? "bg-danger/10 text-danger"
                        : isActiveCat
                          ? "bg-brand/10 text-brand"
                          : "bg-surface2 text-muted"
                    )}
                  >
                    {hubPending > 0 ? hubPending : cat.subFeatures.length}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180",
                      isActiveCat ? "text-brand" : "text-muted"
                    )}
                  />
                </button>

                {/* Sub features (animated accordion) */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <ul className="ms-6 me-1 space-y-0.5 overflow-hidden border-s border-line ps-2 pt-0.5">
                    {cat.subFeatures.map((sub) => {
                      const SubIcon = sub.icon;
                      const isActiveSub = isActiveCat && sub.id === activeSubFeature;
                      const badgeCount = badges[sub.id] ?? 0;
                      return (
                        <li key={sub.id}>
                          <button
                            type="button"
                            aria-current={isActiveSub ? "page" : undefined}
                            onClick={() => {
                              setSubFeature(sub.id);
                              onCloseMobile?.();
                            }}
                            className={cn(
                              "relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
                              isActiveSub
                                ? "bg-neon-lime-soft text-brand"
                                : "text-muted hover:bg-surface2 hover:text-ink"
                            )}
                          >
                            {isActiveSub && (
                              <span
                                className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-brand"
                                aria-hidden
                              />
                            )}
                            <SubIcon
                              size={14}
                              strokeWidth={isActiveSub ? 2.4 : 2}
                              className="shrink-0"
                            />
                            <span className="min-w-0 flex-1 truncate text-start">{sub.label}</span>
                            {badgeCount > 0 && (
<span
                              className="grid min-w-5 shrink-0 place-items-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold tabular-nums text-white"
                              title={`${badgeCount} بانتظار المراجعة`}
                            >
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="space-y-2 border-t border-line p-3">
        <Link
          href="/courses"
          onClick={onCloseMobile}
          title="عرض المنصة كما يراها الطالب"
          aria-label="عرض المنصة كما يراها الطالب"
          className={cn(
            "flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-bold text-muted transition-colors hover:border-brand/40 hover:text-ink",
            isRail && "justify-center px-0"
          )}
        >
          <ExternalLink size={14} className="shrink-0 text-brand" />
          {!isRail && <span>عرض المنصة</span>}
        </Link>

        {!isRail && (
          <div className="hidden items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-xs font-medium text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Command size={12} className="text-brand" />
              أوامر سريعة
            </span>
            <kbd
              dir="ltr"
              className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-xs"
            >
              Ctrl K
            </kbd>
          </div>
        )}

        {/* Actor identity + logout */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-line bg-surface2 p-2.5",
            isRail && "justify-center p-2"
          )}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 font-brand text-sm font-bold text-brand ring-1 ring-brand/30">
            {initials}
          </div>
          {!isRail && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-extrabold text-ink">{actorName}</p>
                <p className="text-xs font-medium text-muted">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <LogOut size={14} className="-scale-x-100" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
