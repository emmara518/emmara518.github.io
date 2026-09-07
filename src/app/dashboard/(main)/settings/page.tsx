import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { getAccountOverview } from "@/lib/services/account.service";
import { listInvoices } from "@/lib/services/billing.service";
import { getPreferences, DEFAULT_PREFERENCES } from "@/lib/services/preferences.service";
import { SettingsTabs } from "@/components/settings-tabs";
import { TABS, type TabKey } from "@/lib/settings-tabs";
import type { InvoiceRow } from "@/components/invoice-table";

export const dynamic = "force-dynamic";

function asTab(v: string | string[] | undefined): TabKey {
  const raw = Array.isArray(v) ? v[0] : v;
  return (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabKey) : "profile";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const params = await searchParams;
  const tab = asTab(params.tab);

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value ?? null;
  const [data, invoiceRows, preferences] = await Promise.all([
    getAccountOverview(user.id, token),
    listInvoices(user.id, 24),
    getPreferences(user.id).catch(() => DEFAULT_PREFERENCES),
  ]);

  if (!data.profile) redirect("/login");

  const invoices: InvoiceRow[] = invoiceRows.map((inv) => ({
    id: inv.id,
    number: inv.number,
    courseTitle: inv.courseTitle,
    status: inv.status as InvoiceRow["status"],
    totalCents: inv.totalCents,
    issuedAt: inv.issuedAt,
  }));

  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="h-10 w-40 animate-pulse rounded-xl bg-surface2" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-surface2" />
          <div className="h-40 w-full animate-pulse rounded-2xl bg-surface2" />
        </div>
      }
    >
      <SettingsTabs
        initialTab={tab}
        profile={{
          name: data.profile.name,
          email: data.profile.email,
          phone: data.profile.phone,
          avatarUrl: data.profile.avatarUrl,
          gradeName: data.profile.gradeName,
          createdAt: data.profile.createdAt,
        }}
        sessions={data.sessions}
        subscriptions={data.subscriptions.map((s) => ({
          id: s.id,
          status: s.status,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          courseTitle: s.courseTitle,
          courseSlug: s.courseSlug,
        }))}
        invoices={invoices}
        preferences={preferences}
      />
    </Suspense>
  );
}
