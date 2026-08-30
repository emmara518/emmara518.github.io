"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  icon?: React.ReactNode;
  run: () => void;
};

/**
 * Admin command palette — Ctrl/Cmd+K to open, arrow keys to navigate,
 * Enter to run. Also exposes global shortcuts:
 *  - "/" focuses the global search input
 *  - "?" opens the palette (which doubles as the shortcuts cheatsheet)
 */
export function useCommandPalette(commands: PaletteCommand[], onOpenChange?: (open: boolean) => void) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const setOpenSafe = useCallback(
    (v: boolean) => {
      setOpen(v);
      onOpenChange?.(v);
    },
    [onOpenChange]
  );

  useEffect(() => {
    function isTypingTarget(t: EventTarget | null) {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenSafe(!openRef.current);
        return;
      }
      if (e.key === "/" && !isTypingTarget(e.target)) {
        const search = document.querySelector<HTMLInputElement>('input[type="search"]');
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }
      if (e.key === "?" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpenSafe(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpenSafe]);

  return { open, setOpen: setOpenSafe };
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Reset query/selection whenever the palette opens (render-time state adjustment)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIdx(0);
    }
  }

  // Focus + scroll lock on open
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Keep active item visible
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const runCommand = useCallback(
    (cmd: PaletteCommand | undefined) => {
      if (!cmd) return;
      onClose();
      cmd.run();
    },
    [onClose]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runCommand(filtered[activeIdx]);
      }
    },
    [filtered, activeIdx, onClose, runCommand]
  );

  if (!open) return null;

  // Group filtered commands for section headers
  let lastGroup = "";

  return (
    <div
      className="no-print fixed inset-0 z-[85] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="لوحة الأوامر السريعة"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-lift animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="انتقل إلى أي شاشة أو نفّذ أمراً سريعاً..."
            aria-label="ابحث في الأوامر"
            className="h-13 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <kbd className="shrink-0 rounded-md border border-line bg-surface2 px-1.5 py-0.5 font-mono text-xs text-muted" dir="ltr">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="custom-scrollbar max-h-[46vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-base text-muted">لا توجد نتائج مطابقة.</p>
          ) : (
            filtered.map((cmd, idx) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              const active = idx === activeIdx;
              return (
                <div key={cmd.id}>
                  {showGroup && (
                    <p className="px-2 pb-1 pt-3 type-overline">
                      <span className="overline-glyph">◆</span>
                      {cmd.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => runCommand(cmd)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                      active ? "bg-brand/10 text-ink" : "text-muted hover:bg-surface2"
                    )}
                  >
                    {cmd.icon ? <span className={cn("shrink-0", active ? "text-brand" : "text-muted")}>{cmd.icon}</span> : null}
                    <span className="flex-1 font-medium text-ink">{cmd.label}</span>
                    {active && <CornerDownLeft size={14} className="shrink-0 text-brand" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface2/60 px-4 py-2.5 text-xs text-muted">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono" dir="ltr">↑↓</kbd> تنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono" dir="ltr">Enter</kbd> تنفيذ
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono" dir="ltr">/</kbd> بحث
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 font-mono" dir="ltr">Ctrl K</kbd> اللوحة
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
