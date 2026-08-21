/** Formatting utilities — one place for money, time and date display (Arabic-first). */

/** Money is stored as integer EGP cents everywhere. */
export function formatEGP(cents: number): string {
  const egp = cents / 100;
  return `${egp % 1 === 0 ? egp.toLocaleString("en-US", { maximumFractionDigits: 0 }) : egp.toFixed(2)} ج.م`;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ساعة` : `${hours} س ${rest} د`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return formatDate(d);
}

/** Deterministic hue per id — drives generative course artwork. */
export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}
