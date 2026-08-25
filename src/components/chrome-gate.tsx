"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides shared public-site chrome (header / footer / background) inside the
 * student dashboard and the admin console, which render their own workspace shells.
 */
export function DashboardChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
