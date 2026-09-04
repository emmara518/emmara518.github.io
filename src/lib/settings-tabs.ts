/**
 * Settings tab keys — server-safe module (no "use client").
 * Imported by both the server page (`dashboard/settings/page.tsx`, which
 * validates `?tab=` during SSR) and the client tabs component.
 * Never move these into a client component: server components cannot
 * read runtime values from client modules.
 */
export const TABS = [
  "profile",
  "security",
  "subscriptions",
  "notifications",
  "appearance",
] as const;

export type TabKey = (typeof TABS)[number];

export function isTabKey(v: string | null | undefined): v is TabKey {
  return !!v && (TABS as readonly string[]).includes(v);
}
