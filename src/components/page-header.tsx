import Link from "next/link";
import type { ReactNode } from "react";

/** Consistent sub-page header — title, one-line subtitle, optional back navigation.
 *  Mobile-first: overline + flourish hide on small viewports to keep the
 *  page header compact and let content breathe above the fold. */
export function PageHeader({
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "لوحة الطالب",
  actions,
  overline,
  flourish = true,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  /** Optional editorial eyebrow shown above the title. E.g. "DROS MATH · مساحة الطالب". */
  overline?: string;
  /** Decorative double-rule divider below the title (default true). */
  flourish?: boolean;
}) {
  return (
    <header className="space-y-3 border-b border-line pb-4 sm:pb-5">
      {overline ? (
        <div className="type-eyebrow-display hidden sm:inline-flex">{overline}</div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <h1 className="type-headline-display text-ink">{title}</h1>
          {subtitle ? (
            <p className="text-sm font-semibold text-muted leading-relaxed max-w-2xl sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
          {actions}
          {backHref ? (
            <Link href={backHref} className="text-sm font-bold text-brand hover:underline">
              ← {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
      {flourish ? (
        <div className="type-flourish hidden sm:block" aria-hidden />
      ) : null}
    </header>
  );
}