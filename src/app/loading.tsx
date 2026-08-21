import { LogoMark } from "@/components/logo";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-pulse-soft">
          <LogoMark size={52} />
        </span>
        <p className="font-mono text-xs tracking-[0.3em] text-muted">DROS·MATH</p>
      </div>
    </div>
  );
}
