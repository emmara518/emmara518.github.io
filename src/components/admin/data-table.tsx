"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Table preferences shared across every admin table (density + page size) ── */
export type TablePrefs = {
  density: Density;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
};

const TablePrefsContext = createContext<TablePrefs>({
  density: "comfortable",
  pageSize: 25,
  onPageSizeChange: () => {},
});

export function TablePrefsProvider({ value, children }: { value: TablePrefs; children: ReactNode }) {
  return <TablePrefsContext.Provider value={value}>{children}</TablePrefsContext.Provider>;
}

/** Drop-in DataTable wrapper that injects the shared density/page-size prefs. */
export function AdminTable<T extends { id: string }>(
  props: Omit<Parameters<typeof DataTable<T>>[0], "density" | "pageSize" | "onPageSizeChange"> & { pageSize?: number }
) {
  const prefs = useContext(TablePrefsContext);
  return (
    <DataTable<T>
      {...props}
      density={prefs.density}
      pageSize={props.pageSize ?? prefs.pageSize}
      onPageSizeChange={prefs.onPageSizeChange}
    />
  );
}

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Enable sorting on this column; value extractor */
  sortValue?: (row: T) => string | number;
  className?: string;
  /** Hide this field from the mobile card layout (e.g. redundant visuals) */
  hideOnMobile?: boolean;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;
export type Density = "comfortable" | "compact";

const DENSITY_CELL: Record<Density, string> = {
  comfortable: "p-3",
  compact: "px-2.5 py-1.5",
};
const DENSITY_HEAD: Record<Density, string> = {
  comfortable: "p-3",
  compact: "px-2.5 py-2",
};

/** Persisted page-size options */
export const PAGE_SIZES = [25, 50, 100] as const;

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle = "لا توجد بيانات بعد",
  emptyHint,
  emptyAction,
  pageSize: initialPageSize = 25,
  onPageSizeChange,
  mobileTitle,
  rowPending,
  caption,
  density = "comfortable",
  stickyHeader = true,
  /* Bulk selection */
  selectable = false,
  selectedIds,
  onSelectedChange,
  selectionLabel = "تحديد الصف",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  mobileTitle?: (row: T) => ReactNode;
  rowPending?: (row: T) => boolean;
  caption?: string;
  density?: Density;
  stickyHeader?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectedChange?: (ids: Set<string>) => void;
  selectionLabel?: string;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const pageSize = initialPageSize;

  // Clamp the effective page during render when the dataset shrinks (filters/search)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const effectivePage = Math.min(page, totalPages);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const getter = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "ar") * dir;
    });
  }, [rows, sort, columns]);

  const start = (effectivePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const pageSelectedCount = selectable
    ? pageRows.filter((r) => selectedIds?.has(r.id)).length
    : 0;
  const allPageSelected = selectable && pageRows.length > 0 && pageSelectedCount === pageRows.length;

  function toggleAllPage() {
    if (!onSelectedChange) return;
    const next = new Set(selectedIds ?? []);
    if (allPageSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    onSelectedChange(next);
  }

  function toggleRow(id: string) {
    if (!onSelectedChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  }

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface2/40 px-6 py-14 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-surface2 text-muted">
          <Inbox size={22} />
        </div>
        <p className="type-card-heading">{emptyTitle}</p>
        {emptyHint ? <p className="max-w-sm text-sm leading-relaxed text-muted">{emptyHint}</p> : null}
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Mobile: card list ── */}
      <div className="space-y-2.5 md:hidden">
        {pageRows.map((row) => {
          const pending = rowPending?.(row) ?? false;
          const selected = selectable && selectedIds?.has(row.id);
          return (
            <div
              key={row.id}
              className={cn(
                "rounded-xl border bg-surface p-4 space-y-2.5 transition-opacity",
                selected ? "border-brand ring-1 ring-brand/40" : "border-line",
                pending && "opacity-50 pointer-events-none"
              )}
            >
              <div className="flex items-start gap-2.5">
                {selectable && (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    aria-label={`${selectionLabel}: ${String(mobileTitle ? "" : columns[0]?.key)}`}
                    onClick={() => toggleRow(row.id)}
                    className={cn("mt-0.5 shrink-0 cursor-pointer", selected ? "text-brand" : "text-muted")}
                  >
                    {selected ? <CheckSquare size={17} /> : <Square size={17} />}
                  </button>
                )}
                <div className="font-semibold text-sm text-ink leading-relaxed flex-1">
                  {mobileTitle ? mobileTitle(row) : columns[0]?.render(row)}
                </div>
              </div>
              <div className="space-y-1.5">
                {columns.slice(1).map((col) =>
                  col.hideOnMobile ? null : (
                    <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted shrink-0">{col.header}</span>
                      <span className="text-ink text-end">{col.render(row)}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: table ── */}
      <div
        className={cn(
          "hidden md:block overflow-auto custom-scrollbar",
          stickyHeader && "max-h-[70vh]"
        )}
      >
        <table className="w-full text-right text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead
            className={cn(
              "border-b border-line text-xs font-bold uppercase tracking-tag text-muted bg-surface2 z-10",
              stickyHeader && "sticky top-0"
            )}
          >
            <tr>
              {selectable && (
                <th scope="col" className={cn(DENSITY_HEAD[density], "w-10")}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allPageSelected ? true : pageSelectedCount > 0 ? "mixed" : false}
                    aria-label="تحديد كل صفوف الصفحة"
                    onClick={toggleAllPage}
                    className={cn("cursor-pointer", allPageSelected || pageSelectedCount > 0 ? "text-brand" : "text-muted")}
                  >
                    {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} className={pageSelectedCount > 0 ? "opacity-60" : ""} />}
                  </button>
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th key={col.key} scope="col" className={cn(DENSITY_HEAD[density], "font-semibold", col.className)} aria-sort={isSorted ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-ink cursor-pointer",
                          isSorted && "text-brand"
                        )}
                      >
                        {col.header}
                        {isSorted ? (
                          sort!.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                        ) : (
                          <ChevronsUpDown size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pageRows.map((row) => {
              const pending = rowPending?.(row) ?? false;
              const selected = selectable && selectedIds?.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-surface2/50",
                    selected && "bg-brand/[0.06] hover:bg-brand/[0.09]",
                    pending && "opacity-50"
                  )}
                >
                  {selectable && (
                    <td className={DENSITY_CELL[density]}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        aria-label={selectionLabel}
                        onClick={() => toggleRow(row.id)}
                        className={cn("cursor-pointer", selected ? "text-brand" : "text-muted")}
                      >
                        {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn(DENSITY_CELL[density], "align-middle", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination + page size ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-muted" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            عرض {rows.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, rows.length)} من {rows.length}
          </span>
          {onPageSizeChange && (
            <label className="hidden items-center gap-1.5 sm:inline-flex">
              <span>عدد الصفوف:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="cursor-pointer rounded-lg border border-line bg-surface px-2 py-1 tabular-nums text-ink outline-none focus:border-brand"
                aria-label="عدد الصفوف في الصفحة"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, effectivePage - 1))}
              disabled={effectivePage === 1}
              aria-label="الصفحة السابقة"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-medium text-ink transition-colors hover:border-brand/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight size={14} />
              السابق
            </button>
            <span className="px-1 tabular-nums" aria-live="polite">
              {effectivePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, effectivePage + 1))}
              disabled={effectivePage === totalPages}
              aria-label="الصفحة التالية"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-medium text-ink transition-colors hover:border-brand/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              التالي
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
