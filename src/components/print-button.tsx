"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Print-friendly action button.
 * Sets `body.printing-voucher` so the global print stylesheet isolates
 * `.print-area` and hides everything else, then triggers `window.print()`.
 * The class is removed on the `afterprint` event.
 */
export function PrintButton({
  label = "طباعة / تحميل PDF",
  className,
}: {
  label?: string;
  className?: string;
}) {
  useEffect(() => {
    function onAfterPrint() {
      document.body.classList.remove("printing-voucher");
    }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  function handlePrint() {
    document.body.classList.add("printing-voucher");
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={cn(buttonStyles("outline", "sm"), "no-print", className)}
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
