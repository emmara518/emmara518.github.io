import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarTone = "muted" | "brand" | "brand-soft";

const SIZE: Record<AvatarSize, string> = {
  xs: "size-6 text-xs",
  sm: "size-8 text-xs",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
};
const TONE: Record<AvatarTone, string> = {
  muted: "bg-surface2 text-muted",
  brand: "bg-brand-soft text-brand",
  "brand-soft": "bg-[var(--brand-soft)] text-brand",
};

export function Avatar({
  name,
  src,
  size = "sm",
  tone = "muted",
  ring = true,
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  ring?: boolean;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const cls = cn(
    "grid shrink-0 place-items-center rounded-full font-bold overflow-hidden",
    SIZE[size],
    TONE[tone],
    ring && "ring-1 ring-line",
    className,
  );
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn(cls, "object-cover")} />;
  }
  return <span className={cls} aria-hidden>{initials || "؟"}</span>;
}
