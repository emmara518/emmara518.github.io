"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides shared public-site chrome (header / footer / background) inside the
 * student dashboard, which renders its own compact workspace shell.
 */
export function DashboardChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <>{children}</>;
}
