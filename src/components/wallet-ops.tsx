"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  CircleAlert,
  Copy,
  Check,
  LoaderCircle as Loader2,
  ReceiptText,
  Send,
  Ticket,
} from "lucide-react";
import { Button, Card, Field, Input, Select } from "./ui";
import { formatEGP, timeAgo, TXN_KIND_LABELS } from "@/lib/format";
import type { WalletTxnView } from "./wallet-card";

export type PaymentRequestView = {
  id: string;
  amountEgp: number;
  method: string;
  status: string;
  adminNote: string;
  issuedCode: string | null;
  createdAt: Date | string;
};

type RedeemResult =
  | { type: "wallet"; amountCents: number; balanceCents: number }
  | { type: "course"; courseTitle: string; courseSlug: string };

interface PaymentChannel {
  id: string;
  label: string;
  account: string;
  owner: string;
  hint?: string;
}

const REQ_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-surface2 text-muted" },
  approved: { label: "مقبول", cls: "bg-success/10 text-success" },
  rejected: { label: "مرفوض", cls: "bg-danger/10 text-danger" },
};

export function WalletOps({
  balanceCents,
  transactions = [],
}: {
  balanceCents: number;
  transactions?: WalletTxnView[];
}) {
  const router = useRouter();
  // The displayed balance is rendered by the parent <WalletCard>; this
  // component only drives charging flows and transaction history. The
  // `balanceCents` prop is read by the parent on each refresh — no local
  // state needed here.

  /* ── code redemption ── */
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── transfer request ── */
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reqAmount, setReqAmount] = useState("");
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [reqMethod, setReqMethod] = useState("");
  const [reqSender, setReqSender] = useState("");
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqDone, setReqDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load payment channels on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/payment-channels")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok && Array.isArray(json.data)) {
          setChannels(json.data);
          if (json.data.length > 0) {
            setReqMethod((prev) => prev || json.data[0].id);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function channelLabel(id: string): string {
    return channels.find((c) => c.id === id)?.label ?? id;
  }

  /* ── my requests ── */
  const [requests, setRequests] = useState<PaymentRequestView[]>([]);
  const [reqsLoaded, setReqsLoaded] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/me/payment-requests");
      const json = await res.json();
      if (json.ok) setRequests(json.data.requests);
    } catch {
      /* silent */
    } finally {
      setReqsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/me/payment-requests")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok) setRequests(json.data.requests);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReqsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function redeem() {
    const clean = code.trim().toUpperCase();
    if (clean.length < 3 || redeeming) return;
    setRedeeming(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/v1/me/codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تفعيل الكود");
        return;
      }
      setResult(json.data);
      setCode("");
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال، حاول مرة أخرى");
    } finally {
      setRedeeming(false);
    }
  }

  async function submitRequest() {
    const amount = Number(reqAmount);
    if (reqBusy) return;
    if (!Number.isFinite(amount) || amount < 50) {
      setReqError("أقل مبلغ للشحن 50 ج.م");
      return;
    }
    if (!reqFile) {
      setReqError("أرفق صورة إيصال التحويل");
      return;
    }
    setReqBusy(true);
    setReqError(null);
    try {
      const form = new FormData();
      form.set("amountEgp", String(amount));
      form.set("method", reqMethod);
      form.set("senderName", reqSender);
      form.set("screenshot", reqFile);
      const res = await fetch("/api/v1/me/payment-requests", { method: "POST", body: form });
      const json = await res.json();
      if (!json.ok) {
        setReqError(json.error?.message ?? "تعذر إرسال الطلب");
        return;
      }
      setReqDone(true);
      setReqAmount("");
      setReqSender("");
      setReqFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadRequests();
      router.refresh();
    } catch {
      setReqError("مشكلة في الاتصال، حاول مرة أخرى");
    } finally {
      setReqBusy(false);
    }
  }

  function copyChannel(id: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2 [&>*]:min-w-0">
      {/* ── charging column (mobile: order-2 / desktop: order-1) ── */}
      <div className="order-2 space-y-6 lg:order-1">
        {/* code redemption */}
        <Card className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black text-ink">
            <Ticket size={15} className="text-brand" />
            شحن بكود
          </h2>
          <Field label="كود الشحن" hint="أدخل الكود الذي وصلك بعد الدفع">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void redeem();
                }}
                placeholder="DROS-XXXX-XXXX"
                dir="ltr"
                aria-label="كود الشحن"
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
                className="min-w-0 flex-1 font-mono tracking-wider"
              />
              <Button onClick={() => void redeem()} disabled={redeeming || code.trim().length < 3} className="shrink-0">
                {redeeming ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}
                تفعيل
              </Button>
            </div>
          </Field>

          {result?.type === "wallet" ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5">
              <BadgeCheck size={16} className="shrink-0 text-success" />
              <p className="text-xs font-bold text-ink">
                تم شحن {formatEGP(result.amountCents)} — رصيدك الآن{" "}
                <span className="font-mono text-success">{formatEGP(result.balanceCents)}</span>
              </p>
            </div>
          ) : null}

          {result?.type === "course" ? (
            <div className="space-y-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-3">
              <p className="flex items-center gap-2 text-xs font-bold text-ink">
                <BadgeCheck size={16} className="shrink-0 text-success" />
                تم فتح كورس «{result.courseTitle}» بالكامل
              </p>
              <Link
                href={`/dashboard/courses/${result.courseSlug}`}
                className="inline-flex items-center gap-1.5 text-xs font-black text-brand hover:underline"
              >
                <BookOpen size={13} />
                ابدأ التعلم الآن ←
              </Link>
            </div>
          ) : null}

          {error ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
              <CircleAlert size={13} className="shrink-0" />
              {error}
            </p>
          ) : null}

          <p className="text-[11px] leading-5 text-muted">
            الكود يوصلك داخل الإشعارات بعد تأكيد الإدارة للتحويل — أكواد الرصيد تُضاف فورًا، وأكواد الاكسس تفتح الكورس
            كامل.
          </p>
        </Card>

        {/* transfer request */}
        <Card className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black text-ink">
            <ReceiptText size={15} className="text-brand" />
            شحن بالتحويل (إنستاباي / محافظ رقمية)
          </h2>

          <ul className="space-y-1.5">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface2/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink">{ch.label}</p>
                  <p className="font-mono text-[11px] text-muted" dir="ltr">
                    {ch.account}
                    {ch.owner ? ` — ${ch.owner}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyChannel(ch.id, ch.account)}
                  aria-label={`نسخ رقم ${ch.label}`}
                  className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {copiedId === ch.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </li>
            ))}
          </ul>

          {reqDone ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5">
              <BadgeCheck size={16} className="shrink-0 text-success" />
              <p className="text-xs font-bold text-ink">
                وصل طلبك — هيتم مراجعة الإيصال وإرسال الكود في الإشعارات.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 rounded-xl bg-surface2/40 p-3">
              <p className="text-[11px] font-bold text-ink">حوّل المبلغ على أحد الأرقام ثم أرسل الإيصال:</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={50}
                  placeholder="المبلغ ج.م"
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  aria-label="مبلغ التحويل"
                />
                <Select value={reqMethod} onChange={(e) => setReqMethod(e.target.value)} aria-label="طريقة التحويل">
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                placeholder="اسم مُحوّل المبلغ (اختياري)"
                value={reqSender}
                onChange={(e) => setReqSender(e.target.value)}
                maxLength={120}
                aria-label="اسم المحوّل"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  setReqFile(e.target.files?.[0] ?? null);
                  setReqError(null);
                }}
                className="block w-full cursor-pointer rounded-xl border border-line bg-surface text-xs text-muted file:me-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-brand-strong"
                aria-label="صورة إيصال التحويل"
              />
              {reqFile ? (
                <p className="truncate font-mono text-[10px] text-muted" dir="ltr">
                  {reqFile.name}
                </p>
              ) : null}
              <Button onClick={() => void submitRequest()} disabled={reqBusy} className="w-full">
                {reqBusy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                إرسال الطلب مع الإيصال
              </Button>
            </div>
          )}
          {reqError ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
              <CircleAlert size={13} className="shrink-0" />
              {reqError}
            </p>
          ) : null}
        </Card>
      </div>

      {/* ── status column (mobile: order-1 / desktop: order-2) ── */}
      <div className="order-1 space-y-6 lg:order-2">
        {/* my requests */}
        <Card className="space-y-3 p-5">
          <h2 className="text-sm font-black text-ink">طلبات الشحن</h2>
          {!reqsLoaded ? (
            <p className="py-4 text-center text-xs font-semibold text-muted">جارِ التحميل…</p>
          ) : requests.length === 0 ? (
            <p className="py-4 text-center text-xs font-semibold text-muted">لا توجد طلبات بعد.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => {
                const st = REQ_STATUS[r.status] ?? REQ_STATUS.pending;
                return (
                  <li key={r.id} className="space-y-1 rounded-xl border border-line/60 px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink">
                        {formatEGP(r.amountEgp * 100)} · {channelLabel(r.method)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                    </div>
                    {r.status === "approved" && r.issuedCode ? (
                      <p className="select-all font-mono text-[11px] font-bold text-brand" dir="ltr">
                        {r.issuedCode}
                      </p>
                    ) : null}
                    {r.status === "rejected" && r.adminNote ? (
                      <p className="text-[11px] text-muted">السبب: {r.adminNote}</p>
                    ) : null}
                    <p className="font-mono text-[10px] text-muted/70">{timeAgo(r.createdAt)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ledger */}
        <Card className="space-y-3 p-5">
          <h2 className="text-sm font-black text-ink">آخر الحركات</h2>
          {transactions.length === 0 ? (
            <p className="py-4 text-center text-xs font-semibold text-muted">لا توجد حركات بعد.</p>
          ) : (
            <ul className="divide-y divide-line">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">{TXN_KIND_LABELS[t.kind] ?? t.kind}</p>
                    <p className="truncate font-mono text-[10px] text-muted">{timeAgo(t.createdAt)}</p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs font-bold ${t.amountCents >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {t.amountCents >= 0 ? "+" : "−"}
                    {formatEGP(Math.abs(t.amountCents))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
