import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * UI primitives — shared across every page. No page-specific copies.
 * All colors resolve from design tokens (globals.css), never raw hex.
 */

/* ── buttons ── */
type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "surface" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    variant === "primary" &&
      "bg-brand text-white hover:bg-brand-strong shadow-[0_4px_12px_-4px_var(--brand)]",
    variant === "gold" &&
      "bg-gold text-[#1a1405] hover:brightness-110 shadow-[0_4px_12px_-4px_var(--gold)]",
    variant === "outline" &&
      "border border-line bg-transparent text-ink hover:border-brand hover:text-brand",
    variant === "ghost" && "bg-transparent text-ink hover:bg-surface2",
    variant === "surface" && "bg-surface2 text-ink hover:bg-line",
    variant === "danger" && "bg-danger text-white hover:brightness-110",
    size === "sm" && "h-9 px-3.5 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-13 px-7 text-base",
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(buttonStyles(variant, size), className)} {...props} />;
}

/* ── cards ── */
export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface shadow-card",
        hover && "transition-all duration-200 hover:shadow-lift hover:border-brand/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── badges ── */
type BadgeTone = "brand" | "gold" | "success" | "muted" | "danger" | "outline";
export function Badge({
  tone = "brand",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-normal",
        tone === "brand" && "bg-[var(--brand-soft)] text-brand",
        tone === "gold" && "bg-[var(--gold-soft)] text-gold",
        tone === "success" && "bg-success/10 text-success",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "muted" && "bg-surface2 text-muted",
        tone === "outline" && "border border-line text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── form controls ── */
export const inputStyles = cn(
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink",
  "placeholder:text-muted/70 transition-colors focus:border-brand outline-none",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(inputStyles, "h-auto min-h-24 py-2.5 resize-y", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputStyles, "appearance-none cursor-pointer pe-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  /* Server-safe Field: renders label + child + hint/error text. The
   * interactive ARIA plumbing (aria-invalid + aria-describedby) lives
   * in the client-side Field re-export in ui-field.tsx; using this
   * from a Server Component renders the simpler markup. The
   * appearance is identical either way. */
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs font-bold text-danger" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs text-muted/80">{hint}</span>
      ) : null}
    </label>
  );
}

/* ── feedback ── */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  tone = "muted",
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  tone?: "muted" | "brand";
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-3 border-dashed text-center",
        compact ? "px-4 py-6" : "px-6 py-10",
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-2xl",
          compact ? "size-10" : "size-12",
          tone === "brand" ? "bg-[var(--brand-soft)] text-brand" : "bg-surface2 text-muted",
        )}
      >
        {icon}
      </div>
      <p className={cn("type-card-heading", compact ? "" : "")}>{title}</p>
      {hint ? (
        <p className={cn("max-w-md text-muted", compact ? "text-sm" : "text-base")}>{hint}</p>
      ) : null}
      {action}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface2", className)} />;
}

export function Progress({
  value,
  variant = "solid",
  className,
}: {
  value: number;
  variant?: "solid" | "gradient";
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface2", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          variant === "gradient"
            ? "bg-[linear-gradient(90deg,var(--brand),var(--gold))]"
            : "bg-brand",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-line", className)} />;
}
