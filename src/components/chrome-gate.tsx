"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides shared public-site chrome (header / footer / background) inside the
 * student dashboard, the admin console, and the parent portal, which each
 * render their own workspace shell. Without the parent path, the public
 * fixed header (z-50) renders on top of the parent shell header (z-40).
 */
export function DashboardChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/parent")
  )
    return null;
  return <>{children}</>;
}
