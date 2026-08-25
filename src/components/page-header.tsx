import Link from "next/link";
import type { ReactNode } from "react";

/** Consistent sub-page header — title, one-line subtitle, back navigation. */
export function PageHeader({
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "لوحة الطالب",
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="space-y-1">
        <h1 className="text-lg font-black text-ink">{title}</h1>
        {subtitle ? <p className="text-xs font-semibold text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <Link href={backHref} className="text-xs font-bold text-brand hover:underline">
          ← {backLabel}
        </Link>
      </div>
    </header>
  );
}
