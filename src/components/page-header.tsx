import Link from "next/link";
import type { ReactNode } from "react";

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
    <header className="space-y-3 border-b border-line pb-5">
      {overline ? (
        <div className="type-eyebrow-display">{overline}</div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <h1 className="type-headline-display text-ink">{title}</h1>
          {subtitle ? (
            <p className="text-base font-semibold text-muted leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          {backHref ? (
            <Link href={backHref} className="text-sm font-bold text-brand hover:underline">
              ← {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
      {flourish ? <div className="type-flourish" aria-hidden /> : null}
    </header>
  );
}