"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  CheckCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  FileText,
  GraduationCap,
  HelpCircle,
  Hourglass,
  Image as ImageIcon,
  ImagePlus,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  PlusCircle,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Ticket,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "./ui";
import { CATEGORIES, findSubFeature, type CategoryId } from "./admin/nav-config";
import { useAdminNav } from "./admin/admin-nav-context";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { formatDate, formatEGP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminTable, TablePrefsProvider, type Column, type Density } from "./admin/data-table";
import { ToastViewport, useToasts } from "./admin/toast";
import { ConfirmDialog, type ConfirmRequest } from "./admin/confirm-dialog";
import { CommandPalette, useCommandPalette, type PaletteCommand } from "./admin/command-palette";
import { StudentProfileModal } from "./admin/student-profile";
import {
  ExpiryBadge,
  Highlight,
  KpiCard,
  SectionHeader,
  actionLabel,
  expiryState,
  relativeTime,
  statusLabel,
  statusTone,
} from "./admin/primitives";
import type {
  AttemptRow,
  CouponRow,
  CourseFileRow,
  CourseRow,
  ExamRow,
  InvoiceRow,
  LessonRow,
  OrderRow,
  Overview,
  PostRow,
  QuestionRow,
  StageRow,
  SubscriptionRow,
  UserRow,
  VideoRow,
} from "./admin/types";

/* ── Arabic UTF-8 CSV exporter utility ── */
function downloadCSV(filename: string, rows: Record<string, unknown>[], headers: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;
  const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const yesNo = (b: boolean) => (b ? "نعم" : "لا");

/* ── Quick filter chips with live counts ── */
function FilterChips({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-brand bg-brand/10 text-brand"
                : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink"
            )}
          >
            {opt.label}
            {typeof opt.count === "number" && (
              <span className={cn("ms-1.5 tabular-nums", active ? "text-brand" : "opacity-60")}>({opt.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Date range inputs (from / to) ── */
function DateRangeInputs({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  const hasValue = Boolean(from || to);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        aria-label="من تاريخ"
        className="h-9 cursor-pointer rounded-xl border border-line bg-surface px-2.5 text-xs tabular-nums text-ink outline-none transition-colors focus:border-brand"
      />
      <span className="text-xs text-muted">→</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="إلى تاريخ"
        className="h-9 cursor-pointer rounded-xl border border-line bg-surface px-2.5 text-xs tabular-nums text-ink outline-none transition-colors focus:border-brand"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange({ from: "", to: "" })}
          className="cursor-pointer rounded-lg border border-line px-2 py-1.5 text-[11px] text-muted transition-colors hover:text-ink"
        >
          مسح
        </button>
      )}
    </div>
  );
}

/** Local state that re-syncs from server props whenever the server sends
 * fresh data (after router.refresh()) — using the official
 * "adjust state during render" pattern instead of an effect. */
function useSyncedState<T>(incoming: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(incoming);
  const [prevIncoming, setPrevIncoming] = useState(incoming);
  if (prevIncoming !== incoming) {
    setPrevIncoming(incoming);
    setValue(incoming);
  }
  return [value, setValue];
}

/* ── Bulk questions text parser ──
   Expected block format:
     1. نص السؤال
     خيار أول
     خيار ثانٍ
     الإجابة: 2
*/
export function parseBulkQuestions(text: string): {
  questions: { prompt: string; options: string[]; correctIndex: number }[];
  errors: string[];
} {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const questions: { prompt: string; options: string[]; correctIndex: number }[] = [];
  const errors: string[] = [];

  blocks.forEach((block, i) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 3) {
      errors.push(`السؤال ${i + 1}: أسطر غير كافية — يلزم سؤال + خيارين على الأقل + سطر الإجابة`);
      return;
    }
    const prompt = lines[0].replace(/^\d+\s*[.)\-،]\s*/, "").trim();
    let correctIndex = -1;
    const options: string[] = [];
    for (let j = 1; j < lines.length; j++) {
      const answerMatch = lines[j].match(/^(?:الإجابة|الاجابة|الإجابه|answer)\s*[:\-]?\s*(\d+)\s*$/i);
      if (answerMatch) {
        correctIndex = parseInt(answerMatch[1], 10) - 1;
        continue;
      }
      options.push(lines[j].replace(/^[-•*]\s*/, ""));
    }
    if (correctIndex < 0) {
      errors.push(`السؤال ${i + 1}: لم يُعثر على سطر «الإجابة: رقم»`);
      return;
    }
    if (options.length < 2) {
      errors.push(`السؤال ${i + 1}: عدد الخيارات أقل من اثنين`);
      return;
    }
    if (correctIndex >= options.length) {
      errors.push(`السؤال ${i + 1}: رقم الإجابة (${correctIndex + 1}) أكبر من عدد الخيارات`);
      return;
    }
    questions.push({ prompt, options, correctIndex });
  });

  return { questions, errors };
}

