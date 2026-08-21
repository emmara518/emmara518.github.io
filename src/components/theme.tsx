"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Dark/light toggle persisted in localStorage (`dros-theme`). Default: dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration sync requires state update in effect
    setMounted(true);
    const initialDark = document.documentElement.classList.contains("dark");
    setDark(initialDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dros-theme", next ? "dark" : "light");
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="تبديل المظهر"
        className={cn(
          "grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors",
          className,
        )}
      >
        <span className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تبديل المظهر"
      className={cn(
        "grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-brand hover:border-brand/50",
        className,
      )}
    >
      {dark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  );
}
