"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { SettingsProfileForm, type ProfileShape } from "@/components/settings-profile-form";
import { SettingsSessionsList, type SessionRow } from "@/components/settings-sessions-list";
import { SettingsNotificationsForm } from "@/components/settings-notifications-form";
import { SettingsAppearanceForm } from "@/components/settings-appearance-form";
import Link from "next/link";
import { buttonStyles, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { InvoiceRow } from "@/components/invoice-table";
import { InvoiceTable } from "@/components/invoice-table";
import type { UserPreferences } from "@/lib/services/preferences.service";
import { Wallet, KeyRound, Bell, Palette, UserRound } from "lucide-react";

export type SubscriptionRow = {
  id: string;
  status: string;
  startsAt: Date | string;
  endsAt: Date | string | null;
  courseTitle: string;
  courseSlug: string;
};

import { TABS, isTabKey, type TabKey } from "@/lib/settings-tabs";

// Re-exported so existing deep imports keep working.
export { TABS, isTabKey };
export type { TabKey };

const TAB_META: Record<TabKey, { label: string; icon: typeof UserRound }> = {
  profile: { label: "الملف الشخصي", icon: UserRound },
  security: { label: "الأمان", icon: KeyRound },
  subscriptions: { label: "الاشتراكات", icon: Wallet },
  notifications: { label: "الإشعارات", icon: Bell },
  appearance: { label: "المظهر", icon: Palette },
};

const SUB_STATUS_LABEL: Record<string, { label: string; tone: "success" | "danger" | "muted" }> = {
  active: { label: "نشط", tone: "success" },
  expired: { label: "منتهي", tone: "muted" },
  cancelled: { label: "ملغي", tone: "danger" },
};

const isTab = isTabKey;

/**
 * Settings tabs — controlled by the `?tab=` query param so the URL is the
 * single source of truth. Tab clicks update the URL via shallow replace
 * rather than full navigation.
 */
export function SettingsTabs({
  initialTab,
  profile,
  sessions,
  subscriptions,
  invoices,
  preferences,
}: {
  initialTab: TabKey;
  profile: ProfileShape;
  sessions: SessionRow[];
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
  preferences: UserPreferences;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active: TabKey = useMemo(() => {
    const raw = searchParams.get("tab");
    return isTab(raw) ? raw : initialTab;
  }, [searchParams, initialTab]);

  const setTab = useCallback(
    (next: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="الإعدادات" subtitle="إدارة حسابك ومظهر المنصة وتفضيلاتك." />

      <div
        role="tablist"
        aria-label="إعدادات الحساب"
        className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1 shadow-card"
      >
        {TABS.map((key) => {
          const meta = TAB_META[key];
          const Icon = meta.icon;
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={isActive}
              aria-controls={`panel-${key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2",
              )}
            >
              <Icon size={14} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="space-y-4"
      >
        {active === "profile" ? <ProfileTab profile={profile} /> : null}
        {active === "security" ? <SecurityTab sessions={sessions} /> : null}
        {active === "subscriptions" ? (
          <SubscriptionsTab subscriptions={subscriptions} invoices={invoices} />
        ) : null}
        {active === "notifications" ? (
          <NotificationsTab preferences={preferences} />
        ) : null}
        {active === "appearance" ? <AppearanceTab preferences={preferences} /> : null}
      </section>
    </div>
  );
}

/* ── tab content ────────────────────────────────────────────── */

function ProfileTab({ profile }: { profile: ProfileShape }) {
  return (
    <div className="space-y-4">
      <SettingsProfileForm profile={profile} />
    </div>
  );
}

function SecurityTab({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="space-y-3">
      <h2 className="inline-flex items-center text-base font-black text-ink">
        <span className="type-rule" aria-hidden />
        الأجهزة والجلسات
      </h2>
      <SettingsSessionsList sessions={sessions} />
    </div>
  );
}

function SubscriptionsTab({
  subscriptions,
  invoices,
}: {
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="inline-flex items-center text-base font-black text-ink">
          <span className="type-rule" aria-hidden />
          اشتراكاتي
        </h2>
        <Card className="divide-y divide-line">
          {subscriptions.length === 0 ? (
            <div className="space-y-3 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-muted">لا توجد اشتراكات بعد.</p>
              <Link href="/courses" className={buttonStyles("primary", "sm")}>
                تصفح الكورسات
              </Link>
            </div>
          ) : (
            subscriptions.map((s) => {
              const st = SUB_STATUS_LABEL[s.status] ?? SUB_STATUS_LABEL.expired;
              return (
                <div key={s.id} className="space-y-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/courses/${s.courseSlug}`}
                      className="truncate text-xs font-extrabold text-ink hover:text-brand"
                    >
                      {s.courseTitle}
                    </Link>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold leading-5",
                        st.tone === "success" && "bg-success/10 text-success",
                        st.tone === "danger" && "bg-danger/10 text-danger",
                        st.tone === "muted" && "bg-surface2 text-muted",
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    بدأ: {formatDate(s.startsAt)}
                    {s.endsAt ? ` · ينتهي: ${formatDate(s.endsAt)}` : ""}
                  </p>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="inline-flex items-center text-base font-black text-ink">
          <span className="type-rule" aria-hidden />
          فواتيري
        </h2>
        {invoices.length === 0 ? (
          <EmptyState
            compact
            icon={<Wallet size={18} />}
            title="لا توجد فواتير بعد."
            hint="ستظهر هنا فواتيرك بعد أول عملية شراء."
          />
        ) : (
          <InvoiceTable invoices={invoices} />
        )}
      </div>
    </div>
  );
}

function NotificationsTab({ preferences }: { preferences: UserPreferences }) {
  return (
    <div className="space-y-3">
      <h2 className="inline-flex items-center text-base font-black text-ink">
        <span className="type-rule" aria-hidden />
        تفضيلات الإشعارات
      </h2>
      <SettingsNotificationsForm initial={preferences} />
    </div>
  );
}

function AppearanceTab({ preferences }: { preferences: UserPreferences }) {
  return (
    <div className="space-y-3">
      <h2 className="inline-flex items-center text-base font-black text-ink">
        <span className="type-rule" aria-hidden />
        المظهر
      </h2>
      <SettingsAppearanceForm initial={preferences} />
    </div>
  );
}
