"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { ShellNotification } from "@/components/dashboard-shell";

type ListItem = ShellNotification & { link?: string | null };

const PAGE_SIZE = 20;

export function NotificationsList({ notifications }: { notifications: ListItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<ListItem[]>(notifications);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const filtered = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [filter, items],
  );
  const slice = filtered.slice(0, visible);
  const unreadCount = items.filter((n) => !n.read).length;

  async function markOne(id: string) {
    const item = items.find((n) => n.id === id);
    if (!item || item.read) return;
    setBusyId(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const res = await fetch(`/api/v1/me/notifications/${id}/read`, { method: "POST" });
      if (!res.ok) {
        // revert on failure
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      } else {
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function markAll() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/v1/me/notifications", { method: "PATCH" });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        router.refresh();
      }
    } finally {
      setMarkingAll(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={20} />}
        title="لا إشعارات بعد."
        hint="ستظهر هنا كل إشعاراتك."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 transition-colors",
              filter === "all" ? "bg-brand text-white" : "text-muted hover:text-ink",
            )}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-full px-3.5 py-1.5 transition-colors",
              filter === "unread" ? "bg-brand text-white" : "text-muted hover:text-ink",
            )}
          >
            غير مقروء ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 ? (
          <button
            onClick={markAll}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline disabled:opacity-50"
          >
            {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            تعليم الكل كمقروء
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={<Check size={18} />}
          title="لا إشعارات غير مقروءة."
          hint="كل إشعاراتك تم الاطلاع عليها."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {slice.map((n) => {
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5",
                  !n.read && "bg-[var(--brand-soft)]/60",
                )}
              >
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="block text-sm font-bold text-ink hover:underline"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="block text-sm font-bold text-ink">{n.title}</p>
                  )}
                  {n.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-6 text-muted">{n.body}</p> : null}
                  <p className="mt-1 font-mono text-[10px] text-muted/70">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read ? (
                  <button
                    onClick={() => void markOne(n.id)}
                    disabled={busyId === n.id}
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand hover:underline disabled:opacity-50"
                  >
                    {busyId === n.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    تعليم كمقروء
                  </button>
                ) : (
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-muted/70">
                    <Check size={11} /> مقروء
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {visible < filtered.length ? (
        <div className="flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold text-muted hover:text-ink"
          >
            تحميل المزيد ({filtered.length - visible} متبقي)
          </button>
        </div>
      ) : null}
    </div>
  );
}