/* ── Monthly revenue chart (pure CSS bars, RTL-native) ── */
function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">لا توجد بيانات إيرادات بعد.</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-muted" dir="ltr">
            {d.month}
          </span>
          <div className="h-7 flex-1 overflow-hidden rounded-lg bg-surface2">
            <div
              className="h-full rounded-lg bg-[linear-gradient(270deg,var(--brand),var(--brand-strong))]"
              style={{ width: `${Math.max(4, (d.total / max) * 100)}%` }}
              role="meter"
              aria-valuenow={d.total}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-label={`إيرادات ${d.month}`}
            />
          </div>
          <span className="w-24 shrink-0 text-end text-xs font-semibold tabular-nums text-ink">
            {formatEGP(d.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AdminConsole({
  actor,
  canManageUsers,
  overview,
  courses,
  users,
  coupons,
  orders,
  grades,
  subjects,
  exams,
  attempts,
  videos,
  lessons,
  courseFiles,
  questions,
  subscriptions,
  invoices,
  communityPosts,
  stages,
}: {
  actor: { name: string; role: Role };
  canManageUsers: boolean;
  overview: Overview;
  courses: CourseRow[];
  users: UserRow[];
  coupons: CouponRow[];
  orders: OrderRow[];
  grades: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  exams: ExamRow[];
  attempts: AttemptRow[];
  videos: VideoRow[];
  lessons: LessonRow[];
  courseFiles: CourseFileRow[];
  questions: QuestionRow[];
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
  communityPosts: PostRow[];
  stages: StageRow[];
}) {
  const router = useRouter();
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  /* Server data mirrored locally for optimistic updates; re-synced whenever
     the server responds with fresh props after router.refresh(). */
  const [localCourses, setLocalCourses] = useSyncedState(courses);
  const [localUsers, setLocalUsers] = useSyncedState(users);
  const [localExams, setLocalExams] = useSyncedState(exams);
  const [localCoupons, setLocalCoupons] = useSyncedState(coupons);
  const [localSubscriptions, setLocalSubscriptions] = useSyncedState(subscriptions);
  const [localStages, setLocalStages] = useSyncedState(stages);
  const [localLessons, setLocalLessons] = useSyncedState(lessons);

  /* Navigation — state lives in AdminNavProvider so the sidebar, topbar and
     palette all share it (and the URL mirrors the active view). */
  const {
    category: activeCategory,
    setCategory: setActiveCategory,
    subFeature: activeSubFeature,
    setSubFeature: setActiveSubFeature,
    setBadges,
  } = useAdminNav();
  const [globalSearch, setGlobalSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);

  /* Filters */
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [courseStatusFilter, setCourseStatusFilter] = useState("all");
  const [examModeFilter, setExamModeFilter] = useState("all");
  const [questionTopicFilter, setQuestionTopicFilter] = useState("all");
  const [orderStatusChip, setOrderStatusChip] = useState("all");
  const [couponChip, setCouponChip] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ── Feature: persisted table preferences (density + page size) ── */
  const [density, setDensity] = useState<Density>("comfortable");
  const [pageSize, setPageSize] = useState(25);

  /* ── Feature: auto-refresh + last-updated indicator ── */
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());

  /* ── Feature: bulk user selection ── */
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  /* ── Feature: student 360° profile ── */
  const [profileUser, setProfileUser] = useState<UserRow | null>(null);

  /* ── Feature: inline course price edit ── */
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);

  /* Load persisted preferences after mount (avoids SSR hydration mismatch) */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const savedDensity = localStorage.getItem("admin-density");
        if (savedDensity === "compact" || savedDensity === "comfortable") setDensity(savedDensity);
        const savedSize = Number(localStorage.getItem("admin-page-size"));
        if ([25, 50, 100].includes(savedSize)) setPageSize(savedSize);
        setAutoRefresh(localStorage.getItem("admin-auto-refresh") === "1");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function changeDensity(next: Density) {
    setDensity(next);
    try { localStorage.setItem("admin-density", next); } catch {}
  }
  function changePageSize(next: number) {
    setPageSize(next);
    try { localStorage.setItem("admin-page-size", String(next)); } catch {}
  }
  function toggleAutoRefresh() {
    setAutoRefresh((prev) => {
      const next = !prev;
      try { localStorage.setItem("admin-auto-refresh", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  /* Auto-refresh loop (live monitoring) */
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      router.refresh();
      setLastRefreshed(new Date());
    }, 30000);
    return () => window.clearInterval(id);
  }, [autoRefresh, router]);

  function refreshNow() {
    router.refresh();
    setLastRefreshed(new Date());
    pushToast("info", "تم تحديث البيانات من السيرفر.");
  }

  /* ── Feature: search helpers ── */
  function copyText(text: string, label = "تم النسخ إلى الحافظة") {
    navigator.clipboard.writeText(text);
    pushToast("info", label);
  }
  const hl = (text: string) => <Highlight text={text} query={globalSearch} />;

  function inDateRange(iso: string): boolean {
    if (dateFrom && new Date(iso) < new Date(`${dateFrom}T00:00:00`)) return false;
    if (dateTo && new Date(iso) > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  }

  /* Modals */
  const [walletModalUser, setWalletModalUser] = useState<UserRow | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("50");
  const [walletAdjustReason, setWalletAdjustReason] = useState("مكافأة تميز في الامتحان");
  const [printVouchersModal, setPrintVouchersModal] = useState<string[] | null>(null);

  /* Code generator */
  const [codePrefix, setCodePrefix] = useState("MATH");
  const [codeCount, setCodeCount] = useState("10");
  const [codePercent, setCodePercent] = useState("100");
  const [codeMaxUses, setCodeMaxUses] = useState("1");
  const [codeDaysValid, setCodeDaysValid] = useState("30");
  const [codeKind, setCodeKind] = useState<"course_access" | "wallet_balance" | "course_percent">("course_access");
  const [codeCourseId, setCodeCourseId] = useState(courses[0]?.id || "");
  const [codeAmount, setCodeAmount] = useState("150");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  /* Payment requests review (transfer screenshots → issue code) */
  type PaymentRequestRow = {
    id: string;
    amountEgp: number;
    method: string;
    senderName: string;
    screenshotKey: string;
    status: string;
    adminNote: string;
    issuedCode: string | null;
    createdAt: string;
    studentName: string;
    studentPhone: string | null;
    studentEmail: string;
  };
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRow[]>([]);
  const [prLoaded, setPrLoaded] = useState(false);
  const [prFilter, setPrFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [prBusyId, setPrBusyId] = useState<string | null>(null);
  const [prIssueKind, setPrIssueKind] = useState<Record<string, "wallet_balance" | "course_access">>({});
  const [prIssueAmount, setPrIssueAmount] = useState<Record<string, string>>({});
  const [prIssueCourse, setPrIssueCourse] = useState<Record<string, string>>({});
  const [prCopiedId, setPrCopiedId] = useState<string | null>(null);
  const [prRejectOpen, setPrRejectOpen] = useState<string | null>(null);
  const [prRejectNote, setPrRejectNote] = useState("");

  /* ── Live sidebar badges (pending work counters) + per-view document title ── */
  const viewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pendingPosts = communityPosts.filter((p) => (p.status || "approved") === "pending").length;
    const activeCoupons = localCoupons.filter(
      (c) => c.isActive && !(c.maxUses > 0 && c.usedCount >= c.maxUses)
    ).length;
    const activeSubs = localSubscriptions.filter((s) => s.status === "active").length;
    setBadges({
      forum_pending_topics: pendingPosts,
      codes_table: activeCoupons,
      subscriptions_table: activeSubs,
      payment_requests: paymentRequests.filter((r) => r.status === "pending").length,
      orders_table: orders.filter((o) => o.status === "pending").length,
    });
  }, [communityPosts, localCoupons, localSubscriptions, paymentRequests, orders, setBadges]);

  useEffect(() => {
    const el = viewRef.current;
    if (el) {
      el.classList.remove("view-enter");
      void el.offsetWidth;
      el.classList.add("view-enter");
    }
    document.title = `${
      findSubFeature(activeSubFeature)?.sub.label ?? "لوحة الإدارة"
    } · لوحة الإدارة | دروس ماث`;
  }, [activeCategory, activeSubFeature]);

  /* Manual payment */
  const [mpStudentEmail, setMpStudentEmail] = useState("");
  const [mpCourseId, setMpCourseId] = useState(courses[0]?.id || "");
  const [mpAmount, setMpAmount] = useState(courses[0] ? String(courses[0].priceCents / 100) : "200");
  const [mpMethod, setMpMethod] = useState<"vodafone_cash" | "instapay" | "center_cash">("center_cash");

  /* Course creation */
  const [cTitle, setCTitle] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cGrade, setCGrade] = useState(grades[0]?.id || "");
  const [cSubject, setCSubject] = useState(subjects[0]?.id || "");
  const [cPrice, setCPrice] = useState("250");
  const [cSummary, setCSummary] = useState("");
  const [cCover, setCCover] = useState("");
  const [cSequential, setCSequential] = useState(false);

  /* Course cover quick-edit modal */
  const [coverModal, setCoverModal] = useState<{ course: CourseRow; url: string } | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  /* Course content management dialog (videos manager) */
  const [contentCourseId, setContentCourseId] = useState<string | null>(null);

  /* Question creator */
  const [qSubjectId, setQSubjectId] = useState(subjects[0]?.id || "");
  const [qTopic, setQTopic] = useState("الهندسة والتحليل");
  const [qPrompt, setQPrompt] = useState("");
  const [qOpt1, setQOpt1] = useState("");
  const [qOpt2, setQOpt2] = useState("");
  const [qOpt3, setQOpt3] = useState("");
  const [qOpt4, setQOpt4] = useState("");
  const [qCorrectIdx, setQCorrectIdx] = useState("0");
  const [qExplanation, setQExplanation] = useState("");

  /* Bulk questions */
  const [bulkText, setBulkText] = useState("");
  const [bulkSubjectId, setBulkSubjectId] = useState(subjects[0]?.id || "");
  const [bulkTopic, setBulkTopic] = useState("عام");
  const [bulkResult, setBulkResult] = useState<{ added: number; total: number; errors: string[] } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  /* Add student */
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentPass, setNewStudentPass] = useState("12345678");

  /* Broadcast */
  const [smsTarget, setSmsTarget] = useState<"all" | "students" | "parents" | "centers" | "specific_students" | "course_students">("students");
  const setSmsTargetTyped = (val: string) => setSmsTarget(val as "all" | "students" | "parents" | "centers" | "specific_students" | "course_students");
  const [smsTitle, setSmsTitle] = useState("");
  const [smsText, setSmsText] = useState("");
  const [smsStudentIds, setSmsStudentIds] = useState("");
  const [smsStudentEmails, setSmsStudentEmails] = useState("");
  const [smsCourseId, setSmsCourseId] = useState("");

  /* Exam creator */
  const [examTitle, setExamTitle] = useState("");
  const [examCourseId, setExamCourseId] = useState(courses[0]?.id || "");
  const [examDuration, setExamDuration] = useState("60");
  const [examMode, setExamMode] = useState<"practice" | "graded">("graded");
  const [examIsPublished, setExamIsPublished] = useState(true);

  /* New stage form */
  const [stageName, setStageName] = useState("");
  const [stageSlug, setStageSlug] = useState("");
  const [stageOrder, setStageOrder] = useState("0");

  /* ── Helpers ── */
  function markPending(key: string) {
    setPendingIds((prev) => new Set(prev).add(key));
  }
  function unmarkPending(key: string) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  /** API caller: returns response data on success (and re-syncs from server),
   * or null on failure (error toast already shown unless silent). */
  async function api(path: string, init?: RequestInit, opts?: { silent?: boolean; noRefresh?: boolean }): Promise<any | null> {
    setBusy(true);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json();
      if (!json.ok) {
        if (!opts?.silent) pushToast("err", json.error?.message ?? "فشلت العملية");
        return null;
      }
      if (!opts?.noRefresh) router.refresh();
      return json.data ?? true;
    } catch {
      if (!opts?.silent) pushToast("err", "مشكلة في الاتصال بالسيرفر");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function selectSubFeature(catId: CategoryId, subId: string) {
    setActiveCategory(catId);
    setActiveSubFeature(subId);
  }

  /* ── Payment requests review ── */
  const loadPaymentRequests = useCallback(async () => {
    try {
      const data = await api("/api/v1/admin/payment-requests", {}, { silent: true, noRefresh: true });
      if (data && data.requests) setPaymentRequests(data.requests);
    } catch {
      /* handled by api() */
    } finally {
      setPrLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeCategory !== "billing_codes" || activeSubFeature !== "payment_requests") return;
    let cancelled = false;
    fetch("/api/v1/admin/payment-requests")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok && json.data?.requests) setPaymentRequests(json.data.requests);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPrLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSubFeature]);

  async function handleIssueRequestCode(id: string) {
    const kind = prIssueKind[id] ?? "wallet_balance";
    const body =
      kind === "wallet_balance"
        ? { kind, amountEgp: Number(prIssueAmount[id] || 0) }
        : { kind, courseId: prIssueCourse[id] || undefined };
    if (kind === "wallet_balance" && (!body.amountEgp || (body.amountEgp ?? 0) <= 0)) {
      pushToast("err", "حدد مبلغ الرصيد");
      return;
    }
    if (kind === "course_access" && !body.courseId) {
      pushToast("err", "حدد الكورس");
      return;
    }
    setPrBusyId(id);
    const data = await api(`/api/v1/admin/payment-requests/${id}/issue`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setPrBusyId(null);
    if (data && data.code) {
      void navigator.clipboard.writeText(data.code);
      setPrCopiedId(id);
      setTimeout(() => setPrCopiedId(null), 2500);
      pushToast("ok", `تم إصدار الكود ${data.code} وإرساله للطالب عبر الإشعارات (منسوخ للحافظة)`);
      await loadPaymentRequests();
    }
  }

  async function handleRejectRequest(id: string) {
    setPrBusyId(id);
    const data = await api(`/api/v1/admin/payment-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note: prRejectNote }),
    });
    setPrBusyId(null);
    if (data) {
      pushToast("ok", "تم رفض الطلب وإشعار الطالب");
      setPrRejectOpen(null);
      setPrRejectNote("");
      await loadPaymentRequests();
    }
  }

  /* ── Handlers ── */
  async function handleBatchGenerateCodes(e: FormEvent) {
    e.preventDefault();
    const data = await api("/api/v1/admin/coupons/batch", {
      method: "POST",
      body: JSON.stringify({
        prefix: codePrefix,
        count: Math.min(100, Math.max(1, Number(codeCount) || 10)),
        percentOff: Number(codePercent) || 100,
        maxUses: Number(codeMaxUses) || 1,
        daysValid: Number(codeDaysValid) || 30,
        kind: codeKind,
        amountEgp: codeKind === "wallet_balance" ? Number(codeAmount) || undefined : undefined,
        courseId: codeKind === "course_access" ? codeCourseId || undefined : undefined,
      }),
    });
    if (data) {
      setGeneratedCodes(data.codes || []);
      pushToast("ok", data.message ?? "تم توليد الأكواد وحفظها بنجاح");
      if (data.coupons) {
        setLocalCoupons((prev) => [
          ...data.coupons.map((c: any) => ({
            id: c.id,
            code: c.code,
            percentOff: Number(codePercent) || 100,
            maxUses: Number(codeMaxUses) || 1,
            usedCount: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + Number(codeDaysValid) * 86400000).toISOString(),
          })),
          ...prev,
        ]);
      }
    }
  }

  function requestToggleUserStatus(u: UserRow) {
    if (u.isActive) {
      setConfirmReq({
        title: `تجميد حساب «${u.name}»؟`,
        description: "لن يستطيع الطالب تسجيل الدخول أو استخدام المنصة حتى إعادة التفعيل. يمكن التراجع في أي وقت.",
        confirmLabel: "تجميد الحساب",
        tone: "danger",
        onConfirm: () => applyUserStatus(u, false),
      });
    } else {
      applyUserStatus(u, true);
    }
  }

  async function applyUserStatus(u: UserRow, nextStatus: boolean) {
    const key = `user-${u.id}`;
    markPending(key);
    setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: nextStatus } : item)));
    const done = await api(`/api/v1/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: nextStatus }),
    });
    if (done) {
      pushToast("ok", `تم ${nextStatus ? "تفعيل" : "تجميد"} حساب «${u.name}» بنجاح.`);
    } else {
      setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: u.isActive } : item)));
    }
    unmarkPending(key);
  }

  function requestRoleChange(u: UserRow, newRole: Role) {
    if (u.role === newRole) return;
    setConfirmReq({
      title: `تغيير رتبة «${u.name}»؟`,
      description: `ستنتقل الرتبة من «${ROLE_LABELS[u.role]}» إلى «${ROLE_LABELS[newRole]}». الرتب الأعلى تمنح صلاحيات أوسع على المنصة.`,
      confirmLabel: "تغيير الرتبة",
      tone: "primary",
      onConfirm: () => applyRoleChange(u, newRole),
    });
  }

  async function applyRoleChange(u: UserRow, newRole: Role) {
    const key = `user-${u.id}`;
    markPending(key);
    setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: newRole } : item)));
    const done = await api(`/api/v1/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    if (done) {
      pushToast("ok", `تم تحديث دور «${u.name}» إلى ${ROLE_LABELS[newRole]}.`);
    } else {
      setLocalUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: u.role } : item)));
    }
    unmarkPending(key);
  }

  async function handleAdjustWallet(e: FormEvent) {
    e.preventDefault();
    if (!walletModalUser) return;
    const amount = Number(walletAdjustAmount);
    if (isNaN(amount) || amount === 0) {
      pushToast("err", "يرجى تحديد مبلغ صالح للتعديل");
      return;
    }
    const done = await api(`/api/v1/admin/users/${walletModalUser.id}/wallet`, {
      method: "POST",
      body: JSON.stringify({ amountEgp: amount, reason: walletAdjustReason }),
    });
    if (done) {
      setLocalUsers((prev) =>
        prev.map((item) =>
          item.id === walletModalUser.id
            ? { ...item, balanceCents: Math.max(0, item.balanceCents + amount * 100) }
            : item
        )
      );
      pushToast(
        "ok",
        `تم ${amount >= 0 ? "شحن" : "خصم"} ${Math.abs(amount)} ج.م لمحفظة الطالب «${walletModalUser.name}» بنجاح.`
      );
      setWalletModalUser(null);
    }
  }

  async function handleCourseStatusChange(c: CourseRow, newStatus: "draft" | "published" | "archived") {
    if (c.status === newStatus) return;
    const key = `course-${c.id}`;
    markPending(key);
    setLocalCourses((prev) => prev.map((item) => (item.id === c.id ? { ...item, status: newStatus } : item)));
    const done = await api(`/api/v1/admin/courses/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    if (done) {
      pushToast("ok", `تم تغيير حالة المقرر «${c.title}» إلى ${statusLabel(newStatus)}.`);
    } else {
      setLocalCourses((prev) => prev.map((item) => (item.id === c.id ? { ...item, status: c.status } : item)));
    }
    unmarkPending(key);
  }

  function requestDeleteCourse(c: CourseRow) {
    setConfirmReq({
      title: `حذف مقرر «${c.title}»؟`,
      description: "سيتم حذف المقرر نهائياً مع ارتباطاته. لا يمكن التراجع عن هذه العملية.",
      confirmLabel: "حذف نهائي",
      tone: "danger",
      requireText: "حذف",
      onConfirm: async () => {
        const key = `course-${c.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/courses/${c.id}/delete`, { method: "DELETE" });
        if (done) {
          setLocalCourses((prev) => prev.filter((item) => item.id !== c.id));
          pushToast("ok", `تم حذف المقرر «${c.title}» نهائياً.`);
        }
        unmarkPending(key);
      },
    });
  }

  async function handleToggleExamPublish(e: ExamRow) {
    const key = `exam-${e.id}`;
    const nextVal = !e.isPublished;
    markPending(key);
    setLocalExams((prev) => prev.map((item) => (item.id === e.id ? { ...item, isPublished: nextVal } : item)));
    const done = await api(`/api/v1/admin/exams/${e.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPublished: nextVal }),
    });
    if (done) {
      pushToast("ok", `تم ${nextVal ? "نشر" : "إخفاء"} الامتحان «${e.title}» بنجاح.`);
    } else {
      setLocalExams((prev) => prev.map((item) => (item.id === e.id ? { ...item, isPublished: e.isPublished } : item)));
    }
    unmarkPending(key);
  }

  function requestDeleteExam(ex: ExamRow) {
    setConfirmReq({
      title: `حذف امتحان «${ex.title}»؟`,
      description: "سيُحذف الامتحان ومحاولاته المرتبطة نهائياً.",
      confirmLabel: "حذف نهائي",
      tone: "danger",
      onConfirm: async () => {
        const key = `exam-${ex.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/exams/${ex.id}/delete`, { method: "DELETE" });
        if (done) {
          setLocalExams((prev) => prev.filter((item) => item.id !== ex.id));
          pushToast("ok", `تم حذف الامتحان «${ex.title}».`);
        }
        unmarkPending(key);
      },
    });
  }

  async function handleToggleCoupon(c: CouponRow) {
    const key = `coupon-${c.id}`;
    markPending(key);
    setLocalCoupons((prev) => prev.map((item) => (item.id === c.id ? { ...item, isActive: !c.isActive } : item)));
    const done = await api(`/api/v1/admin/coupons/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (done) {
      pushToast("ok", `تم ${c.isActive ? "تعطيل" : "تفعيل"} الكود «${c.code}».`);
    } else {
      setLocalCoupons((prev) => prev.map((item) => (item.id === c.id ? { ...item, isActive: c.isActive } : item)));
    }
    unmarkPending(key);
  }

  function requestDeleteCoupon(c: CouponRow) {
    setConfirmReq({
      title: `حذف الكود «${c.code}»؟`,
      description: "لن يستطيع أحد استخدام هذا الكود بعد الحذف.",
      confirmLabel: "حذف",
      tone: "danger",
      onConfirm: async () => {
        const key = `coupon-${c.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/coupons/${c.id}`, { method: "DELETE" });
        if (done) {
          setLocalCoupons((prev) => prev.filter((item) => item.id !== c.id));
          pushToast("ok", `تم حذف الكود «${c.code}».`);
        }
        unmarkPending(key);
      },
    });
  }

  function requestDeleteQuestion(q: QuestionRow) {
    setConfirmReq({
      title: "حذف هذا السؤال من البنك؟",
      description: q.prompt.slice(0, 120),
      confirmLabel: "حذف",
      tone: "danger",
      onConfirm: async () => {
        const key = `question-${q.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/questions/${q.id}`, { method: "DELETE" });
        if (done) {
          pushToast("ok", "تم حذف السؤال من البنك.");
          router.refresh();
        }
        unmarkPending(key);
      },
    });
  }

  function requestDeletePost(p: PostRow) {
    setConfirmReq({
      title: `حذف منشور «${p.authorName}»؟`,
      description: p.body.slice(0, 120),
      confirmLabel: "حذف المنشور",
      tone: "danger",
      onConfirm: async () => {
        const key = `post-${p.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/community/posts/${p.id}`, { method: "DELETE" });
        if (done) {
          pushToast("ok", "تم حذف المنشور.");
          router.refresh();
        }
        unmarkPending(key);
      },
    });
  }

  /* ── Community moderation & assistant replies ── */
  type ReplyRow = {
    id: string;
    body: string;
    mediaKind: string;
    mediaKey: string | null;
    createdAt: string;
    authorName: string;
    authorRole: string;
  };
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [postReplies, setPostReplies] = useState<Record<string, { loading: boolean; rows: ReplyRow[] }>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { body: string; mediaKind: string; file: File | null }>>({});
  const [replyBusy, setReplyBusy] = useState<Record<string, boolean>>({});

  const visiblePosts = useMemo(() => {
    if (postStatusFilter === "all") return communityPosts;
    return communityPosts.filter((p) => (p.status || "approved") === postStatusFilter);
  }, [communityPosts, postStatusFilter]);

  async function setPostStatus(p: PostRow, status: "approved" | "rejected" | "pending") {
    const key = `post-${p.id}`;
    markPending(key);
    const done = await api(`/api/v1/admin/community/posts/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, { noRefresh: true });
    unmarkPending(key);
    if (done) {
      pushToast("ok", status === "approved" ? "تم اعتماد المنشور وظاهر للطلاب." : status === "rejected" ? "تم رفض المنشور." : "أُعيد المنشور لقيد المراجعة.");
      router.refresh();
    }
  }

  async function fetchReplies(postId: string) {
    setPostReplies((prev) => ({ ...prev, [postId]: { loading: true, rows: prev[postId]?.rows ?? [] } }));
    try {
      const res = await fetch(`/api/v1/admin/community/posts/${postId}/replies`);
      const json = await res.json();
      setPostReplies((prev) => ({
        ...prev,
        [postId]: { loading: false, rows: json.ok ? json.data.replies : [] },
      }));
    } catch {
      setPostReplies((prev) => ({ ...prev, [postId]: { loading: false, rows: [] } }));
    }
  }

  function toggleReplies(postId: string) {
    if (postReplies[postId]) {
      setPostReplies((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } else {
      void fetchReplies(postId);
    }
  }

  function updateReplyDraft(postId: string, patch: Partial<{ body: string; mediaKind: string; file: File | null }>) {
    setReplyDrafts((prev) => ({
      ...prev,
      [postId]: Object.assign({ body: "", mediaKind: "none", file: null }, prev[postId], patch),
    }));
  }

  async function submitReply(p: PostRow) {
    const draft = replyDrafts[p.id];
    if (!draft || (!draft.body.trim() && draft.mediaKind === "none")) {
      pushToast("info", "اكتب رداً أو أرفق ملفاً أولاً");
      return;
    }
    if ((draft.mediaKind === "image" || draft.mediaKind === "video" || draft.mediaKind === "file") && !draft.file) {
      pushToast("err", "اختر الملف المطلوب إرفاقه");
      return;
    }
    setReplyBusy((prev) => ({ ...prev, [p.id]: true }));
    try {
      const form = new FormData();
      form.set("body", draft.body);
      form.set("mediaKind", draft.mediaKind);
      if (draft.file) form.set("media", draft.file);
      const res = await fetch(`/api/v1/admin/community/posts/${p.id}/replies`, { method: "POST", body: form });
      const json = await res.json();
      if (json.ok) {
        pushToast("ok", "تم نشر الرد على المنشور.");
        updateReplyDraft(p.id, { body: "", mediaKind: "none", file: null });
        await fetchReplies(p.id);
        router.refresh();
      } else {
        pushToast("err", json.error?.message ?? "فشل إرسال الرد");
      }
    } catch {
      pushToast("err", "مشكلة في الاتصال بالسيرفر");
    } finally {
      setReplyBusy((prev) => ({ ...prev, [p.id]: false }));
    }
  }


  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        title: cTitle,
        slug: cSlug,
        summary: cSummary,
        description: cSummary,
        gradeId: cGrade,
        subjectId: cSubject,
        priceEgp: Number(cPrice || "0"),
        coverUrl: cCover || undefined,
        requireSequential: cSequential,
      }),
    });
    if (done) {
      pushToast("ok", "تم إنشاء المقرر الدراسي بنجاح.");
      setCTitle("");
      setCSlug("");
      setCSummary("");
      setCCover("");
      setCSequential(false);
      setActiveSubFeature("courses_table");
    }
  }

  async function handleSaveCover() {
    if (!coverModal) return;
    setCoverBusy(true);
    const done = await api(`/api/v1/admin/courses/${coverModal.course.id}`, {
      method: "PATCH",
      body: JSON.stringify({ coverUrl: coverModal.url }),
    });
    setCoverBusy(false);
    if (done) {
      pushToast("ok", "تم تحديث صورة غلاف الكورس.");
      setLocalCourses((prev) =>
        prev.map((c) => (c.id === coverModal.course.id ? { ...c, coverImageUrl: coverModal.url || null } : c))
      );
      setCoverModal(null);
    }
  }

  async function handleToggleSequential(course: CourseRow) {
    const next = !course.requireSequentialProgress;
    const done = await api(`/api/v1/admin/courses/${course.id}`, {
      method: "PATCH",
      body: JSON.stringify({ requireSequential: next }),
    }, { noRefresh: true });
    if (done) {
      pushToast("ok", next
        ? "تم تفعيل التسلسل الإجباري — الطالب لن ينتقل للفيديو التالي قبل إتمام الحالي."
        : "تم تعطيل التسلسل الإجباري.");
      setLocalCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, requireSequentialProgress: next } : c))
      );
    }
  }

  /* ── Reordering (exams within a course, videos within a lesson) ── */
  async function persistReorder(entity: "videos" | "lessons" | "exams", ids: string[]) {
    const done = await api("/api/v1/admin/reorder", {
      method: "POST",
      body: JSON.stringify({ entity, ids }),
    }, { noRefresh: true, silent: true });
    if (!done) pushToast("err", "فشل حفظ الترتيب الجديد");
    return Boolean(done);
  }

  async function moveExam(exam: ExamRow, dir: -1 | 1) {
    const siblings = localExams
      .filter((e) => e.courseSlug === exam.courseSlug)
      .sort((a, b) => a.sortOrder - b.sortOrder || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const idx = siblings.findIndex((e) => e.id === exam.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
    const next = [...siblings];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setLocalExams((prev) =>
      prev.map((e) => {
        const pos = next.findIndex((n) => n.id === e.id);
        return pos >= 0 ? { ...e, sortOrder: pos + 1 } : e;
      })
    );
    if (await persistReorder("exams", next.map((e) => e.id))) pushToast("ok", "تم تحديث ترتيب الامتحانات.");
  }

  async function moveVideo(video: VideoRow, dir: -1 | 1) {
    const siblings = videos.filter((v) => v.lessonId === video.lessonId);
    const idx = siblings.findIndex((v) => v.id === video.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
    const next = [...siblings];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    if (await persistReorder("videos", next.map((v) => v.id))) {
      pushToast("ok", "تم تحديث ترتيب المحاضرات.");
      router.refresh();
    }
  }

  async function moveLesson(lesson: LessonRow, dir: -1 | 1) {
    const siblings = localLessons
      .filter((l) => l.courseId === lesson.courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((l) => l.id === lesson.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
    const next = [...siblings];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setLocalLessons((prev) =>
      prev.map((l) => {
        const pos = next.findIndex((n) => n.id === l.id);
        return pos >= 0 ? { ...l, sortOrder: pos + 1 } : l;
      })
    );
    if (await persistReorder("lessons", next.map((l) => l.id))) pushToast("ok", "تم تحديث ترتيب الدروس.");
  }

  /* ── Per-video view limit ── */
  const [maxViewsDraft, setMaxViewsDraft] = useState<Record<string, string>>({});

  /* ── Advanced users search ── */
  const [advQuery, setAdvQuery] = useState("");
  const [advCourse, setAdvCourse] = useState("all");
  const [advRole, setAdvRole] = useState("all");
  const [advStatus, setAdvStatus] = useState("all");
  const [advFrom, setAdvFrom] = useState("");
  const [advTo, setAdvTo] = useState("");

  const filteredAdvancedUsers = useMemo(() => {
    const q = advQuery.trim().toLowerCase();
    return localUsers.filter((u) => {
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.phone ?? "").toLowerCase().includes(q)
      )
        return false;
      if (advRole !== "all" && u.role !== advRole) return false;
      if (advStatus === "active" && !u.isActive) return false;
      if (advStatus === "frozen" && u.isActive) return false;
      if (advCourse !== "all" && !(Array.isArray(u.enrolledCourseIds) && u.enrolledCourseIds.includes(advCourse)))
        return false;
      if (advFrom && new Date(u.createdAt) < new Date(`${advFrom}T00:00:00`)) return false;
      if (advTo && new Date(u.createdAt) > new Date(`${advTo}T23:59:59`)) return false;
      return true;
    });
  }, [localUsers, advQuery, advRole, advStatus, advCourse, advFrom, advTo]);

  async function saveMaxViews(video: VideoRow) {
    const raw = (maxViewsDraft[video.id] ?? "").trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (!Number.isFinite(value) || value < 1)) {
      pushToast("err", "أدخل عدداً صحيحاً للمشاهدات أو اتركه فارغاً لغير محدود");
      return;
    }
    const done = await api(`/api/v1/admin/videos/${video.id}`, {
      method: "PATCH",
      body: JSON.stringify({ maxViews: value }),
    }, { noRefresh: true, silent: true });
    if (done === null) {
      pushToast("err", "فشل تحديث عدد المشاهدات");
      return;
    }
    pushToast("ok", value == null ? "المشاهدات غير محدودة لهذا الفيديو." : `تم تحديد ${value} مشاهدات كحد أقصى.`);
    router.refresh();
  }

  /* ── Inline rename (lesson / video) inside the course content dialog ── */
  type RenameTarget =
    | { kind: "lesson"; id: string; title: string }
    | { kind: "video"; id: string; title: string; youtubeId: string };
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameBusy, setRenameBusy] = useState(false);

  function updateRename(fields: Partial<RenameTarget>) {
    setRenameTarget((prev) => (prev ? ({ ...prev, ...fields } as RenameTarget) : prev));
  }

  async function saveRename() {
    if (!renameTarget) return;
    const title = renameTarget.title.trim();
    if (title.length < 2) {
      pushToast("err", "العنوان قصير جداً");
      return;
    }
    setRenameBusy(true);
    let okDone = false;
    if (renameTarget.kind === "lesson") {
      okDone = await api(`/api/v1/admin/lessons/${renameTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }, { noRefresh: true, silent: true }) !== null;
      if (okDone) {
        setLocalLessons((prev) => prev.map((l) => (l.id === renameTarget.id ? { ...l, title } : l)));
      }
    } else {
      const ytId = renameTarget.youtubeId.trim();
      if (!/^[A-Za-z0-9_-]{8,24}$/.test(ytId)) {
        setRenameBusy(false);
        pushToast("err", "معرف يوتيوب غير صالح");
        return;
      }
      okDone = await api(`/api/v1/admin/videos/${renameTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, youtubeId: ytId }),
      }, { noRefresh: true, silent: true }) !== null;
    }
    setRenameBusy(false);
    if (!okDone) {
      pushToast("err", "فشل حفظ التعديل — تأكد من تسجيل الدخول بصلاحيات المشرف");
      return;
    }
    pushToast("ok", "تم حفظ التعديل بنجاح.");
    setRenameTarget(null);
    router.refresh();
  }

  async function handleAddStudent(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/users/create-student", {
      method: "POST",
      body: JSON.stringify({
        name: newStudentName,
        email: newStudentEmail,
        password: newStudentPass,
        phone: newStudentPhone,
      }),
    });
    if (done) {
      pushToast("ok", `تم تسجيل حساب الطالب «${newStudentName}» بنجاح.`);
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPhone("");
      setActiveSubFeature("users_table");
    }
  }

  async function handleCreateExam(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/exams", {
      method: "POST",
      body: JSON.stringify({
        title: examTitle,
        courseId: examCourseId,
        durationMin: Number(examDuration) || 60,
        mode: examMode,
        isPublished: examIsPublished,
      }),
    });
    if (done) {
      pushToast("ok", `تم إنشاء الامتحان «${examTitle}» بنجاح.`);
      setExamTitle("");
      setActiveSubFeature("exams_table");
    }
  }

  async function handleCreateQuestion(e: FormEvent) {
    e.preventDefault();
    const options = [qOpt1, qOpt2, qOpt3, qOpt4].map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      pushToast("err", "يجب إدخال خيارين على الأقل للسؤال.");
      return;
    }
    const done = await api("/api/v1/admin/questions", {
      method: "POST",
      body: JSON.stringify({
        subjectId: qSubjectId,
        topic: qTopic || "عام",
        prompt: qPrompt,
        options: [qOpt1, qOpt2, qOpt3, qOpt4],
        correctIndex: Number(qCorrectIdx) || 0,
        explanation: qExplanation || "",
        marks: 1,
        difficulty: 2,
      }),
    });
    if (done) {
      pushToast("ok", "تمت إضافة السؤال بنجاح إلى بنك الأسئلة.");
      setQPrompt("");
      setQOpt1("");
      setQOpt2("");
      setQOpt3("");
      setQOpt4("");
      setQExplanation("");
      setActiveSubFeature("questions_table");
    }
  }

  async function handleManualEnroll(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/billing/manual-enroll", {
      method: "POST",
      body: JSON.stringify({
        studentEmail: mpStudentEmail,
        courseId: mpCourseId,
        method: mpMethod,
        amountEgp: Number(mpAmount) || 0,
      }),
    });
    if (done) {
      pushToast("ok", `تم تفعيل اشتراك الطالب (${mpStudentEmail}) بنجاح وإصدار الفاتورة.`);
      setMpStudentEmail("");
      setActiveSubFeature("subscriptions_table");
    }
  }

  async function handleSendBroadcast(e: FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { target: smsTarget, title: smsTitle, body: smsText };
    if (smsTarget === "specific_students") {
      if (smsStudentIds.trim()) body.studentIds = smsStudentIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (smsStudentEmails.trim()) body.studentEmails = smsStudentEmails.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (smsTarget === "course_students") {
      if (!smsCourseId) { pushToast("err", "اختر الكورس أولاً"); return; }
      body.courseId = smsCourseId;
    }
    const data = await api("/api/v1/admin/communications/broadcast", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (data) {
      pushToast("ok", data.message ?? "تم إرسال التنبيه بنجاح.");
      setSmsTitle("");
      setSmsText("");
      setSmsStudentIds("");
      setSmsStudentEmails("");
      setSmsCourseId("");
    }
  }

  async function handleBulkImport() {
    const { questions: parsed, errors } = parseBulkQuestions(bulkText);
    if (parsed.length === 0) {
      setBulkResult({ added: 0, total: 0, errors });
      pushToast("err", "لم يُعثر على أي سؤال صالح في النص المُلصق.");
      return;
    }
    setBulkBusy(true);
    setBulkResult(null);
    let added = 0;
    const failErrors: string[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      const done = await api(
        "/api/v1/admin/questions",
        {
          method: "POST",
          body: JSON.stringify({
            subjectId: bulkSubjectId,
            topic: bulkTopic || "عام",
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: "",
            marks: 1,
            difficulty: 2,
          }),
        },
        { silent: true, noRefresh: true }
      );
      if (done) added++;
      else failErrors.push(`السؤال ${i + 1}: ${q.prompt.slice(0, 60)}…`);
    }
    setBulkBusy(false);
    setBulkResult({ added, total: parsed.length, errors: [...errors, ...failErrors] });
    if (added > 0) {
      pushToast("ok", `تم إدراج ${added} من ${parsed.length} سؤالاً في البنك.`);
      router.refresh();
      if (added === parsed.length) setBulkText("");
    } else {
      pushToast("err", "فشل إدراج جميع الأسئلة — راجع التفاصيل أسفل النموذج.");
    }
  }

  async function handleAddStage(e: FormEvent) {
    e.preventDefault();
    const data = await api("/api/v1/admin/stages", {
      method: "POST",
      body: JSON.stringify({ name: stageName, slug: stageSlug || undefined, sortOrder: Number(stageOrder) || 0 }),
    });
    if (data) {
      setLocalStages((prev) => [...prev, { id: data.id, name: data.name, slug: data.slug, sortOrder: data.sortOrder }]);
      pushToast("ok", `تمت إضافة المرحلة «${data.name}» بنجاح.`);
      setStageName("");
      setStageSlug("");
      setStageOrder("0");
    }
  }

  async function handleUpdateStage(stage: StageRow, patch: { name?: string; sortOrder?: number }) {
    const key = `stage-${stage.id}`;
    markPending(key);
    const done = await api(`/api/v1/admin/stages/${stage.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (done) {
      setLocalStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, ...patch } : s)));
      pushToast("ok", "تم تحديث المرحلة.");
    }
    unmarkPending(key);
  }

  function requestDeleteStage(stage: StageRow) {
    setConfirmReq({
      title: `حذف مرحلة «${stage.name}»؟`,
      description: "قد تؤثر على تصنيف الصفوف المرتبطة بها.",
      confirmLabel: "حذف",
      tone: "danger",
      onConfirm: async () => {
        const key = `stage-${stage.id}`;
        markPending(key);
        const done = await api(`/api/v1/admin/stages/${stage.id}`, { method: "DELETE" });
        if (done) {
          setLocalStages((prev) => prev.filter((s) => s.id !== stage.id));
          pushToast("ok", `تم حذف المرحلة «${stage.name}».`);
        }
        unmarkPending(key);
      },
    });
  }

  function printVouchers() {
    document.body.classList.add("printing-voucher");
    window.print();
    document.body.classList.remove("printing-voucher");
  }

  /* ── Derived data ── */
  const filteredUsers = useMemo(() => {
    return localUsers.filter((u) => {
      const matchSearch =
        !globalSearch ||
        u.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(globalSearch.toLowerCase());
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === "all" ||
        (userStatusFilter === "active" && u.isActive) ||
        (userStatusFilter === "inactive" && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [localUsers, globalSearch, userRoleFilter, userStatusFilter]);

  const filteredCourses = useMemo(() => {
    return localCourses.filter((c) => {
      const matchSearch =
        !globalSearch ||
        c.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.gradeName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.subjectName.toLowerCase().includes(globalSearch.toLowerCase());
      const matchStatus = courseStatusFilter === "all" || c.status === courseStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [localCourses, globalSearch, courseStatusFilter]);

  const filteredExams = useMemo(() => {
    return localExams.filter((e) => {
      const matchSearch =
        !globalSearch ||
        e.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        e.courseTitle.toLowerCase().includes(globalSearch.toLowerCase());
      const matchMode = examModeFilter === "all" || e.mode === examModeFilter;
      return matchSearch && matchMode;
    });
  }, [localExams, globalSearch, examModeFilter]);

  const questionTopics = useMemo(() => Array.from(new Set(questions.map((q) => q.topic))).sort(), [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        !globalSearch ||
        q.prompt.toLowerCase().includes(globalSearch.toLowerCase()) ||
        q.topic.toLowerCase().includes(globalSearch.toLowerCase());
      const matchTopic = questionTopicFilter === "all" || q.topic === questionTopicFilter;
      return matchSearch && matchTopic;
    });
  }, [questions, globalSearch, questionTopicFilter]);

  const filteredCoupons = useMemo(() => {
    return localCoupons.filter((c) => {
      const matchSearch = !globalSearch || c.code.toLowerCase().includes(globalSearch.toLowerCase());
      const usedUp = c.maxUses > 0 && c.usedCount >= c.maxUses;
      const exp = expiryState(c.expiresAt, usedUp);
      const matchChip =
        couponChip === "all" ||
        (couponChip === "active" && c.isActive && exp !== "expired") ||
        (couponChip === "inactive" && !c.isActive) ||
        (couponChip === "expiring" && exp === "expiring") ||
        (couponChip === "expired" && exp === "expired");
      return matchSearch && matchChip;
    });
  }, [localCoupons, globalSearch, couponChip]);

  const couponChipOptions = useMemo(() => {
    const count = (pred: (c: CouponRow) => boolean) => localCoupons.filter(pred).length;
    const usedUp = (c: CouponRow) => c.maxUses > 0 && c.usedCount >= c.maxUses;
    return [
      { value: "all", label: "الكل", count: localCoupons.length },
      { value: "active", label: "فعال", count: count((c) => c.isActive && expiryState(c.expiresAt, usedUp(c)) !== "expired") },
      { value: "expiring", label: "ينتهي قريباً", count: count((c) => expiryState(c.expiresAt, usedUp(c)) === "expiring") },
      { value: "expired", label: "منتهي", count: count((c) => expiryState(c.expiresAt, usedUp(c)) === "expired") },
      { value: "inactive", label: "معطل", count: count((c) => !c.isActive) },
    ];
  }, [localCoupons]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !globalSearch ||
        o.studentName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        o.studentEmail.toLowerCase().includes(globalSearch.toLowerCase()) ||
        o.courseTitle.toLowerCase().includes(globalSearch.toLowerCase());
      const matchStatus = orderStatusChip === "all" || o.status === orderStatusChip;
      return matchSearch && matchStatus && inDateRange(o.createdAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, globalSearch, orderStatusChip, dateFrom, dateTo]);

  const filteredSubscriptions = useMemo(() => {
    return localSubscriptions.filter((s) => {
      return (
        !globalSearch ||
        s.studentName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.courseTitle.toLowerCase().includes(globalSearch.toLowerCase())
      );
    });
  }, [localSubscriptions, globalSearch]);

  const orderChipOptions = useMemo(() => {
    const count = (pred: (o: OrderRow) => boolean) => orders.filter(pred).length;
    return [
      { value: "all", label: "الكل", count: orders.length },
      { value: "paid", label: "مدفوع", count: count((o) => o.status === "paid") },
      { value: "pending", label: "معلق", count: count((o) => o.status === "pending") },
      { value: "failed", label: "فاشل", count: count((o) => o.status === "failed") },
      { value: "refunded", label: "مسترد", count: count((o) => o.status === "refunded") },
    ];
  }, [orders]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => inDateRange(a.submittedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, dateFrom, dateTo]);

  /* Exam results analytics (pass rate + score distribution) */
  const resultsAnalytics = useMemo(() => {
    if (filteredAttempts.length === 0) return null;
    const pcts = filteredAttempts.map((a) => Math.round((a.score / (a.totalMarks || 1)) * 100));
    const pass = pcts.filter((p) => p >= 50).length;
    const buckets = [
      { label: "ضعيف (أقل من 50%)", count: pcts.filter((p) => p < 50).length, tone: "bg-danger/60" },
      { label: "مقبول (50–69%)", count: pcts.filter((p) => p >= 50 && p < 70).length, tone: "bg-gold/60" },
      { label: "جيد (70–84%)", count: pcts.filter((p) => p >= 70 && p < 85).length, tone: "bg-brand/40" },
      { label: "ممتاز (85%+)", count: pcts.filter((p) => p >= 85).length, tone: "bg-brand" },
    ];
    return {
      total: filteredAttempts.length,
      passRate: Math.round((pass / pcts.length) * 100),
      avg: Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length),
      best: Math.max(...pcts),
      worst: Math.min(...pcts),
      buckets,
    };
  }, [filteredAttempts]);

  /* Question bank insights (topics + difficulty spread) */
  const questionInsights = useMemo(() => {
    if (questions.length === 0) return null;
    const byDifficulty = [1, 2, 3, 4, 5].map((level) => ({
      level,
      count: questions.filter((q) => q.difficulty === level).length,
    }));
    const topTopics = [...questionTopics.slice(0, 5)];
    return { byDifficulty, topTopics, total: questions.length };
  }, [questions, questionTopics]);

  /* ── Feature: command palette (Ctrl+K / "/"/ "?") ── */
  const paletteCommands = useMemo<PaletteCommand[]>(() => {
    const navCommands: PaletteCommand[] = CATEGORIES.flatMap((cat) =>
      cat.subFeatures.map((sub) => ({
        id: `nav-${cat.id}-${sub.id}`,
        label: sub.label,
        group: cat.label,
        keywords: cat.description,
        icon: <sub.icon size={16} />,
        run: () => selectSubFeature(cat.id, sub.id),
      }))
    );
    const actions: PaletteCommand[] = [
      {
        id: "act-generate-codes",
        label: "توليد أكواد تفعيل",
        group: "إجراءات سريعة",
        keywords: "أكواد كوبونات سنتر",
        icon: <Sparkles size={16} />,
        run: () => selectSubFeature("billing_codes", "create_codes"),
      },
      {
        id: "act-add-student",
        label: "إضافة طالب جديد",
        group: "إجراءات سريعة",
        keywords: "طالب حساب تسجيل",
        icon: <UserPlus size={16} />,
        run: () => selectSubFeature("users", "add_student"),
      },
      {
        id: "act-manual-payment",
        label: "تفعيل اشتراك يدوي (دفع سنتر)",
        group: "إجراءات سريعة",
        keywords: "دفع كاش فودافون",
        icon: <CreditCard size={16} />,
        run: () => selectSubFeature("billing_codes", "manual_payment"),
      },
      {
        id: "act-broadcast",
        label: "إرسال تنبيه جماعي",
        group: "إجراءات سريعة",
        keywords: "رسائل إشعارات sms",
        icon: <Send size={16} />,
        run: () => selectSubFeature("communications", "sms_messages"),
      },
      {
        id: "act-refresh",
        label: "تحديث البيانات من السيرفر",
        group: "إجراءات سريعة",
        keywords: "refresh reload",
        icon: <RefreshCw size={16} />,
        run: refreshNow,
      },
      {
        id: "act-density",
        label: density === "comfortable" ? "تبديل كثافة الجداول إلى: مضغوط" : "تبديل كثافة الجداول إلى: مريح",
        group: "إجراءات سريعة",
        keywords: "density compact عرض",
        icon: <ListChecks size={16} />,
        run: () => changeDensity(density === "comfortable" ? "compact" : "comfortable"),
      },
      {
        id: "act-auto-refresh",
        label: autoRefresh ? "إيقاف التحديث التلقائي (30 ثانية)" : "تشغيل التحديث التلقائي (30 ثانية)",
        group: "إجراءات سريعة",
        keywords: "auto refresh live",
        icon: <Zap size={16} />,
        run: toggleAutoRefresh,
      },
      {
        id: "act-view-site",
        label: "عرض المنصة كما يراها الطالب",
        group: "إجراءات سريعة",
        keywords: "site preview",
        icon: <ExternalLink size={16} />,
        run: () => window.open("/courses", "_blank"),
      },
    ];
    return [...actions, ...navCommands];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, autoRefresh]);

  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);

  /* ── Feature: bulk user activation / freeze ── */
  const selectedUsers = useMemo(
    () => localUsers.filter((u) => selectedUserIds.has(u.id)),
    [localUsers, selectedUserIds]
  );

  function requestBulkUserStatus(nextStatus: boolean) {
    const targets = selectedUsers.filter((u) => u.isActive !== nextStatus);
    if (targets.length === 0) {
      pushToast("info", "العناصر المحددة في الحالة المطلوبة بالفعل.");
      return;
    }
    setConfirmReq({
      title: nextStatus
        ? `تفعيل ${targets.length} حساباً محدداً؟`
        : `تجميد ${targets.length} حساباً محدداً؟`,
      description: nextStatus
        ? "سيستطيع الطلاب المحددون تسجيل الدخول واستخدام المنصة."
        : "لن يستطيع الطلاب المحددون تسجيل الدخول حتى إعادة تفعيلهم.",
      confirmLabel: nextStatus ? "تفعيل الجميع" : "تجميد الجميع",
      tone: nextStatus ? "primary" : "danger",
      onConfirm: async () => {
        const keys = targets.map((u) => `user-${u.id}`);
        keys.forEach(markPending);
        setLocalUsers((prev) =>
          prev.map((item) => (selectedUserIds.has(item.id) ? { ...item, isActive: nextStatus } : item))
        );
        let ok = 0;
        for (const u of targets) {
          const done = await api(
            `/api/v1/admin/users/${u.id}`,
            { method: "PATCH", body: JSON.stringify({ isActive: nextStatus }) },
            { silent: true, noRefresh: true }
          );
          if (done) ok++;
        }
        keys.forEach(unmarkPending);
        setSelectedUserIds(new Set());
        router.refresh();
        pushToast(ok === targets.length ? "ok" : "err", `تم تحديث ${ok} من ${targets.length} حساباً.`);
      },
    });
  }

  /* ── Feature: duplicate course ── */
  function requestDuplicateCourse(c: CourseRow) {
    const gradeId = grades.find((g) => g.name === c.gradeName)?.id;
    const subjectId = subjects.find((s) => s.name === c.subjectName)?.id;
    if (!gradeId || !subjectId) {
      pushToast("err", "تعذر تحديد الصف أو المادة الأصلية للمضاعفة.");
      return;
    }
    setConfirmReq({
      title: `إنشاء نسخة من «${c.title}»؟`,
      description: "ستُنشأ نسخة بمحتوى مطابق بعنوان ورابط مميزين، تبقى مسودة حتى تنشرها.",
      confirmLabel: "إنشاء النسخة",
      tone: "primary",
      onConfirm: async () => {
        const suffix = Date.now().toString(36).slice(-4);
        const done = await api("/api/v1/admin/courses", {
          method: "POST",
          body: JSON.stringify({
            title: `${c.title} — نسخة`.slice(0, 140),
            slug: `${c.slug}-copy-${suffix}`.slice(0, 90),
            summary: "",
            description: "",
            gradeId,
            subjectId,
            priceEgp: c.priceCents / 100,
          }),
        });
        if (done) pushToast("ok", "تم إنشاء نسخة المقرر كمسودة — عدّلها ثم انشرها.");
      },
    });
  }

  /* ── Feature: inline course price edit ── */
  async function savePriceInline(c: CourseRow) {
    if (!editingPrice || editingPrice.id !== c.id) return;
    const egp = Number(editingPrice.value);
    if (isNaN(egp) || egp < 0 || egp === c.priceCents / 100) {
      setEditingPrice(null);
      return;
    }
    const key = `course-${c.id}`;
    markPending(key);
    const done = await api(`/api/v1/admin/courses/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ priceEgp: egp }),
    });
    if (done) {
      setLocalCourses((prev) => prev.map((item) => (item.id === c.id ? { ...item, priceCents: Math.round(egp * 100) } : item)));
      pushToast("ok", `تم تحديث سعر «${c.title}» إلى ${formatEGP(Math.round(egp * 100))}.`);
    }
    setEditingPrice(null);
    unmarkPending(key);
  }

  /* ── Table column definitions ── */
  const courseColumns: Column<CourseRow>[] = [
    {
      key: "cover",
      header: "الغلاف",
      render: (c) => (
        <button
          type="button"
          onClick={() => setCoverModal({ course: c, url: c.coverImageUrl ?? "" })}
          title="تعديل صورة الغلاف"
          aria-label={`تعديل غلاف ${c.title}`}
          className="group relative block size-14 cursor-pointer overflow-hidden rounded-xl border border-line bg-surface2 transition-colors hover:border-brand/60"
        >
          {c.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.coverImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted">
              <ImageIcon size={16} />
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <ImagePlus size={15} className="text-white" />
          </span>
        </button>
      ),
    },
    {
      key: "title",
      header: "عنوان المقرر",
      sortValue: (c) => c.title,
      render: (c) => (
        <div>
          <p className="font-semibold text-ink">{c.title}</p>
          <span className="text-[11px] text-muted" dir="ltr">
            /{c.slug}
          </span>
        </div>
      ),
    },
    {
      key: "grade",
      header: "الصف والمادة",
      sortValue: (c) => c.gradeName,
      render: (c) => <span className="text-muted">{c.gradeName} · {c.subjectName}</span>,
    },
    {
      key: "lessons",
      header: "الدروس",
      sortValue: (c) => c.lessonsCount,
      render: (c) => <span className="tabular-nums font-medium">{c.lessonsCount} درس</span>,
    },
    {
      key: "price",
      header: "السعر",
      sortValue: (c) => c.priceCents,
      render: (c) => <span className="font-semibold tabular-nums text-brand">{formatEGP(c.priceCents)}</span>,
    },
    {
      key: "status",
      header: "حالة النشر",
      render: (c) => (
        <select
          value={c.status}
          onChange={(e) => handleCourseStatusChange(c, e.target.value as CourseRow["status"])}
          aria-label={`حالة نشر ${c.title}`}
          disabled={pendingIds.has(`course-${c.id}`)}
          className={cn(
            "cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition-colors",
            c.status === "published" && "border-success/30 bg-success/10 text-success",
            c.status === "draft" && "border-line bg-surface2 text-muted",
            c.status === "archived" && "border-danger/30 bg-danger/10 text-danger"
          )}
        >
          <option value="published">منشور (ظاهر للطلاب)</option>
          <option value="draft">مسودة (مخفي)</option>
          <option value="archived">مؤرشف</option>
        </select>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      className: "text-center",
      hideOnMobile: true,
      render: (c) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setCoverModal({ course: c, url: c.coverImageUrl ?? "" })}
            aria-label={`تعديل غلاف ${c.title}`}
            title="تعديل الغلاف"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs text-muted transition-colors hover:border-brand/50 hover:text-brand"
          >
            <ImagePlus size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleToggleSequential(c)}
            aria-pressed={c.requireSequentialProgress}
            title={c.requireSequentialProgress ? "التسلسل الإجباري مفعّل — اضغط للتعطيل" : "تفعيل التسلسل الإجباري للفيديوهات"}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
              c.requireSequentialProgress
                ? "border-success/40 bg-success/10 text-success"
                : "border-line text-muted hover:border-brand/50 hover:text-brand"
            )}
          >
            <Link2 size={14} />
          </button>
          <Link
            href={`/courses/${c.slug}`}
            target="_blank"
            aria-label={`معاينة ${c.title}`}
            title="معاينة"
            className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-brand transition-colors hover:border-brand/50"
          >
            <Eye size={14} />
          </Link>
          <button
            type="button"
            onClick={() => requestDeleteCourse(c)}
            aria-label={`حذف ${c.title}`}
            title="حذف"
            className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const orderColumns: Column<OrderRow>[] = [
    {
      key: "student",
      header: "الطالب",
      sortValue: (o) => o.studentName,
      render: (o) => (
        <div>
          <p className="font-semibold text-ink">{o.studentName}</p>
          <span className="text-[11px] text-muted" dir="ltr">{o.studentEmail}</span>
        </div>
      ),
    },
    {
      key: "course",
      header: "المقرر",
      render: (o) => <span className="text-muted">{o.courseTitle}</span>,
    },
    {
      key: "total",
      header: "الإجمالي",
      sortValue: (o) => o.totalCents,
      render: (o) => <span className="font-semibold tabular-nums text-brand">{formatEGP(o.totalCents)}</span>,
    },
    {
      key: "discount",
      header: "الخصم",
      sortValue: (o) => o.discountCents,
      render: (o) =>
        o.discountCents > 0 ? (
          <span className="tabular-nums text-gold">{formatEGP(o.discountCents)}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "الحالة",
      render: (o) => <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>,
    },
    {
      key: "date",
      header: "التاريخ",
      sortValue: (o) => new Date(o.createdAt).getTime(),
      render: (o) => <span className="text-muted tabular-nums" dir="ltr">{formatDate(o.createdAt)}</span>,
    },
  ];

  const examColumns: Column<ExamRow>[] = [
    {
      key: "order",
      header: "الترتيب",
      render: (e) => {
        const siblings = localExams.filter((x) => x.courseSlug === e.courseSlug);
        const isFirst = e.sortOrder <= 1;
        const isLast = e.sortOrder >= siblings.length;
        return (
          <div className="flex items-center gap-1">
            <span className="grid size-6 place-items-center rounded-md bg-surface2 text-[11px] font-bold tabular-nums text-muted">
              {e.sortOrder}
            </span>
            <button
              type="button"
              onClick={() => moveExam(e, -1)}
              disabled={isFirst}
              aria-label={`تحريك ${e.title} لأعلى`}
              className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={() => moveExam(e, 1)}
              disabled={isLast}
              aria-label={`تحريك ${e.title} لأسفل`}
              className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown size={13} />
            </button>
          </div>
        );
      },
    },
    {
      key: "title",
      header: "عنوان الامتحان",
      sortValue: (e) => e.title,
      render: (e) => (
        <div>
          <p className="font-semibold text-ink">{e.title}</p>
          <span className="text-[11px] text-muted">{e.courseTitle}</span>
        </div>
      ),
    },
    {
      key: "mode",
      header: "النوع",
      render: (e) => (
        <Badge tone={e.mode === "graded" ? "gold" : "brand"}>
          {e.mode === "graded" ? "رسمي بدرجات" : "تدريبي"}
        </Badge>
      ),
    },
    {
      key: "duration",
      header: "المدة",
      sortValue: (e) => e.durationMin,
      render: (e) => <span className="tabular-nums text-muted">{e.durationMin} دقيقة</span>,
    },
    {
      key: "attempts",
      header: "المحاولات",
      sortValue: (e) => e.attemptsCount,
      render: (e) => <span className="font-semibold tabular-nums">{e.attemptsCount}</span>,
    },
    {
      key: "avg",
      header: "متوسط الدرجات",
      sortValue: (e) => e.avgScore,
      render: (e) => <span className="font-semibold tabular-nums text-brand">{e.avgScore}%</span>,
    },
    {
      key: "publish",
      header: "النشر",
      render: (e) => (
        <button
          type="button"
          onClick={() => handleToggleExamPublish(e)}
          disabled={pendingIds.has(`exam-${e.id}`)}
          aria-pressed={e.isPublished}
          className={cn(
            "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all",
            e.isPublished
              ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
              : "border-line bg-surface2 text-muted hover:text-ink"
          )}
        >
          {e.isPublished ? "منشور ومتاح" : "مسودة مخفية"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      className: "text-center",
      hideOnMobile: true,
      render: (e) => (
        <button
          type="button"
          onClick={() => requestDeleteExam(e)}
          aria-label={`حذف ${e.title}`}
          title="حذف"
          className="inline-flex items-center rounded-lg border border-line px-2 py-1.5 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  const questionColumns: Column<QuestionRow>[] = [
    {
      key: "prompt",
      header: "نص السؤال",
      sortValue: (q) => q.prompt,
      render: (q) => (
        <div className="max-w-xs">
          <p className="line-clamp-2 font-medium text-ink">{q.prompt}</p>
          {q.explanation ? <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{q.explanation}</p> : null}
        </div>
      ),
    },
    {
      key: "topic",
      header: "الفرع والموضوع",
      sortValue: (q) => q.topic,
      render: (q) => <span className="text-muted">{q.subjectName} · {q.topic}</span>,
    },
    {
      key: "options",
      header: "الخيارات",
      sortValue: (q) => q.options?.length ?? 0,
      render: (q) => <span className="tabular-nums text-muted">{q.options?.length ?? 4} خيارات</span>,
    },
    {
      key: "correct",
      header: "الإجابة الصحيحة",
      render: (q) => (
        <span className="font-medium text-success">
          الخيار ({(q.correctIndex ?? 0) + 1}): {q.options?.[q.correctIndex] ?? "—"}
        </span>
      ),
    },
    {
      key: "difficulty",
      header: "الصعوبة",
      sortValue: (q) => q.difficulty,
      render: (q) => (
        <Badge tone={q.difficulty > 3 ? "danger" : q.difficulty > 1 ? "gold" : "success"}>
          مستوى {q.difficulty}/5
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      className: "text-center",
      hideOnMobile: true,
      render: (q) => (
        <button
          type="button"
          onClick={() => requestDeleteQuestion(q)}
          aria-label="حذف السؤال"
          title="حذف"
          className="inline-flex items-center rounded-lg border border-line px-2 py-1.5 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  const attemptColumns: Column<AttemptRow>[] = [
    {
      key: "student",
      header: "الطالب",
      sortValue: (a) => a.studentName,
      render: (a) => (
        <div>
          <p className="font-semibold text-ink">{a.studentName}</p>
          <span className="text-[11px] text-muted" dir="ltr">{a.studentEmail}</span>
        </div>
      ),
    },
    {
      key: "exam",
      header: "الامتحان",
      render: (a) => <span className="text-muted">{a.examTitle}</span>,
    },
    {
      key: "score",
      header: "الدرجة",
      sortValue: (a) => (a.score / (a.totalMarks || 1)) * 100,
      render: (a) => (
        <span className="font-semibold tabular-nums text-ink">
          {a.score} / {a.totalMarks}
        </span>
      ),
    },
    {
      key: "pct",
      header: "النسبة",
      render: (a) => {
        const pct = Math.round((a.score / (a.totalMarks || 1)) * 100);
        return <Badge tone={pct >= 85 ? "success" : pct >= 50 ? "gold" : "danger"}>{pct}%</Badge>;
      },
    },
    {
      key: "date",
      header: "التاريخ",
      sortValue: (a) => new Date(a.submittedAt).getTime(),
      render: (a) => <span className="text-muted tabular-nums" dir="ltr">{formatDate(a.submittedAt)}</span>,
    },
  ];

  const couponColumns: Column<CouponRow>[] = [
    {
      key: "code",
      header: "الكود",
      sortValue: (c) => c.code,
      render: (c) => (
        <span className="font-mono font-semibold text-ink select-all" dir="ltr">{c.code}</span>
      ),
    },
    {
      key: "percent",
      header: "القيمة",
      sortValue: (c) => c.percentOff,
      render: (c) => {
        if (c.percentOff && c.percentOff > 0) {
          return <span className="font-semibold tabular-nums text-brand">{c.percentOff}%</span>;
        }
        if (c.amountCents && c.amountCents > 0) {
          return <span className="font-semibold tabular-nums text-brand">{formatEGP(c.amountCents)}</span>;
        }
        return <span className="text-muted text-xs">—</span>;
      },
    },
    {
      key: "usage",
      header: "حالة الاستخدام",
      sortValue: (c) => c.usedCount,
      render: (c) => {
        if (c.usedCount >= c.maxUses) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
              <CheckCircle2 size={11} />
              تم الاستخدام
            </span>
          );
        }
        if (c.usedCount > 0) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
              <Hourglass size={11} />
              {c.usedCount} / {c.maxUses} (جزئي)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-2.5 py-1 text-[11px] font-bold text-muted">
            <Ticket size={11} />
            {c.usedCount} / {c.maxUses} (متاح)
          </span>
        );
      },
    },
    {
      key: "status",
      header: "حالة الكود",
      render: (c) => (
        <button
          type="button"
          onClick={() => handleToggleCoupon(c)}
          disabled={pendingIds.has(`coupon-${c.id}`)}
          aria-pressed={c.isActive}
          className={cn(
            "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all",
            c.isActive
              ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
              : "border-line bg-surface2 text-muted hover:text-ink"
          )}
        >
          {c.isActive ? "فعال" : "معطل"}
        </button>
      ),
    },
    {
      key: "expiry",
      header: "الصلاحية",
      sortValue: (c) => (c.expiresAt ? new Date(c.expiresAt).getTime() : 0),
      render: (c) => (
        <span className="text-muted tabular-nums" dir="ltr">
          {c.expiresAt ? formatDate(c.expiresAt) : "غير محدد"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "إجراءات",
      className: "text-center",
      hideOnMobile: true,
      render: (c) => (
        <button
          type="button"
          onClick={() => requestDeleteCoupon(c)}
          aria-label={`حذف الكود ${c.code}`}
          title="حذف"
          className="inline-flex items-center rounded-lg border border-line px-2 py-1.5 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  const subscriptionColumns: Column<SubscriptionRow>[] = [
    {
      key: "student",
      header: "الطالب",
      sortValue: (s) => s.studentName,
      render: (s) => (
        <div>
          <p className="font-semibold text-ink">{s.studentName}</p>
          <span className="text-[11px] text-muted" dir="ltr">{s.studentEmail}</span>
        </div>
      ),
    },
    {
      key: "course",
      header: "المقرر",
      sortValue: (s) => s.courseTitle,
      render: (s) => <span className="font-medium text-ink">{s.courseTitle}</span>,
    },
    {
      key: "price",
      header: "السعر",
      sortValue: (s) => s.priceCents,
      render: (s) => <span className="tabular-nums text-brand">{formatEGP(s.priceCents)}</span>,
    },
    {
      key: "status",
      header: "الحالة",
      render: (s) => <Badge tone={statusTone(s.status)}>{statusLabel(s.status)}</Badge>,
    },
    {
      key: "start",
      header: "البداية",
      sortValue: (s) => new Date(s.startsAt).getTime(),
      render: (s) => <span className="text-muted tabular-nums" dir="ltr">{formatDate(s.startsAt)}</span>,
    },
  ];

  const invoiceColumns: Column<InvoiceRow>[] = [
    {
      key: "number",
      header: "رقم الفاتورة",
      sortValue: (i) => i.number,
      render: (i) => <span className="font-mono font-semibold text-brand" dir="ltr">{i.number}</span>,
    },
    {
      key: "total",
      header: "الإجمالي",
      sortValue: (i) => i.totalCents,
      render: (i) => <span className="font-semibold tabular-nums text-ink">{formatEGP(i.totalCents)}</span>,
    },
    {
      key: "date",
      header: "تاريخ الإصدار",
      sortValue: (i) => new Date(i.issuedAt).getTime(),
      render: (i) => <span className="text-muted tabular-nums" dir="ltr">{formatDate(i.issuedAt)}</span>,
    },
  ];

  const userColumns: Column<UserRow>[] = [
    {
      key: "user",
      header: "المستخدم",
      sortValue: (u) => u.name,
      render: (u) => (
        <div>
          <button
            type="button"
            onClick={() => setProfileUser(u)}
            title="عرض الملف الكامل للطالب"
            className="cursor-pointer font-semibold text-ink underline-offset-4 transition-colors hover:text-brand hover:underline"
          >
            {hl(u.name)}
          </button>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <span dir="ltr">{u.email}</span>
            <button
              type="button"
              onClick={() => copyText(u.email, `تم نسخ بريد ${u.name}`)}
              aria-label={`نسخ بريد ${u.name}`}
              className="cursor-pointer rounded p-0.5 transition-colors hover:bg-surface2 hover:text-brand"
            >
              <Copy size={11} />
            </button>
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "الرتبة",
      sortValue: (u) => u.role,
      render: (u) =>
        canManageUsers ? (
          <select
            value={u.role}
            onChange={(e) => requestRoleChange(u, e.target.value as Role)}
            aria-label={`رتبة ${u.name}`}
            disabled={pendingIds.has(`user-${u.id}`)}
            className="cursor-pointer rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none transition-colors focus:border-brand"
          >
            <option value="student">طالب</option>
            <option value="teacher">مدرّس</option>
            <option value="assistant">مساعد</option>
            <option value="admin">مدير</option>
          </select>
        ) : (
          <Badge tone="brand">{ROLE_LABELS[u.role]}</Badge>
        ),
    },
    {
      key: "balance",
      header: "المحفظة",
      sortValue: (u) => u.balanceCents,
      render: (u) => <span className="font-semibold tabular-nums text-brand">{formatEGP(u.balanceCents)}</span>,
    },
    {
      key: "status",
      header: "الحالة",
      render: (u) => (
        <button
          type="button"
          onClick={() => requestToggleUserStatus(u)}
          disabled={pendingIds.has(`user-${u.id}`)}
          aria-pressed={u.isActive}
          className={cn(
            "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all",
            u.isActive
              ? "border-success/30 bg-success/10 text-success hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
              : "border-danger/30 bg-danger/10 text-danger hover:border-success/30 hover:bg-success/10 hover:text-success"
          )}
        >
          {u.isActive ? "نشط ومفعل" : "مجمد / معطل"}
        </button>
      ),
    },
    {
      key: "wallet",
      header: "إجراءات المحفظة",
      className: "text-center",
      render: (u) => (
        <Button
          type="button"
          onClick={() => setWalletModalUser(u)}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
        >
          <Wallet size={13} className="text-brand" />
          تعديل المحفظة
        </Button>
      ),
    },
  ];

  const fileColumns: Column<CourseFileRow>[] = [
    {
      key: "title",
      header: "اسم المذكرة",
      sortValue: (f) => f.title,
      render: (f) => <p className="font-semibold text-ink">{f.title}</p>,
    },
    {
      key: "course",
      header: "المقرر",
      render: (f) => <span className="text-muted">{f.courseTitle}</span>,
    },
    {
      key: "kind",
      header: "النوع",
      render: (f) => <Badge tone="brand">{f.kind.toUpperCase()}</Badge>,
    },
    {
      key: "size",
      header: "الحجم",
      sortValue: (f) => f.sizeBytes,
      render: (f) => <span className="tabular-nums text-muted">{(f.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>,
    },
    {
      key: "preview",
      header: "معاينة مجانية",
      render: (f) => (
        <Badge tone={f.isFreePreview ? "success" : "muted"}>{f.isFreePreview ? "نعم" : "للمشتركين"}</Badge>
      ),
    },
  ];

  const advancedUserColumns: Column<UserRow>[] = [
    {
      key: "name",
      header: "المستخدم",
      sortValue: (u) => u.name,
      render: (u) => (
        <div>
          <p className="font-semibold text-ink">{u.name}</p>
          <span className="text-[11px] text-muted" dir="ltr">{u.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "الموبايل",
      render: (u) =>
        u.phone ? (
          <span className="font-mono text-xs tabular-nums text-muted" dir="ltr">{u.phone}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "role",
      header: "الرتبة",
      render: (u) => <Badge tone={u.role === "student" ? "brand" : "gold"}>{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: "courses",
      header: "الكورسات المشترك بها",
      render: (u) => {
        const ids = Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [];
        if (ids.length === 0) return <span className="text-xs text-muted">غير مشترك</span>;
        return (
          <div className="flex max-w-56 flex-wrap gap-1">
            {ids.map((cid) => (
              <span key={cid} className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                {localCourses.find((c) => c.id === cid)?.title ?? "كورس"}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "الحالة",
      render: (u) => <Badge tone={u.isActive ? "success" : "muted"}>{u.isActive ? "نشط" : "مجمّد"}</Badge>,
    },
    {
      key: "balance",
      header: "المحفظة",
      sortValue: (u) => u.balanceCents,
      render: (u) => <span className="tabular-nums font-semibold text-gold">{formatEGP(u.balanceCents)}</span>,
    },
    {
      key: "joined",
      header: "التسجيل",
      sortValue: (u) => new Date(u.createdAt).getTime(),
      render: (u) => <span className="text-muted tabular-nums" dir="ltr">{formatDate(u.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (u) => (
        <button
          type="button"
          onClick={() => setProfileUser(u)}
          title="الملف الكامل للطالب"
          aria-label={`فتح ملف ${u.name}`}
          className="cursor-pointer rounded-lg border border-line px-2 py-1.5 text-muted transition-colors hover:border-brand/50 hover:text-brand"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  return (
    <TablePrefsProvider
      value={{ density, pageSize, onPageSizeChange: changePageSize }}
    >
    <div ref={viewRef} className="view-enter space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              مركز العمليات والإدارة الموحد
            </span>
            <span className="text-xs font-medium text-muted">· مرحبًا، {actor.name}</span>
          </div>
          <h1 className="font-brand text-2xl font-bold text-ink sm:text-3xl">لوحة الإدارة الأكاديمية</h1>
          <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">
            إدارة متكاملة لجميع محتويات المنصة، الطلاب، المقررات، الامتحانات، والعمليات المالية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="لوحة الأوامر السريعة"
            title="لوحة الأوامر (Ctrl+K)"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted transition-colors hover:border-brand/50 hover:text-ink"
          >
            <Search size={14} className="text-brand" />
            <span className="hidden sm:inline">أوامر سريعة</span>
            <kbd className="rounded-md border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[10px]" dir="ltr">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => changeDensity(density === "comfortable" ? "compact" : "comfortable")}
            aria-pressed={density === "compact"}
            title={density === "comfortable" ? "تبديل إلى العرض المضغوط" : "تبديل إلى العرض المريح"}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface2"
          >
            <ListChecks size={14} className="text-brand" />
            <span>{density === "comfortable" ? "مريح" : "مضغوط"}</span>
          </button>
          <button
            type="button"
            onClick={toggleAutoRefresh}
            aria-pressed={autoRefresh}
            title="تحديث تلقائي كل 30 ثانية"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
              autoRefresh
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-line bg-surface text-ink hover:bg-surface2"
            )}
          >
            <Zap size={14} className={autoRefresh ? "text-brand" : "text-brand opacity-70"} />
            <span>تحديث تلقائي</span>
          </button>
          <span className="hidden items-center gap-1.5 text-[11px] text-muted lg:inline-flex" title="وقت آخر تحديث للبيانات">
            <Timer size={13} />
            {relativeTime(lastRefreshed.toISOString())}
          </span>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface2"
          >
            <ExternalLink size={14} className="text-brand" />
            <span>عرض المنصة كطالب</span>
          </Link>
          <button
            type="button"
            onClick={refreshNow}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface2"
          >
            <RefreshCw size={14} className="text-brand" />
            <span>تحديث</span>
          </button>
          <button
            type="button"
            onClick={() => selectSubFeature("billing_codes", "create_codes")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110"
          >
            <Sparkles size={14} />
            <span>توليد أكواد</span>
          </button>
          <button
            type="button"
            onClick={() => selectSubFeature("users", "add_student")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3.5 py-2 text-xs font-semibold text-ink transition-all hover:bg-line"
          >
            <UserPlus size={14} className="text-brand" />
            <span>إضافة طالب</span>
          </button>
          <button
            type="button"
            onClick={() => selectSubFeature("billing_codes", "manual_payment")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3.5 py-2 text-xs font-semibold text-ink transition-all hover:bg-line"
          >
            <CreditCard size={14} className="text-brand" />
            <span>دفع سنتر</span>
          </button>
        </div>
      </div>

      {/* ── GLOBAL SEARCH & DATA EXPORT BAR ── */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-xs sm:flex-row">
        <div className="relative w-full flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="بحث فوري في الطلاب، المقررات، الأسئلة، الأكواد، الفواتير..."
            aria-label="بحث شامل في لوحة الإدارة"
            className="h-10 w-full border-line bg-surface2 pr-10 text-xs"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs text-muted hover:text-ink"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          {activeCategory === "users" && (
            <Button
              onClick={() =>
                downloadCSV("students_list", filteredUsers, [
                  { key: "name", label: "اسم الطالب" },
                  { key: "email", label: "البريد الإلكتروني" },
                  { key: "role", label: "الرتبة" },
                  { key: "status", label: "الحالة" },
                  { key: "createdAt", label: "تاريخ التسجيل" },
                ])
              }
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الطلاب
            </Button>
          )}
          {activeCategory === "billing_codes" && activeSubFeature === "codes_table" && (
            <Button
              onClick={() =>
                downloadCSV(
                  "coupons_codes",
                  filteredCoupons.map((c) => ({
                    code: c.code,
                    percentOff: c.percentOff,
                    maxUses: c.maxUses,
                    usedCount: c.usedCount,
                    status: yesNo(c.isActive),
                    expiresAt: c.expiresAt ? formatDate(c.expiresAt) : "غير محدد",
                  })),
                  [
                    { key: "code", label: "كود التفعيل" },
                    { key: "percentOff", label: "نسبة الخصم %" },
                    { key: "maxUses", label: "أقصى استخدامات" },
                    { key: "usedCount", label: "مرات الاستخدام" },
                    { key: "status", label: "الحالة" },
                    { key: "expiresAt", label: "تاريخ الصلاحية" },
                  ]
                )
              }
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الأكواد
            </Button>
          )}
          {activeCategory === "academic" && (
            <Button
              onClick={() =>
                downloadCSV(
                  "courses_list",
                  filteredCourses.map((c) => ({
                    title: c.title,
                    gradeName: c.gradeName,
                    subjectName: c.subjectName,
                    status: statusLabel(c.status),
                    price: formatEGP(c.priceCents),
                  })),
                  [
                    { key: "title", label: "اسم الكورس" },
                    { key: "gradeName", label: "الصف الدراسي" },
                    { key: "subjectName", label: "المادة" },
                    { key: "status", label: "الحالة" },
                    { key: "price", label: "السعر" },
                  ]
                )
              }
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير الكورسات
            </Button>
          )}
          {activeCategory === "exams" && activeSubFeature === "exam_results_table" && (
            <Button
              onClick={() =>
                downloadCSV(
                  "exam_results",
                  attempts.map((a) => ({
                    examTitle: a.examTitle,
                    studentName: a.studentName,
                    studentEmail: a.studentEmail,
                    score: a.score,
                    totalMarks: a.totalMarks,
                    pct: `${Math.round((a.score / (a.totalMarks || 1)) * 100)}%`,
                    submittedAt: formatDate(a.submittedAt),
                  })),
                  [
                    { key: "examTitle", label: "الامتحان" },
                    { key: "studentName", label: "اسم الطالب" },
                    { key: "studentEmail", label: "البريد" },
                    { key: "score", label: "الدرجة" },
                    { key: "totalMarks", label: "الدرجة الكلية" },
                    { key: "pct", label: "النسبة" },
                    { key: "submittedAt", label: "تاريخ التسليم" },
                  ]
                )
              }
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:flex-initial"
            >
              <Download size={14} className="text-brand" />
              تصدير النتائج
            </Button>
          )}
        </div>
      </div>

      {/* ═══ 1. OVERVIEW & REPORTS ═══ */}
      {activeCategory === "overview" && activeSubFeature === "home" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Users} label="الطلاب المسجلين" value={overview.stats.students} hint="نشط في المنصة" hintTone="success" />
            <KpiCard icon={BookOpen} label="الكورسات المنشورة" value={overview.stats.publishedCourses} hint="متاحة للاشتراك" iconTone="gold" />
            <KpiCard icon={Receipt} label="إجمالي الإيرادات" value={formatEGP(overview.stats.revenueCents)} hint="فواتير مسددة" hintTone="success" iconTone="success" />
            <KpiCard icon={GraduationCap} label="الاشتراكات الفعالة" value={overview.stats.activeSubscriptions} hint="وصول مباشر للمحتوى" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="space-y-3 border-brand/20 bg-gradient-to-br from-surface to-surface2 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand">
                <Sparkles size={18} /> تفعيل فوري سريع
              </div>
              <p className="text-xs leading-relaxed text-muted">
                تفعيل اشتراك لطالب دفع نقداً في السنتر أو عبر فودافون كاش مباشرة دون انتظار.
              </p>
              <Button onClick={() => selectSubFeature("billing_codes", "manual_payment")} variant="primary" size="sm" className="w-full text-xs">
                تفعيل اشتراك طالب الآن
              </Button>
            </Card>
            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <GraduationCap size={18} className="text-gold" /> بنك الأسئلة والامتحانات
              </div>
              <p className="text-xs leading-relaxed text-muted">
                يحتوي بنك الأسئلة حالياً على <strong className="tabular-nums">{questions.length}</strong> سؤالاً رياضياً مع الإجابات النموذجية.
              </p>
              <Button onClick={() => selectSubFeature("exams", "exams_table")} variant="outline" size="sm" className="w-full text-xs">
                إدارة الامتحانات والأسئلة
              </Button>
            </Card>
            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <KeyRound size={18} className="text-brand" /> أكواد السنتر والشحن
              </div>
              <p className="text-xs leading-relaxed text-muted">
                توليد أكواد تفعيل مجمعة وطباعتها كبطاقات كروت سنتر للطلاب.
              </p>
              <Button onClick={() => selectSubFeature("billing_codes", "create_codes")} variant="outline" size="sm" className="w-full text-xs">
                توليد وطباعة الأكواد
              </Button>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-brand text-sm font-semibold text-ink">
                  <Receipt size={16} className="text-brand" /> أحدث عمليات الشراء والاشتراك
                </h3>
                <span className="text-xs tabular-nums text-muted">{overview.recentOrders.length} عمليات</span>
              </div>
              {overview.recentOrders.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">لا توجد عمليات شراء بعد.</p>
              ) : (
                <div className="divide-y divide-line/60">
                  {overview.recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-ink">{o.studentName}</p>
                        <p className="text-[11px] text-muted">{o.courseTitle}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold tabular-nums text-brand">{formatEGP(o.totalCents)}</p>
                        <Badge tone={statusTone(o.status)} className="text-[10px]">
                          {statusLabel(o.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-brand text-sm font-semibold text-ink">
                  <Clock size={16} className="text-gold" /> سجل تدقيق العمليات الأخير
                </h3>
                <Button onClick={() => selectSubFeature("overview", "updates")} variant="ghost" size="sm" className="h-8 text-xs">
                  عرض السجل كامل
                </Button>
              </div>
              {overview.recentAudit.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">لا توجد عمليات مسجلة بعد.</p>
              ) : (
                <div className="divide-y divide-line/60">
                  {overview.recentAudit.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-ink">{actionLabel(a.action)}</p>
                        <p className="text-[11px] text-muted">
                          بواسطة: {a.actorName ?? "النظام"} · <span dir="ltr">{formatDate(a.createdAt)}</span>
                        </p>
                      </div>
                      <Badge tone="outline">{a.entity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeCategory === "overview" && activeSubFeature === "statistics" && (
        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <SectionHeader icon={BarChart3} title="نمو الإيرادات الشهرية" hint="مقارنة الإيرادات المحصلة عبر آخر الأشهر" />
            <RevenueChart data={overview.revenueByMonth} />
          </Card>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Users} label="إجمالي الطلاب" value={localUsers.length} />
            <KpiCard icon={BookOpen} label="إجمالي المقررات" value={localCourses.length} iconTone="gold" />
            <KpiCard icon={HelpCircle} label="بنك الأسئلة" value={questions.length} iconTone="success" />
            <KpiCard icon={GraduationCap} label="الامتحانات" value={localExams.length} iconTone="gold" />
          </div>
        </div>
      )}

      {activeCategory === "overview" && activeSubFeature === "updates" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={Clock}
            title="سجل تدقيق وأمان العمليات الإدارية"
            hint="توثيق زمني كامل لكافة الإجراءات"
          />
          <AdminTable
            columns={[
              {
                key: "action",
                header: "الإجراء",
                render: (a) => <span className="font-semibold text-ink">{actionLabel(a.action)}</span>,
                sortValue: (a) => a.action,
              },
              {
                key: "entity",
                header: "الكيان",
                render: (a) => <Badge tone="brand">{a.entity}</Badge>,
              },
              {
                key: "actor",
                header: "المسؤول",
                render: (a) => <span className="text-muted">{a.actorName ?? "النظام الآلي"}</span>,
              },
              {
                key: "date",
                header: "التوقيت",
                sortValue: (a) => new Date(a.createdAt).getTime(),
                render: (a) => (
                  <span className="tabular-nums text-muted" dir="ltr">{formatDate(a.createdAt)}</span>
                ),
              },
            ]}
            rows={overview.recentAudit}
            emptyTitle="السجل فارغ"
            emptyHint="ستظهر هنا جميع العمليات الإدارية الموثقة تلقائياً."
          />
        </Card>
      )}

      {/* ═══ 2. ACADEMIC & COURSES ═══ */}
      {activeCategory === "academic" && activeSubFeature === "courses_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={BookOpen}
            title="المقررات الدراسية"
            count={filteredCourses.length}
            hint="يمكنك تغيير حالة الكورس أو حذفه مباشرة من الجدول"
            actions={
              <>
                <Select value={courseStatusFilter} onChange={(e) => setCourseStatusFilter(e.target.value)} className="h-9 w-32 text-xs">
                  <option value="all">كل الحالات</option>
                  <option value="published">المنشورة فقط</option>
                  <option value="draft">المسودات</option>
                  <option value="archived">المؤرشفة</option>
                </Select>
                <Button onClick={() => setActiveSubFeature("courses_manage")} variant="primary" size="sm">
                  <Plus size={14} /> إضافة مقرر
                </Button>
              </>
            }
          />
          <AdminTable
            columns={courseColumns}
            rows={filteredCourses}
            rowPending={(c) => pendingIds.has(`course-${c.id}`)}
            emptyTitle="لا توجد مقررات مطابقة"
            emptyHint="أضف مقرراً جديداً أو عدّل عوامل التصفية والبحث."
            emptyAction={
              <Button onClick={() => setActiveSubFeature("courses_manage")} variant="primary" size="sm">
                <Plus size={14} /> إضافة مقرر جديد
              </Button>
            }
          />
        </Card>
      )}

      {activeCategory === "academic" && activeSubFeature === "courses_manage" && (
        <Card className="mx-auto max-w-2xl space-y-4 p-6">
          <SectionHeader
            icon={PlusCircle}
            title="إضافة كورس / مقرر دراسي جديد"
            actions={
              <Button onClick={() => setActiveSubFeature("courses_table")} variant="ghost" size="sm">
                العودة للجدول
              </Button>
            }
          />
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <Field label="عنوان المقرر">
              <Input
                required
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="مثال: الرياضيات البحتة - الصف الثالث الثانوي"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الرابط اللاتيني (Slug)" hint="يستخدم في رابط صفحة الكورس">
                <Input
                  required
                  dir="ltr"
                  value={cSlug}
                  onChange={(e) => setCSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="pure-math-3sec"
                />
              </Field>
              <Field label="سعر الكورس (ج.م)">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  min="0"
                  value={cPrice}
                  onChange={(e) => setCPrice(e.target.value)}
                  placeholder="250"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الصف الدراسي">
                <Select value={cGrade} onChange={(e) => setCGrade(e.target.value)}>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الفرع / المادة">
                <Select value={cSubject} onChange={(e) => setCSubject(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="نبذة مختصرة عن المقرر">
              <Textarea
                rows={3}
                value={cSummary}
                onChange={(e) => setCSummary(e.target.value)}
                placeholder="شرح شامل وتفصيلي للمنهج مع حل اختبارات بنك الأسئلة والتدريبات..."
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="رابط صورة الغلاف (اختياري)" hint="تظهر على كارت الكورس في صفحة الكورسات — اتركه فارغاً للغلاف التلقائي">
                <Input
                  dir="ltr"
                  value={cCover}
                  onChange={(e) => setCCover(e.target.value)}
                  placeholder="https://i.ytimg.com/vi/.../maxresdefault.jpg"
                />
              </Field>
              {cCover ? (
                <div className="flex items-end pb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cCover}
                    alt="معاينة الغلاف"
                    className="h-16 w-28 rounded-xl border border-line object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
                  />
                </div>
              ) : null}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface2/50 p-3.5 transition-colors hover:border-brand/40">
              <input
                type="checkbox"
                checked={cSequential}
                onChange={(e) => setCSequential(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--brand)]"
              />
              <span>
                <span className="block text-xs font-bold text-ink">تسلسل إجباري للمشاهدة</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                  لن يستطيع الطالب فتح الفيديو التالي قبل إكمال الفيديو السابق بالترتيب.
                </span>
              </span>
            </label>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ ونشر المقرر
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "academic" && activeSubFeature === "videos_manage" && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <SectionHeader
              icon={Film}
              title="إدارة الفيديوهات والمحاضرات"
              count={localCourses.length}
              hint="اختر كورساً لفتح لوحة التخصيص الكاملة: ترتيب الدروس والمحاضرات وحد المشاهدات"
            />
            <span className="rounded-xl border border-line bg-surface2 px-3 py-2 text-[11px] font-medium text-muted">
              اترك حقل المشاهدات فارغاً = غير محدود
            </span>
          </Card>

          {localCourses.length === 0 ? (
            <Card className="grid place-items-center gap-2 p-14 text-center">
              <Film size={24} className="text-muted" />
              <p className="font-bold">لا توجد كورسات بعد</p>
              <p className="text-sm text-muted">أنشئ كورساً أولاً ثم أضف دروسه وفيديوهاته.</p>
              <Button onClick={() => setActiveSubFeature("courses_manage")} variant="primary" size="sm">
                <Plus size={14} /> إضافة كورس
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {localCourses.map((course) => {
                const courseLessons = localLessons.filter((l) => l.courseId === course.id);
                const lessonsTotal = courseLessons.length;
                const videosTotal = videos.filter((v) => courseLessons.some((l) => l.id === v.lessonId)).length;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setContentCourseId(course.id)}
                    className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-start shadow-card transition-all hover:border-brand/50 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative block size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface2">
                        {course.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.coverImageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-muted">
                            <BookOpen size={18} />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink group-hover:text-brand">{course.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">{course.gradeName} · {course.subjectName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted">
                        <Layers size={11} className="me-1 inline text-brand" />
                        {lessonsTotal} درس
                      </span>
                      <span className="rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted">
                        <Film size={11} className="me-1 inline text-brand" />
                        {videosTotal} فيديو
                      </span>
                      {course.requireSequentialProgress && (
                        <span className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                          <Link2 size={11} className="me-1 inline" />
                          متسلسل
                        </span>
                      )}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1.5 border-t border-line pt-3 text-xs font-bold text-brand">
                      فتح لوحة تخصيص الكورس
                      <ArrowUp size={13} className="-rotate-90 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeCategory === "academic" && activeSubFeature === "booklets_manage" && (
        <Card className="space-y-4 p-6">
          <SectionHeader icon={FileText} title="المذكرات والملازم المرفقة" count={courseFiles.length} />
          <AdminTable
            columns={fileColumns}
            rows={courseFiles}
            emptyTitle="لا توجد مذكرات مرفوعة"
            emptyHint="ستظهر ملفات PDF والمذكرات المرتبطة بالمقررات هنا."
          />
        </Card>
      )}

      {activeCategory === "academic" && activeSubFeature === "sections_manage" && (
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <SectionHeader icon={Layers} title="المراحل الدراسية" count={localStages.length} hint="أضف ورتّب المراحل التي تُبنى عليها الصفوف والمسارات" />
            <form onSubmit={handleAddStage} className="grid gap-3 rounded-2xl border border-line bg-surface2/50 p-4 sm:grid-cols-[1fr_180px_100px_auto]">
              <Field label="اسم المرحلة">
                <Input required value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="مثال: المرحلة الإعدادية" />
              </Field>
              <Field label="الرابط اللاتيني (اختياري)">
                <Input dir="ltr" value={stageSlug} onChange={(e) => setStageSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="prep-stage" />
              </Field>
              <Field label="الترتيب">
                <Input type="number" dir="ltr" min="0" value={stageOrder} onChange={(e) => setStageOrder(e.target.value)} />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={busy} variant="primary" className="w-full sm:w-auto">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  إضافة
                </Button>
              </div>
            </form>

            {localStages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">لا توجد مراحل بعد — أضف أول مرحلة من النموذج أعلاه.</p>
            ) : (
              <div className="divide-y divide-line">
                {[...localStages]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                      <input
                        defaultValue={s.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== s.name) handleUpdateStage(s, { name: v });
                        }}
                        aria-label={`اسم المرحلة ${s.name}`}
                        className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink outline-none transition-colors focus:border-brand"
                      />
                      <span className="font-mono text-[11px] text-muted" dir="ltr">/{s.slug}</span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={s.sortOrder}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v) && v !== s.sortOrder) handleUpdateStage(s, { sortOrder: v });
                        }}
                        aria-label={`ترتيب المرحلة ${s.name}`}
                        className="h-10 w-20 rounded-xl border border-line bg-surface px-3 text-center text-sm tabular-nums text-ink outline-none transition-colors focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => requestDeleteStage(s)}
                        aria-label={`حذف المرحلة ${s.name}`}
                        className="inline-flex cursor-pointer items-center rounded-lg border border-line px-2.5 py-2 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <SectionHeader icon={GraduationCap} title="الصفوف الدراسية المسجلة" count={grades.length} hint="الصفوف المرتبطة بالنظام الأكاديمي" />
            <div className="grid gap-3 sm:grid-cols-3">
              {grades.map((g) => (
                <div key={g.id} className="space-y-1 rounded-xl border border-line bg-surface2 p-4">
                  <p className="font-semibold text-ink">{g.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ 3. EXAMS & QUESTION BANK ═══ */}
      {activeCategory === "exams" && activeSubFeature === "exams_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={GraduationCap}
            title="جدول الامتحانات الإلكترونية"
            count={filteredExams.length}
            hint="يمكنك نشر أو إخفاء أو حذف الامتحانات فوراً"
            actions={
              <>
                <Select value={examModeFilter} onChange={(e) => setExamModeFilter(e.target.value)} className="h-9 w-32 text-xs">
                  <option value="all">كل الأنواع</option>
                  <option value="graded">امتحانات مقيمة</option>
                  <option value="practice">تدريبية</option>
                </Select>
                <Button onClick={() => setActiveSubFeature("exams_manage")} variant="primary" size="sm">
                  <Plus size={14} /> إنشاء امتحان
                </Button>
              </>
            }
          />
          <AdminTable
            columns={examColumns}
            rows={filteredExams}
            rowPending={(e) => pendingIds.has(`exam-${e.id}`)}
            emptyTitle="لا توجد امتحانات"
            emptyHint="أنشئ أول امتحان واربطه بمقرر دراسي."
            emptyAction={
              <Button onClick={() => setActiveSubFeature("exams_manage")} variant="primary" size="sm">
                <Plus size={14} /> إنشاء امتحان جديد
              </Button>
            }
          />
        </Card>
      )}

      {activeCategory === "exams" && activeSubFeature === "exams_manage" && (
        <Card className="mx-auto max-w-xl space-y-4 p-6">
          <SectionHeader
            icon={PlusCircle}
            title="إنشاء وتصميم امتحان جديد"
            actions={
              <Button onClick={() => setActiveSubFeature("exams_table")} variant="ghost" size="sm">
                العودة للجدول
              </Button>
            }
          />
          <form onSubmit={handleCreateExam} className="space-y-4">
            <Field label="عنوان الامتحان / الاختبار">
              <Input
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="امتحان تفاضل وتكامل - الوحدة الأولى (النهايات والاتصال)"
              />
            </Field>
            <Field label="المقرر الدراسي المرتبط">
              <Select value={examCourseId} onChange={(e) => setExamCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="مدة الامتحان (بالدقائق)">
                <Input required type="number" dir="ltr" min="5" max="300" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} />
              </Field>
              <Field label="نوع الاختبار">
                <Select value={examMode} onChange={(e) => setExamMode(e.target.value as "practice" | "graded")}>
                  <option value="graded">رسمي / مقيّم بدرجات</option>
                  <option value="practice">تدريبي / تجريبي</option>
                </Select>
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-medium text-ink">
              <input
                type="checkbox"
                checked={examIsPublished}
                onChange={(e) => setExamIsPublished(e.target.checked)}
                className="rounded accent-brand"
              />
              نشر الامتحان فوراً للطلاب المشتركين في المقرر
            </label>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ ونشر الامتحان
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "exams" && activeSubFeature === "questions_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={HelpCircle}
            title="بنك الأسئلة والتمارين"
            count={filteredQuestions.length}
            hint="أسئلة اختيار من متعدد مع الحلول النموذجية والخطوات"
            actions={
              <>
                <Select value={questionTopicFilter} onChange={(e) => setQuestionTopicFilter(e.target.value)} className="h-9 w-36 text-xs">
                  <option value="all">كل المواضيع</option>
                  {questionTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Button onClick={() => setActiveSubFeature("questions_manage")} variant="primary" size="sm">
                  <Plus size={14} /> سؤال فردي
                </Button>
                <Button onClick={() => setActiveSubFeature("bulk_questions_add")} variant="outline" size="sm">
                  <Layers size={14} /> إضافة مجمعة
                </Button>
              </>
            }
          />
          <AdminTable
            columns={questionColumns}
            rows={filteredQuestions}
            rowPending={(q) => pendingIds.has(`question-${q.id}`)}
            emptyTitle="بنك الأسئلة فارغ"
            emptyHint="أضف أسئلة فردية أو استورد مجموعة كاملة دفعة واحدة."
            emptyAction={
              <Button onClick={() => setActiveSubFeature("bulk_questions_add")} variant="primary" size="sm">
                <Layers size={14} /> استيراد أسئلة مجمعة
              </Button>
            }
          />
        </Card>
      )}

      {activeCategory === "exams" && activeSubFeature === "questions_manage" && (
        <Card className="mx-auto max-w-2xl space-y-4 p-6">
          <SectionHeader
            icon={HelpCircle}
            title="إضافة سؤال جديد لبنك الأسئلة"
            actions={
              <Button onClick={() => setActiveSubFeature("questions_table")} variant="ghost" size="sm">
                العودة للبنك
              </Button>
            }
          />
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="الفرع">
                <Select value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الموضوع / الدرس">
                <Input required value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="مثال: النهايات والدوال المثلثية" />
              </Field>
            </div>
            <Field label="نص السؤال أو المعادلة">
              <Textarea
                required
                rows={3}
                value={qPrompt}
                onChange={(e) => setQPrompt(e.target.value)}
                placeholder="إذا كانت س + ص = 10 و س² - ص² = 40، فما هي قيمة س - ص؟"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الخيار الأول (1)">
                <Input required value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} placeholder="4" />
              </Field>
              <Field label="الخيار الثاني (2)">
                <Input required value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} placeholder="6" />
              </Field>
              <Field label="الخيار الثالث (3)">
                <Input required value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} placeholder="8" />
              </Field>
              <Field label="الخيار الرابع (4)">
                <Input required value={qOpt4} onChange={(e) => setQOpt4(e.target.value)} placeholder="10" />
              </Field>
            </div>
            <Field label="رقم الخيار الصحيح">
              <Select value={qCorrectIdx} onChange={(e) => setQCorrectIdx(e.target.value)}>
                <option value="0">الخيار الأول (1)</option>
                <option value="1">الخيار الثاني (2)</option>
                <option value="2">الخيار الثالث (3)</option>
                <option value="3">الخيار الرابع (4)</option>
              </Select>
            </Field>
            <Field label="خطوات وتفسير الحل">
              <Textarea
                rows={2}
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="تحليل فرق بين مربعين: (س - ص)(س + ص) = 40 إذن (س - ص) * 10 = 40 ومنها س - ص = 4"
              />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              حفظ السؤال في البنك
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "exams" && activeSubFeature === "bulk_questions_add" && (
        <Card className="mx-auto max-w-2xl space-y-4 p-6">
          <SectionHeader
            icon={Layers}
            title="استيراد وإضافة أسئلة مجمعة"
            actions={
              <Button onClick={() => setActiveSubFeature("questions_table")} variant="ghost" size="sm">
                العودة للبنك
              </Button>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الفرع">
              <Select value={bulkSubjectId} onChange={(e) => setBulkSubjectId(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الموضوع الموحد للأسئلة">
              <Input value={bulkTopic} onChange={(e) => setBulkTopic(e.target.value)} placeholder="عام" />
            </Field>
          </div>
          <div className="rounded-xl border border-line bg-surface2/60 p-3.5 text-[13px] leading-relaxed text-muted">
            <p className="font-semibold text-ink">صيغة كل سؤال:</p>
            <p>
              سطر السؤال (يمكن أن يبدأ بترقيم)، ثم كل خيار في سطر، ثم سطر{" "}
              <span className="font-mono text-xs" dir="rtl">الإجابة: رقم الخيار</span> — ويفصل بين الأسئلة سطر فارغ.
            </p>
          </div>
          <Textarea
            rows={10}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="font-mono text-xs"
            placeholder={"1. ما هو ميل المستقيم 2x + 3y = 6؟\n-2/3\n3/2\n2/3\n-3/2\nالإجابة: 1\n\n2. إذا كان جا(س) = 0.5 فإن س = ؟\n30\n45\n60\n90\nالإجابة: 1"}
            aria-label="نص الأسئلة المجمعة"
          />
          <Button type="button" onClick={handleBulkImport} disabled={bulkBusy || !bulkText.trim()} variant="primary" className="w-full">
            {bulkBusy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {bulkBusy ? "جارٍ الإدراج..." : "معالجة وإدراج الأسئلة في البنك"}
          </Button>
          {bulkResult && (
            <div
              className={cn(
                "rounded-xl border p-4 text-[13px] leading-relaxed",
                bulkResult.added > 0 ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
              )}
              role="status"
            >
              <p className="font-semibold text-ink">
                النتيجة: تم إدراج {bulkResult.added} من {bulkResult.total} سؤالاً
                {bulkResult.errors.length > 0 ? ` — ورفض ${bulkResult.errors.length}` : ""}.
              </p>
              {bulkResult.errors.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                  {bulkResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      )}

      {activeCategory === "exams" && activeSubFeature === "exam_results_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader icon={CheckCircle2} title="نتائج ومحاولات الطلاب" count={attempts.length} hint="تصحيح تلقائي فوري مع رصد الدرجة" />
          <AdminTable
            columns={attemptColumns}
            rows={attempts}
            emptyTitle="لا توجد محاولات بعد"
            emptyHint="ستظهر نتائج الطلاب هنا فور تقديم أول امتحان."
          />
        </Card>
      )}

      {/* ═══ 4. BILLING & ACTIVATION CODES ═══ */}
      {activeCategory === "billing_codes" && activeSubFeature === "create_codes" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4 p-6">
            <SectionHeader icon={Sparkles} title="توليد وحفظ أكواد" hint="أكواد تفعيل كورس للسنتر، أو شحن محفظة، أو كوبونات خصم — تُحفظ تلقائياً في قاعدة البيانات" />
            <form onSubmit={handleBatchGenerateCodes} className="space-y-4">
              <Field label="نوع الكود">
                <Select value={codeKind} onChange={(e) => setCodeKind(e.target.value as typeof codeKind)} className="h-10 text-xs">
                  <option value="course_access">كود تفعيل كورس (للسنتر)</option>
                  <option value="wallet_balance">كود شحن محفظة</option>
                  <option value="course_percent">كوبون خصم نسبة</option>
                </Select>
              </Field>
              {codeKind === "course_access" && (
                <Field label="الكورس الذي يفعّله الكود">
                  <Select value={codeCourseId} onChange={(e) => setCodeCourseId(e.target.value)} className="h-10 text-xs">
                    {localCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </Field>
              )}
              {codeKind === "wallet_balance" && (
                <Field label="قيمة الشحن (ج.م)">
                  <Input required type="number" dir="ltr" min="5" value={codeAmount} onChange={(e) => setCodeAmount(e.target.value)} placeholder="150" />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="بادئة الكود (Prefix)">
                  <Input required dir="ltr" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value.toUpperCase())} placeholder="MATH" />
                </Field>
                <Field label="عدد الأكواد">
                  <Input required type="number" dir="ltr" min="1" max="100" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {codeKind === "course_percent" && (
                  <Field label="نسبة الخصم %">
                    <Input required type="number" dir="ltr" min="1" max="100" value={codePercent} onChange={(e) => setCodePercent(e.target.value)} />
                  </Field>
                )}
                <Field label="أقصى استخدام">
                  <Input required type="number" dir="ltr" min="1" value={codeMaxUses} onChange={(e) => setCodeMaxUses(e.target.value)} />
                </Field>
                <Field label="صالح لمدة (يوم)">
                  <Input required type="number" dir="ltr" min="1" max="365" value={codeDaysValid} onChange={(e) => setCodeDaysValid(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={busy} variant="primary" className="w-full">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                توليد وحفظ في قاعدة البيانات
              </Button>
            </form>
          </Card>

          <Card className="space-y-4 p-6">
            <SectionHeader
              icon={KeyRound}
              title="الأكواد المنشأة حديثاً"
              count={generatedCodes.length}
              actions={
                generatedCodes.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCodes.join("\n"));
                        pushToast("ok", "تم نسخ جميع الأكواد إلى الحافظة بنجاح!");
                      }}
                      className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <Copy size={13} /> نسخ الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintVouchersModal(generatedCodes)}
                      className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-gold hover:underline"
                    >
                      <Printer size={13} /> بطاقات السنتر
                    </button>
                  </div>
                ) : undefined
              }
            />
            {generatedCodes.length === 0 ? (
              <div className="space-y-2 py-12 text-center text-muted">
                <KeyRound size={32} className="mx-auto text-brand opacity-30" />
                <p className="text-sm">حدد الخيارات واضغط «توليد وحفظ» لإنشاء الأكواد وعرضها.</p>
              </div>
            ) : (
              <div className="custom-scrollbar grid max-h-96 gap-2.5 overflow-y-auto sm:grid-cols-2">
                {generatedCodes.map((code, idx) => (
                  <div key={code} className="flex items-center justify-between rounded-xl border border-line bg-surface2 p-2.5">
                    <span className="select-all font-mono text-xs font-semibold text-ink" dir="ltr">
                      {code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 1500);
                      }}
                      aria-label={`نسخ الكود ${code}`}
                      className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-brand"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "codes_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={KeyRound}
            title="سجل الأكواد في قاعدة البيانات"
            count={filteredCoupons.length}
            hint="فعّل أو عطّل أو احذف أي كود مباشرة من الجدول"
            actions={
              <Button onClick={() => setActiveSubFeature("create_codes")} variant="primary" size="sm">
                <Plus size={14} /> توليد أكواد جديدة
              </Button>
            }
          />
          <AdminTable
            columns={couponColumns}
            rows={filteredCoupons}
            rowPending={(c) => pendingIds.has(`coupon-${c.id}`)}
            emptyTitle="لا توجد أكواد"
            emptyHint="ولّد دفعة أكواد جديدة لتظهر هنا."
            emptyAction={
              <Button onClick={() => setActiveSubFeature("create_codes")} variant="primary" size="sm">
                <Plus size={14} /> توليد أكواد
              </Button>
            }
          />
        </Card>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "manual_payment" && (
        <Card className="mx-auto max-w-xl space-y-4 p-6">
          <SectionHeader
            icon={CreditCard}
            title="تفعيل اشتراك ودفع يدوي (سنتر / فودافون كاش)"
            actions={
              <Button onClick={() => setActiveSubFeature("subscriptions_table")} variant="ghost" size="sm">
                عرض الاشتراكات
              </Button>
            }
          />
          <form onSubmit={handleManualEnroll} className="space-y-4">
            <Field label="البريد الإلكتروني للطالب المسجل">
              <Input required type="email" dir="ltr" value={mpStudentEmail} onChange={(e) => setMpStudentEmail(e.target.value)} placeholder="student@example.com" />
            </Field>
            <Field label="المقرر المراد تفعيله">
              <Select
                value={mpCourseId}
                onChange={(e) => {
                  setMpCourseId(e.target.value);
                  const found = courses.find((c) => c.id === e.target.value);
                  if (found) setMpAmount(String(found.priceCents / 100));
                }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatEGP(c.priceCents)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="طريقة الدفع">
                <Select value={mpMethod} onChange={(e) => setMpMethod(e.target.value as typeof mpMethod)}>
                  <option value="center_cash">نقداً بالسنتر</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="instapay">إنستاباي</option>
                </Select>
              </Field>
              <Field label="المبلغ المحصل (ج.م)">
                <Input required type="number" dir="ltr" min="0" value={mpAmount} onChange={(e) => setMpAmount(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              تفعيل الاشتراك وتسجيل الإيصال
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "payment_requests" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={Receipt}
            title="طلبات شحن الرصيد"
            count={paymentRequests.filter((r) => r.status === "pending").length}
            hint="راجع إيصال التحويل ثم أصدر كود شحن رصيد أو كود تفعيل كورس — يصل الطالب عبر الإشعارات"
            actions={
              <div className="flex gap-1.5">
                {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPrFilter(f)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      prFilter === f ? "bg-brand text-white" : "bg-surface2 text-muted hover:text-ink"
                    }`}
                  >
                    {f === "pending" ? "معلقة" : f === "approved" ? "مقبولة" : f === "rejected" ? "مرفوضة" : "الكل"}
                  </button>
                ))}
              </div>
            }
          />

          {!prLoaded ? (
            <p className="py-10 text-center text-sm text-muted">جارِ التحميل…</p>
          ) : paymentRequests.filter((r) => prFilter === "all" || r.status === prFilter).length === 0 ? (
            <div className="space-y-2 py-12 text-center text-muted">
              <Receipt size={32} className="mx-auto text-brand opacity-30" />
              <p className="text-sm">لا توجد طلبات في هذه القائمة.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {paymentRequests
                .filter((r) => prFilter === "all" || r.status === prFilter)
                .map((r) => {
                  const kind = prIssueKind[r.id] ?? "wallet_balance";
                  const busy = prBusyId === r.id;
                  return (
                    <div key={r.id} className="space-y-3 rounded-2xl border border-line bg-surface2/40 p-4">
                      {/* student + request meta */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-ink">{r.studentName}</p>
                          <p className="truncate font-mono text-[11px] text-muted" dir="ltr">
                            {r.studentEmail}
                            {r.studentPhone ? ` · ${r.studentPhone}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            r.status === "pending"
                              ? "bg-amber-500/15 text-amber-600"
                              : r.status === "approved"
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                          }`}
                        >
                          {r.status === "pending" ? "معلق" : r.status === "approved" ? "مقبول" : "مرفوض"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                        <span>
                          المبلغ: <span className="font-mono font-bold text-ink">{r.amountEgp} ج.م</span>
                        </span>
                        <span>الطريقة: {r.method}</span>
                        {r.senderName ? <span>المحوّل: {r.senderName}</span> : null}
                        <span className="font-mono text-[10px]">{new Date(r.createdAt).toLocaleString("ar-EG")}</span>
                      </div>

                      {/* proof screenshot */}
                      <a
                        href={`/api/v1/admin/payment-requests/${r.id}/screenshot`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                      >
                        <ImageIcon size={13} /> عرض إيصال التحويل
                      </a>

                      {r.status === "approved" && r.issuedCode ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2">
                          <span className="select-all font-mono text-xs font-bold text-success" dir="ltr">
                            {r.issuedCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(r.issuedCode ?? "");
                              setPrCopiedId(r.id);
                              setTimeout(() => setPrCopiedId(null), 1500);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-success hover:underline"
                          >
                            {prCopiedId === r.id ? <Check size={12} /> : <Copy size={12} />} نسخ
                          </button>
                        </div>
                      ) : null}

                      {r.status === "rejected" && r.adminNote ? (
                        <p className="text-[11px] text-muted">سبب الرفض: {r.adminNote}</p>
                      ) : null}

                      {/* actions for pending */}
                      {r.status === "pending" ? (
                        prRejectOpen === r.id ? (
                          <div className="space-y-2 rounded-xl border border-danger/30 bg-danger/5 p-3">
                            <Input
                              placeholder="سبب الرفض (يظهر للطالب)"
                              value={prRejectNote}
                              onChange={(e) => setPrRejectNote(e.target.value)}
                              maxLength={500}
                            />
                            <div className="flex gap-2">
                              <Button variant="danger" size="sm" disabled={busy} onClick={() => handleRejectRequest(r.id)}>
                                {busy ? <Loader2 size={14} className="animate-spin" /> : null} تأكيد الرفض
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setPrRejectOpen(null)}>
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5 border-t border-line pt-3">
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPrIssueKind({ ...prIssueKind, [r.id]: "wallet_balance" })}
                                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
                                  kind === "wallet_balance"
                                    ? "border-brand bg-neon-lime-soft text-brand"
                                    : "border-line text-muted hover:text-ink"
                                }`}
                              >
                                كود شحن رصيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrIssueKind({ ...prIssueKind, [r.id]: "course_access" })}
                                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
                                  kind === "course_access"
                                    ? "border-brand bg-neon-lime-soft text-brand"
                                    : "border-line text-muted hover:text-ink"
                                }`}
                              >
                                كود تفعيل كورس
                              </button>
                            </div>

                            {kind === "wallet_balance" ? (
                              <Input
                                type="number"
                                min={1}
                                placeholder="مبلغ الرصيد ج.م"
                                value={prIssueAmount[r.id] ?? String(r.amountEgp)}
                                onChange={(e) => setPrIssueAmount({ ...prIssueAmount, [r.id]: e.target.value })}
                              />
                            ) : (
                              <Select
                                value={prIssueCourse[r.id] ?? ""}
                                onChange={(e) => setPrIssueCourse({ ...prIssueCourse, [r.id]: e.target.value })}
                              >
                                <option value="">— اختر الكورس —</option>
                                {courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </Select>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                                disabled={busy}
                                onClick={() => handleIssueRequestCode(r.id)}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                إصدار الكود وإشعار الطالب
                              </Button>
                              <Button variant="danger" size="sm" disabled={busy} onClick={() => setPrRejectOpen(r.id)}>
                                رفض
                              </Button>
                            </div>
                          </div>
                        )
                      ) : null}
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "orders_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader icon={Receipt} title="جدول الطلبات والمدفوعات" count={filteredOrders.length} hint="جميع عمليات الشراء عبر البوابة الإلكترونية" />
          <AdminTable
            columns={orderColumns}
            rows={filteredOrders}
            emptyTitle="لا توجد طلبات بعد"
            emptyHint="ستظهر عمليات الشراء الإلكترونية هنا فور حدوثها."
          />
        </Card>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "subscriptions_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={Receipt}
            title="سجل الاشتراكات"
            count={filteredSubscriptions.length}
            actions={
              <Button onClick={() => setActiveSubFeature("manual_payment")} variant="primary" size="sm">
                <Plus size={14} /> تفعيل اشتراك يدوي
              </Button>
            }
          />
          <AdminTable
            columns={subscriptionColumns}
            rows={filteredSubscriptions}
            emptyTitle="لا توجد اشتراكات"
            emptyHint="فعّل اشتراكاً يدوياً أو انتظر اشتراكات الطلاب الإلكترونية."
          />
        </Card>
      )}

      {activeCategory === "billing_codes" && activeSubFeature === "invoices_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader icon={Receipt} title="الفواتير والإيصالات المالية" count={invoices.length} />
          <AdminTable
            columns={invoiceColumns}
            rows={invoices}
            emptyTitle="لا توجد فواتير"
            emptyHint="تُصدر الفواتير تلقائياً مع كل عملية اشتراك."
          />
        </Card>
      )}

      {/* ═══ 5. USERS & STUDENTS ═══ */}
      {activeCategory === "users" && activeSubFeature === "users_table" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={Users}
            title="مستخدمو وطلاب المنصة"
            count={filteredUsers.length}
            hint="تعديل الرتب، تجميد/تفعيل الحسابات، وشحن وتعديل رصيد المحفظة"
            actions={
              <>
                <Select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="h-9 w-28 text-xs">
                  <option value="all">كل الرتب</option>
                  <option value="student">طلاب</option>
                  <option value="teacher">معلمون</option>
                  <option value="admin">مديرون</option>
                  <option value="assistant">مشرفون</option>
                </Select>
                <Select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="h-9 w-28 text-xs">
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط فقط</option>
                  <option value="inactive">مجمد فقط</option>
                </Select>
                <Button onClick={() => setActiveSubFeature("add_student")} variant="primary" size="sm">
                  <UserPlus size={14} /> إضافة طالب
                </Button>
              </>
            }
          />
          <AdminTable
            columns={userColumns}
            rows={filteredUsers}
            rowPending={(u) => pendingIds.has(`user-${u.id}`)}
            mobileTitle={(u) => (
              <div>
                <p className="font-semibold text-ink">{u.name}</p>
                <span className="text-[11px] text-muted" dir="ltr">{u.email}</span>
              </div>
            )}
            emptyTitle="لا يوجد مستخدمون مطابقون"
            emptyHint="جرّب تعديل البحث أو عوامل التصفية."
          />
        </Card>
      )}

      {activeCategory === "users" && activeSubFeature === "add_student" && (
        <Card className="mx-auto max-w-xl space-y-4 p-6">
          <SectionHeader
            icon={UserPlus}
            title="تسجيل حساب طالب جديد يدوياً"
            actions={
              <Button onClick={() => setActiveSubFeature("users_table")} variant="ghost" size="sm">
                العودة للجدول
              </Button>
            }
          />
          <form onSubmit={handleAddStudent} className="space-y-4">
            <Field label="الاسم الرباعي للطالب">
              <Input required value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="أحمد محمد السيد علي" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="البريد الإلكتروني">
                <Input required type="email" dir="ltr" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} placeholder="student@gmail.com" />
              </Field>
              <Field label="رقم الموبايل / واتساب">
                <Input dir="ltr" value={newStudentPhone} onChange={(e) => setNewStudentPhone(e.target.value)} placeholder="01012345678" />
              </Field>
            </div>
            <Field label="كلمة المرور الافتراضية" hint="يُنصح بأن يغيّر الطالب كلمة المرور بعد أول دخول">
              <Input required dir="ltr" value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)} />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              تسجيل الطالب وتفعيل الحساب
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "users" && activeSubFeature === "manage_admin" && (
        <Card className="space-y-4 p-6">
          <SectionHeader icon={ShieldCheck} title="المسؤولون والمشرفون" hint="الفريق الذي يملك صلاحيات الدخول إلى لوحة الإدارة" />
          <div className="divide-y divide-line">
            {localUsers.filter((u) => u.role !== "student").length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">لا يوجد حسابات إدارية بعد.</p>
            ) : (
              localUsers
                .filter((u) => u.role !== "student")
                .map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-semibold text-ink">{admin.name}</p>
                      <p className="text-muted" dir="ltr">{admin.email}</p>
                    </div>
                    <Badge tone="gold">{ROLE_LABELS[admin.role]}</Badge>
                  </div>
                ))
            )}
          </div>
        </Card>
      )}

      {activeCategory === "users" && activeSubFeature === "users_stats" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={Users} label="إجمالي الطلاب" value={localUsers.length} hint="جميع الحسابات المسجلة" />
          <KpiCard
            icon={UserCheck}
            label="الحسابات النشطة"
            value={localUsers.filter((u) => u.isActive).length}
            hint="غير مجمدة"
            hintTone="success"
            iconTone="success"
          />
          <KpiCard
            icon={Wallet}
            label="إجمالي أرصدة المحافظ"
            value={formatEGP(localUsers.reduce((sum, u) => sum + u.balanceCents, 0))}
            hint="أرصدة قابلة للاستخدام"
            hintTone="brand"
            iconTone="gold"
          />
        </div>
      )}

      {/* ═══ 6. COMMUNICATIONS & FORUM ═══ */}
      {activeCategory === "communications" && activeSubFeature === "sms_messages" && (
        <Card className="mx-auto max-w-xl space-y-4 p-6">
          <SectionHeader icon={Send} title="إرسال تنبيه جماعي" hint="يصل التنبيه كإشعار داخلي داخل منصة الطالب فوراً" />
          <form
            onSubmit={handleSendBroadcast}
            className="space-y-4"
          >
            <Field label="الشريحة المستهدفة">
              <Select value={smsTarget} onChange={(e) => setSmsTargetTyped(e.target.value)} className="h-10 text-xs">
                <option value="all">جميع المستخدمين المسجلين</option>
                <option value="students">الطلاب فقط</option>
                <option value="parents">أولياء الأمور</option>
                <option value="centers">السناتر</option>
                <option value="specific_students">طلاب محددون (بالمعرف/الإيميل)</option>
                <option value="course_students">طلاب كورس محدد</option>
              </Select>
            </Field>
            {smsTarget === "specific_students" && (
              <>
                <Field label="معرفات الطلاب (اختياري)">
                  <Textarea
                    rows={3}
                    value={smsStudentIds}
                    onChange={(e) => setSmsStudentIds(e.target.value)}
                    placeholder="معرفات مفصولة بفواصل: uuid1,uuid2,uuid3..."
                    className="font-mono text-xs"
                  />
                </Field>
                <Field label="إيميلات الطلاب (اختياري)">
                  <Textarea
                    rows={3}
                    value={smsStudentEmails}
                    onChange={(e) => setSmsStudentEmails(e.target.value)}
                    placeholder="إيميلات مفصولة بفواصل: email1@test.com,email2@test.com"
                    className="font-mono text-xs"
                  />
                </Field>
              </>
            )}
            {smsTarget === "course_students" && (
              <Field label="اختر الكورس">
                <Select value={smsCourseId} onChange={(e) => setSmsCourseId(e.target.value)} className="h-10 text-xs">
                  <option value="">اختر كورس...</option>
                  {localCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="عنوان التنبيه">
              <Input required value={smsTitle} onChange={(e) => setSmsTitle(e.target.value)} maxLength={120} placeholder="تم رفع امتحان التفاضل الشامل" />
            </Field>
            <Field label="نص التنبيه">
              <Textarea
                required
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                maxLength={500}
                placeholder="تنبيه: تم رفع امتحان التفاضل والتكامل الشامل على المنصة، يرجى الدخول والحل قبل نهاية الأسبوع..."
              />
            </Field>
            <Button type="submit" disabled={busy} variant="primary" className="w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              إرسال التنبيه الآن
            </Button>
          </form>
        </Card>
      )}

      {activeCategory === "communications" && activeSubFeature === "forum_pending_topics" && (
        <Card className="space-y-4 p-6">
          <SectionHeader
            icon={MessageSquare}
            title="مراجعة منشورات المجتمع"
            count={communityPosts.filter((p) => (p.status || "approved") === "pending").length}
            hint="اعتمد المنشورات لتظهر للطلاب، وردّ على أسئلة الطلاب بحل مصور أو فيديو يظهر كتعليق أسفل المنشور"
            actions={
              <div className="flex items-center gap-1.5" role="group" aria-label="تصفية بالحالة">
                {([
                  ["pending", "قيد المراجعة"],
                  ["approved", "معتمدة"],
                  ["rejected", "مرفوضة"],
                  ["all", "الكل"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPostStatusFilter(value)}
                    aria-pressed={postStatusFilter === value}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
                      postStatusFilter === value
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-line bg-surface text-muted hover:text-ink"
                    )}
                  >
                    {label}
                    {value !== "all" && (
                      <span className="ms-1 tabular-nums opacity-70">
                        ({communityPosts.filter((p) => (p.status || "approved") === value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            }
          />

          {visiblePosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">لا توجد منشورات في هذه الحالة.</p>
          ) : (
            <div className="divide-y divide-line">
              {visiblePosts.map((p) => {
                const key = `post-${p.id}`;
                const status = (p.status || "approved") as string;
                const draft = replyDrafts[p.id] ?? { body: "", mediaKind: "none", file: null as File | null };
                const replies = postReplies[p.id];
                return (
                  <div key={p.id} className={cn("space-y-3 py-4", pendingIds.has(key) && "opacity-50")}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-ink">
                        {p.authorName}
                        {p.repliesCount > 0 && (
                          <span className="ms-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand">
                            {p.repliesCount} رد
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge tone={status === "approved" ? "success" : status === "rejected" ? "danger" : "gold"}>
                          {status === "approved" ? "معتمد" : status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </Badge>
                        <Badge tone="brand">{p.courseTitle ?? "منتدى عام"}</Badge>
                        <span className="tabular-nums text-muted" dir="ltr">{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                    <p className="rounded-xl bg-surface2 p-3 text-[13px] leading-relaxed text-ink">{p.body}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      {status !== "approved" && (
                        <Button onClick={() => setPostStatus(p, "approved")} variant="primary" size="sm" disabled={pendingIds.has(key)}>
                          <CheckCheck size={13} /> اعتماد
                        </Button>
                      )}
                      {status !== "rejected" && (
                        <Button onClick={() => setPostStatus(p, "rejected")} variant="outline" size="sm" disabled={pendingIds.has(key)}>
                          <Ban size={13} /> رفض
                        </Button>
                      )}
                      <Button onClick={() => toggleReplies(p.id)} variant="ghost" size="sm">
                        <MessageSquare size={13} />
                        {replies ? "إخفاء الردود" : `الردود${p.repliesCount > 0 ? ` (${p.repliesCount})` : ""}`}
                      </Button>
                      <span className="tabular-nums text-[11px] text-muted">👍 {p.likesCount}</span>
                      <button
                        type="button"
                        onClick={() => requestDeletePost(p)}
                        disabled={pendingIds.has(key)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[11px] transition-colors hover:border-danger/50 hover:text-danger"
                      >
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>

                    {/* Assistant replies thread */}
                    {replies && (
                      <div className="space-y-2 rounded-xl border border-line bg-surface2/30 p-3">
                        {replies.loading ? (
                          <p className="flex items-center justify-center gap-2 py-3 text-xs text-muted">
                            <Loader2 size={14} className="animate-spin" /> جارٍ تحميل الردود...
                          </p>
                        ) : replies.rows.length === 0 ? (
                          <p className="py-2 text-center text-xs text-muted">لا توجد ردود بعد — كن أول من يجيب على الطالب.</p>
                        ) : (
                          replies.rows.map((r) => (
                            <div key={r.id} className="space-y-1.5 rounded-lg border border-line bg-surface p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                                  <ShieldCheck size={12} /> {r.authorName}
                                  <span className="text-muted">· مشرف</span>
                                </span>
                                <span className="tabular-nums text-muted" dir="ltr">{formatDate(r.createdAt)}</span>
                              </div>
                              {r.body && <p className="text-xs leading-relaxed text-ink">{r.body}</p>}
                              {r.mediaKey && r.mediaKind === "image" && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={`/api/v1/community/replies/${r.id}/media`}
                                  alt="مرفق الحل"
                                  className="max-h-64 rounded-lg border border-line object-contain"
                                />
                              )}
                              {r.mediaKey && r.mediaKind === "video" && (
                                <video controls src={`/api/v1/community/replies/${r.id}/media`} className="max-h-64 w-full rounded-lg border border-line" />
                              )}
                              {r.mediaKey && (r.mediaKind === "file" || r.mediaKind === "none") && (
                                <a
                                  href={`/api/v1/community/replies/${r.id}/media`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                                >
                                  <Paperclip size={12} /> فتح المرفق
                                </a>
                              )}
                            </div>
                          ))
                        )}

                        {/* Reply composer */}
                        <div className="space-y-2 rounded-lg border border-dashed border-line bg-surface p-3">
                          <Textarea
                            rows={2}
                            value={draft.body}
                            onChange={(e) => updateReplyDraft(p.id, { body: e.target.value })}
                            placeholder="اكتب حل السؤال أو شرحاً للطالب..."
                            aria-label={`الرد على منشور ${p.authorName}`}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <Select
                              value={draft.mediaKind}
                              onChange={(e) => updateReplyDraft(p.id, { mediaKind: e.target.value, file: null })}
                              aria-label="نوع المرفق"
                              className="h-8 w-36 text-xs"
                            >
                              <option value="none">بدون مرفق</option>
                              <option value="image">صورة حل</option>
                              <option value="video">فيديو حل</option>
                              <option value="file">ملف (PDF...)</option>
                            </Select>
                            {draft.mediaKind !== "none" && (
                              <>
                                <input
                                  type="file"
                                  accept={draft.mediaKind === "image" ? "image/*" : draft.mediaKind === "video" ? "video/mp4,video/webm,video/quicktime" : ".pdf,.doc,.docx,.zip"}
                                  onChange={(e) => updateReplyDraft(p.id, { file: e.target.files?.[0] ?? null })}
                                  aria-label="اختيار ملف المرفق"
                                  className="text-[11px] text-muted file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-surface2 file:px-2 file:py-1 file:text-[11px] file:font-semibold"
                                />
                                {draft.file && <span className="max-w-40 truncate text-[11px] text-muted">{draft.file.name}</span>}
                              </>
                            )}
                            <Button
                              onClick={() => submitReply(p)}
                              disabled={replyBusy[p.id]}
                              variant="primary"
                              size="sm"
                              className="ms-auto"
                            >
                              {replyBusy[p.id] ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                              نشر الرد
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ═══ ADVANCED SEARCH & FILTERS ═══ */}
      {activeCategory === "advanced_search" && activeSubFeature === "users_advanced" && (
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <SectionHeader
              icon={UserPlus}
              title="البحث المتقدم في المستخدمين والطلاب"
              count={filteredAdvancedUsers.length}
              hint="ابحث بالاسم أو البريد أو رقم الموبايل، وصفّي النتائج بالرتبة والحالة والاشتراك في كورس محدد وتاريخ التسجيل"
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="بحث فوري">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                  <Input
                    value={advQuery}
                    onChange={(e) => setAdvQuery(e.target.value)}
                    placeholder="اسم / بريد / موبايل..."
                    className="h-10 border-line bg-surface2 pr-9 text-xs"
                    aria-label="بحث في المستخدمين"
                  />
                </div>
              </Field>
              <Field label="الاشتراك في كورس">
                <Select value={advCourse} onChange={(e) => setAdvCourse(e.target.value)} className="h-10 text-xs">
                  <option value="all">كل الكورسات (أو بدون)</option>
                  {localCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="من تاريخ">
                  <input
                    type="date"
                    value={advFrom}
                    onChange={(e) => setAdvFrom(e.target.value)}
                    aria-label="التسجيل من تاريخ"
                    className="h-10 cursor-pointer rounded-xl border border-line bg-surface px-2.5 text-xs tabular-nums text-ink outline-none focus:border-brand"
                  />
                </Field>
                <Field label="إلى تاريخ">
                  <input
                    type="date"
                    value={advTo}
                    onChange={(e) => setAdvTo(e.target.value)}
                    aria-label="التسجيل إلى تاريخ"
                    className="h-10 cursor-pointer rounded-xl border border-line bg-surface px-2.5 text-xs tabular-nums text-ink outline-none focus:border-brand"
                  />
                </Field>
              </div>
            </div>
            <FilterChips
              label="تصفية بالرتبة"
              value={advRole}
              onChange={setAdvRole}
              options={[
                { value: "all", label: "كل الرتب" },
                { value: "student", label: "طلاب", count: localUsers.filter((u) => u.role === "student").length },
                { value: "parent", label: "أولياء أمور", count: localUsers.filter((u) => u.role === "parent").length },
                { value: "center", label: "سناتر", count: localUsers.filter((u) => u.role === "center").length },
                { value: "teacher", label: "مدرّسون", count: localUsers.filter((u) => u.role === "teacher").length },
                { value: "admin", label: "مشرفون", count: localUsers.filter((u) => u.role === "admin").length },
              ]}
            />
            <FilterChips
              label="تصفية بالحالة"
              value={advStatus}
              onChange={setAdvStatus}
              options={[
                { value: "all", label: "الكل" },
                { value: "active", label: "نشط", count: localUsers.filter((u) => u.isActive).length },
                { value: "frozen", label: "مجمّد", count: localUsers.filter((u) => !u.isActive).length },
              ]}
            />
            {(advQuery || advCourse !== "all" || advRole !== "all" || advStatus !== "all" || advFrom || advTo) && (
              <button
                type="button"
                onClick={() => {
                  setAdvQuery("");
                  setAdvCourse("all");
                  setAdvRole("all");
                  setAdvStatus("all");
                  setAdvFrom("");
                  setAdvTo("");
                }}
                className="cursor-pointer text-xs font-bold text-brand hover:underline"
              >
                مسح كل عوامل التصفية ✕
              </button>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">
                النتائج: <span className="tabular-nums text-brand">{filteredAdvancedUsers.length}</span> مستخدم
              </p>
              {canManageUsers && filteredAdvancedUsers.length > 0 && (
                <Button
                  onClick={() =>
                    downloadCSV(
                      "advanced_users_search",
                      filteredAdvancedUsers,
                      [
                        { key: "name", label: "الاسم" },
                        { key: "email", label: "البريد الإلكتروني" },
                        { key: "phone", label: "الموبايل" },
                        { key: "roleLabel", label: "الرتبة" },
                        { key: "status", label: "الحالة" },
                        { key: "courses", label: "الكورسات المشترك بها" },
                        { key: "balance", label: "رصيد المحفظة" },
                        { key: "createdAt", label: "تاريخ التسجيل" },
                      ]
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Download size={14} className="text-brand" /> تصدير CSV
                </Button>
              )}
            </div>
            <AdminTable
              columns={advancedUserColumns}
              rows={filteredAdvancedUsers}
              emptyTitle="لا توجد نتائج مطابقة"
              emptyHint="جرّب تعديل كلمة البحث أو إزالة بعض الفلاتر."
            />
          </Card>
        </div>
      )}

      {/* ═══ MODAL: COURSE CONTENT MANAGER (videos & lessons) ═══ */}
      {contentCourseId && (
        (() => {
          const course = localCourses.find((c) => c.id === contentCourseId);
          if (!course) return null;
          const courseLessons = localLessons
            .filter((l) => l.courseId === contentCourseId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <div
              className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setContentCourseId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setContentCourseId(null);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="content-manager-title"
                className="flex max-h-[88vh] w-full max-w-3xl animate-in fade-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
              >
                {/* dialog header */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <h3 id="content-manager-title" className="truncate font-brand text-base font-bold text-ink">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-muted">
                      لوحة التخصيص الكاملة · {courseLessons.length} درس ·{" "}
                      {videos.filter((v) => courseLessons.some((l) => l.id === v.lessonId)).length} فيديو
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentCourseId(null)}
                    aria-label="إغلاق لوحة التخصيص"
                    className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* dialog body */}
                <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
                  {courseLessons.length === 0 ? (
                    <div className="grid place-items-center gap-2 py-14 text-center">
                      <Layers size={22} className="text-muted" />
                      <p className="text-sm font-bold">لا توجد دروس في هذا الكورس بعد</p>
                      <p className="max-w-sm text-xs leading-relaxed text-muted">
                        تُضاف الدروس والفيديوهات ضمن استيراد المحتوى، وستظهر هنا فور توفرها لتتمكن من ترتيبها وتخصيصها.
                      </p>
                    </div>
                  ) : (
                    courseLessons.map((lesson, li) => {
                      const lessonVideos = videos.filter((v) => v.lessonId === lesson.id);
                      return (
                        <section key={lesson.id} className="space-y-2.5 rounded-xl border border-line bg-surface2/30 p-4">
                          {/* lesson header with reorder + rename */}
                          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2.5">
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => moveLesson(lesson, -1)}
                                disabled={li === 0}
                                aria-label={`تحريك الدرس ${lesson.title} لأعلى`}
                                title="تحريك الدرس لأعلى"
                                className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <span className="grid size-6 place-items-center rounded-md bg-surface text-[11px] font-bold tabular-nums text-muted">
                                {li + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => moveLesson(lesson, 1)}
                                disabled={li === courseLessons.length - 1}
                                aria-label={`تحريك الدرس ${lesson.title} لأسفل`}
                                title="تحريك الدرس لأسفل"
                                className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>
                            {renameTarget?.kind === "lesson" && renameTarget.id === lesson.id ? (
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                <Input
                                  value={renameTarget.title}
                                  onChange={(e) => updateRename({ title: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveRename();
                                    if (e.key === "Escape") setRenameTarget(null);
                                  }}
                                  autoFocus
                                  aria-label="اسم الدرس الجديد"
                                  className="h-8 flex-1 text-xs"
                                />
                                <Button onClick={saveRename} disabled={renameBusy} variant="primary" size="sm" className="h-7 px-2 text-[10px]">
                                  {renameBusy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                </Button>
                                <Button onClick={() => setRenameTarget(null)} variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                                  <X size={11} />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="min-w-0 flex-1 truncate text-xs font-bold text-ink">{lesson.title}</p>
                                <button
                                  type="button"
                                  onClick={() => setRenameTarget({ kind: "lesson", id: lesson.id, title: lesson.title })}
                                  title="إعادة تسمية الدرس"
                                  aria-label={`إعادة تسمية ${lesson.title}`}
                                  className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-brand"
                                >
                                  <Pencil size={12} />
                                </button>
                              </>
                            )}
                            {lesson.isFreePreview && <Badge tone="success">معاينة مجانية</Badge>}
                            <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
                              {lessonVideos.length} فيديو
                            </span>
                          </div>

                          {/* videos of the lesson */}
                          {lessonVideos.length === 0 ? (
                            <p className="py-2 text-center text-[11px] text-muted">لا توجد فيديوهات في هذا الدرس بعد.</p>
                          ) : (
                            lessonVideos.map((v, vi) => {
                              const draft = maxViewsDraft[v.id] ?? (v.maxViews != null ? String(v.maxViews) : "");
                              return (
                                <div
                                  key={v.id}
                                  className={cn(
                                    "flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:border-brand/30",
                                    pendingIds.has(`video-${v.id}`) && "opacity-50"
                                  )}
                                >
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => moveVideo(v, -1)}
                                      disabled={vi === 0}
                                      aria-label={`تحريك ${v.title} لأعلى`}
                                      title="تحريك لأعلى"
                                      className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <span className="grid size-5 place-items-center rounded bg-surface2 text-[10px] font-bold tabular-nums text-muted">
                                      {vi + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => moveVideo(v, 1)}
                                      disabled={vi === lessonVideos.length - 1}
                                      aria-label={`تحريك ${v.title} لأسفل`}
                                      title="تحريك لأسفل"
                                      className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>
                                  <div className="min-w-0 flex-1 basis-44">
                                    {renameTarget?.kind === "video" && renameTarget.id === v.id ? (
                                      <div className="space-y-1.5">
                                        <Input
                                          value={renameTarget.title}
                                          onChange={(e) => updateRename({ title: e.target.value })}
                                          autoFocus
                                          aria-label="عنوان الفيديو الجديد"
                                          className="h-7 text-xs"
                                        />
                                        <div className="flex items-center gap-1.5" dir="ltr">
                                          <Input
                                            value={renameTarget.youtubeId}
                                            onChange={(e) => updateRename({ youtubeId: e.target.value })}
                                            aria-label="معرف يوتيوب"
                                            placeholder="YouTube ID"
                                            className="h-7 flex-1 font-mono text-[11px]"
                                          />
                                          <Button onClick={saveRename} disabled={renameBusy} variant="primary" size="sm" className="h-7 px-2 text-[10px]">
                                            {renameBusy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                            حفظ
                                          </Button>
                                          <Button onClick={() => setRenameTarget(null)} variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                                            <X size={11} />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="truncate text-xs font-semibold text-ink">{v.title}</p>
                                        <p className="font-mono text-[10px] tabular-nums text-muted">
                                          {Math.round(v.durationSec / 60)} دقيقة · <span dir="ltr">{v.youtubeVideoId}</span>
                                        </p>
                                      </>
                                    )}
                                  </div>
                                  {!(renameTarget?.kind === "video" && renameTarget.id === v.id) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setRenameTarget({ kind: "video", id: v.id, title: v.title, youtubeId: v.youtubeVideoId })
                                        }
                                        title="تعديل العنوان ومعرف يوتيوب"
                                        aria-label={`تعديل ${v.title}`}
                                        className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-brand"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <div className="flex items-center gap-1.5">
                                        <EyeOff size={12} className="text-muted" />
                                        <Input
                                          type="number"
                                          min="1"
                                          dir="ltr"
                                          value={draft}
                                          onChange={(e) =>
                                            setMaxViewsDraft((prev) => ({ ...prev, [v.id]: e.target.value }))
                                          }
                                          placeholder="∞"
                                          aria-label={`حد مشاهدات ${v.title}`}
                                          className="h-7 w-16 border-line bg-surface2/50 text-center text-xs tabular-nums"
                                        />
                                        <Button
                                          onClick={() => saveMaxViews(v)}
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[10px]"
                                        >
                                          حفظ
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </section>
                      );
                    })
                  )}
                </div>

                {/* dialog footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-line px-5 py-3">
                  <p className="text-[11px] leading-relaxed text-muted">
                    الترتيب هنا هو نفسه ترتيب المشاهدة عند الطالب — والتسلسل الإجباري يتبعه أيضاً.
                  </p>
                  <Button onClick={() => setContentCourseId(null)} variant="primary" size="sm">
                    تم
                  </Button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* ═══ MODAL: COURSE COVER EDITOR ═══ */}
      {coverModal && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCoverModal(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setCoverModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cover-modal-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-lift animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 id="cover-modal-title" className="flex items-center gap-2 font-brand text-base font-semibold text-ink">
                <ImagePlus size={18} className="text-brand" /> صورة غلاف الكورس
              </h3>
              <button
                type="button"
                onClick={() => setCoverModal(null)}
                aria-label="إغلاق"
                className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs font-bold text-ink">{coverModal.course.title}</p>
            <Field label="رابط الصورة" hint="الصق رابط صورة مباشر (JPG/PNG/WebP) — اتركه فارغاً للغلاف التلقائي حسب المادة">
              <Input
                dir="ltr"
                value={coverModal.url}
                onChange={(e) => setCoverModal({ ...coverModal, url: e.target.value })}
                placeholder="https://i.ytimg.com/vi/.../maxresdefault.jpg"
              />
            </Field>
            <div className="grid h-36 place-items-center overflow-hidden rounded-xl border border-line bg-surface2">
              {coverModal.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverModal.url} alt="معاينة الغلاف" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted">معاينة الغلاف التلقائي</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCover} disabled={coverBusy} variant="primary" className="flex-1">
                {coverBusy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                حفظ الغلاف
              </Button>
              <Button onClick={() => setCoverModal(null)} variant="ghost">إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: WALLET ADJUSTMENT ═══ */}
      {walletModalUser && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setWalletModalUser(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setWalletModalUser(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-lift animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 id="wallet-modal-title" className="flex items-center gap-2 font-brand text-base font-semibold text-ink">
                <Wallet size={18} className="text-brand" /> تعديل رصيد محفظة الطالب
              </h3>
              <button
                type="button"
                onClick={() => setWalletModalUser(null)}
                aria-label="إغلاق"
                className="cursor-pointer rounded-md p-1 text-muted transition-colors hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1 rounded-xl bg-surface2 p-3 text-xs">
              <p>
                <strong>اسم الطالب:</strong> {walletModalUser.name}
              </p>
              <p>
                <strong>الرصيد الحالي:</strong>{" "}
                <span className="font-semibold tabular-nums text-brand">{formatEGP(walletModalUser.balanceCents)}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["50", "100", "200", "-50"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWalletAdjustAmount(amt)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                    walletAdjustAmount === amt
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line bg-surface text-muted hover:text-ink"
                  )}
                >
                  {Number(amt) > 0 ? `+${amt}` : amt} ج.م
                </button>
              ))}
            </div>
            <form onSubmit={handleAdjustWallet} className="space-y-4">
              <Field label="المبلغ المراد إضافته أو خصمه (ج.م) — استخدم السالب للخصم">
                <Input
                  required
                  type="number"
                  dir="ltr"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  placeholder="50 أو -50"
                />
              </Field>
              <Field label="سبب التعديل">
                <Input required value={walletAdjustReason} onChange={(e) => setWalletAdjustReason(e.target.value)} placeholder="مكافأة أو شحن يدوي بالسنتر" />
              </Field>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={busy} variant="primary" className="flex-1">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  حفظ وتعديل الرصيد
                </Button>
                <Button type="button" onClick={() => setWalletModalUser(null)} variant="ghost" className="flex-initial">
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: PRINTABLE CENTER VOUCHER CARDS ═══ */}
      {printVouchersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="my-8 flex max-h-[90vh] w-full max-w-4xl flex-col space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-lift">
            <div className="no-print flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-brand text-base font-semibold text-ink">
                  <Printer size={18} className="text-brand" /> بطاقات كروت السنتر الجاهزة للطباعة والقص
                </h3>
                <p className="text-xs text-muted">ستُطبع البطاقات فقط دون باقي عناصر الصفحة</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={printVouchers} variant="primary" size="sm" className="gap-1.5 text-xs">
                  <Printer size={14} /> طباعة البطاقات
                </Button>
                <button
                  type="button"
                  onClick={() => setPrintVouchersModal(null)}
                  aria-label="إغلاق"
                  className="cursor-pointer p-1 text-muted transition-colors hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="print-area custom-scrollbar grid gap-4 overflow-y-auto p-2 sm:grid-cols-2 lg:grid-cols-3">
              {printVouchersModal.map((code, idx) => (
                <div
                  key={`${code}-${idx}`}
                  className="relative space-y-3 overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface2/60 p-4"
                >
                  <div className="flex items-center justify-between border-b border-line/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-brand" />
                      <span className="text-xs font-semibold text-ink">دروس ماث Dros Math</span>
                    </div>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      كارت تفعيل كورس
                    </span>
                  </div>

                  <div className="space-y-1 py-2 text-center">
                    <p className="text-[10px] text-muted">كود التفعيل والشحن</p>
                    <div className="select-all rounded-lg border border-line bg-surface px-2 py-1.5 font-mono text-base font-bold tracking-wider text-brand">
                      {code}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line/40 pt-1 text-[9px] text-muted">
                    <span>صالح لكورس واحد كامل</span>
                    <span>www.dros-math.com</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Global overlays ── */}
      <StudentProfileModal
        student={profileUser}
        subscriptions={localSubscriptions}
        orders={orders}
        attempts={attempts}
        onClose={() => setProfileUser(null)}
        onAdjustWallet={(s) => {
          setProfileUser(null);
          setWalletModalUser(s);
        }}
      />
      <ConfirmDialog request={confirmReq} onDone={() => setConfirmReq(null)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={paletteCommands} />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
    </TablePrefsProvider>
  );
}
