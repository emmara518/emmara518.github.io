import { redirect } from "next/navigation";

/**
 * Canonical account UI now lives at /dashboard/settings.
 * The sidebar still links here, so we redirect with the default tab.
 */
export default function AccountPage() {
  redirect("/dashboard/settings?tab=profile");
}
