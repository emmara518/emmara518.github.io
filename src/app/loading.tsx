import { LogoMark } from "@/components/logo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid min-h-[60vh] place-items-center"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="animate-pulse-soft" aria-hidden>
          <LogoMark size={52} />
        </span>
        <p className="font-mono text-xs tracking-[0.3em] text-muted">DROS·MATH</p>
        <span className="sr-only">جاري التحميل…</span>
      </div>
    </div>
  );
}
