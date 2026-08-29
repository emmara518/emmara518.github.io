import type { ReactNode } from "react";

/** Print-friendly surface — no parent dashboard shell here. */
export default function ParentReportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8 print:p-0">
        {children}
      </main>
    </div>
  );
}
