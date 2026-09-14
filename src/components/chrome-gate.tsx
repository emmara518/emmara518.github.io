"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isAppShellRoute } from "@/lib/chrome-routes";

/**
 * Hides shared public-site chrome (header / footer / background) on every
 * route that renders its own shell. The route list is centralised in
 * `@/lib/chrome-routes` so this gate and the public header can never drift
 * apart again.
 */
export function DashboardChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isAppShellRoute(pathname)) return null;
  return <>{children}</>;
}
