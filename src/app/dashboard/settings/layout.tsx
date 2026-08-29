import type { ReactNode } from "react";

/**
 * Settings lives under the dashboard tree so it inherits the dashboard
 * shell (topbar + sidebar). This layout is intentionally empty — the
 * parent `dashboard/layout.tsx` handles auth, role checks, and chrome.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
