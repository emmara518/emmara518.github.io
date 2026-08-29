"use client";

import { Moon, Sun, Sparkles } from "lucide-react";
import { useState, useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "dros-theme";
const THEME_CHANGE_EVENT = "dros-theme-change";

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light") return false;
    if (stored === "dark") return true;
    return document.documentElement.classList.contains("dark");
  } catch {
    return true;
  }
}

function getThemeServerSnapshot(): boolean {
  return true;
}

const emptySubscribe = () => () => {};

export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Direct DOM Theme Applier function.
 * Explicitly toggles `.dark` class and `data-theme` on document.documentElement,
 * and adjusts document.body and colorScheme.
 */
export function applyThemeDirectly(isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
    if (body) {
      body.classList.add("dark");
    }
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
    if (body) {
      body.classList.remove("dark");
    }
  }
}

/**
 * High-fidelity theme toggle button that explicitly toggles the `.dark` class
 * on document.documentElement with smooth rotation and fade transition animations.
 */
export function ThemeToggle({
  className,
  showLabel = false,
  variant = "default",
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "pill" | "minimal";
}) {
  const mounted = useIsMounted();
  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  const handleToggle = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setIsRotating(true);
      setTimeout(() => setIsRotating(false), 500);

      const nextIsDark = !isDark;
      const nextTheme = nextIsDark ? "dark" : "light";

      // Mutate DOM document.documentElement and body
      applyThemeDirectly(nextIsDark);

      // Persist selection to localStorage
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore private storage limitations
      }

      // Broadcast synchronization event to all mounted ThemeToggle instances
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(THEME_CHANGE_EVENT, {
            detail: { theme: nextTheme, isDark: nextIsDark },
          })
        );
      }
    },
    [isDark]
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="تبديل المظهر"
        className={cn(
          "inline-flex items-center justify-center size-9 sm:size-10 rounded-xl border border-line bg-surface text-muted cursor-pointer transition-colors",
          className
        )}
      >
        <Sun size={17} className="text-amber-400 opacity-60" />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!isDark}
        onClick={handleToggle}
        title={isDark ? "تفعيل الوضع الفاتح (Light Mode)" : "تفعيل الوضع الداكن (Dark Mode)"}
        className={cn(
          "group relative inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-line bg-surface hover:bg-surface2 text-xs font-semibold text-ink shadow-sm transition-all duration-300 hover:border-brand active:scale-95 cursor-pointer select-none",
          className
        )}
      >
        {/* Animated Rotation & Fade Container */}
        <div className="relative size-4 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Sun Icon (Dark Mode active) */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0 pointer-events-none"
            )}
          >
            <Sun
              size={15}
              className="text-amber-400 transition-transform duration-300 group-hover:rotate-45"
            />
          </span>

          {/* Moon Icon (Light Mode active) */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              !isDark
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0 pointer-events-none"
            )}
          >
            <Moon
              size={15}
              className="text-sky-600 transition-transform duration-300 group-hover:-rotate-12"
            />
          </span>
        </div>
        <span className="font-ui text-xs text-muted group-hover:text-ink pointer-events-none transition-colors duration-200">
          {isDark ? "الوضع الفاتح" : "الوضع الداكن"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "تفعيل الوضع الفاتح (Light Mode)" : "تفعيل الوضع الداكن (Dark Mode)"}
      onClick={handleToggle}
      title={isDark ? "تفعيل الوضع الفاتح (Light Mode)" : "تفعيل الوضع الداكن (Dark Mode)"}
      className={cn(
        "group relative grid size-9 sm:size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition-all duration-300 hover:text-ink hover:border-brand hover:shadow-md active:scale-90 cursor-pointer overflow-hidden select-none",
        isDark ? "bg-surface text-amber-300" : "bg-surface text-sky-600",
        isRotating && "ring-2 ring-brand/40",
        className
      )}
    >
      {/* Background Subtle Gradient Pulse on Hover */}
      <span className="absolute inset-0 bg-gradient-to-tr from-brand/5 via-transparent to-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Dual Animated Icon Assembly with Synchronized Rotation, Scale & Fade Transitions */}
      <div className="relative size-5 flex items-center justify-center pointer-events-none">
        {/* Sun Icon (Rotates and scales smoothly in Dark Mode) */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        >
          <Sun
            size={18}
            strokeWidth={2.2}
            className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-transform duration-300 group-hover:rotate-45"
          />
          <Sparkles
            size={8}
            className="absolute -top-1 -right-1 text-amber-300 opacity-70 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300"
          />
        </div>

        {/* Moon Icon (Rotates and scales smoothly in Light Mode) */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            !isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        >
          <Moon
            size={18}
            strokeWidth={2.2}
            className="text-sky-600 drop-shadow-[0_0_8px_rgba(2,132,199,0.3)] transition-transform duration-300 group-hover:-rotate-12"
          />
        </div>
      </div>

      {showLabel && (
        <span className="sr-only">
          {isDark ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن"}
        </span>
      )}
    </button>
  );
}
