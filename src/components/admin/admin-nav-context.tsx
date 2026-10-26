"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  findSubFeature,
  visibleCategories,
  visibleSubFeatures,
  type CategoryId,
} from "./nav-config";

const LAST_VIEW_KEY = "admin-last-view";

interface AdminNavValue {
  category: CategoryId | null;
  subFeature: string | null;
  /** Switches hub and resets to its first visible sub-feature. */
  setCategory: (category: CategoryId) => void;
  /** Switches to any visible sub-feature, resolving its owning hub automatically. */
  setSubFeature: (subFeatureId: string) => void;
  /** Live per-sub-feature counters rendered as sidebar badges. */
  badges: Record<string, number>;
  setBadges: (next: Record<string, number>) => void;
}

const AdminNavContext = createContext<AdminNavValue | null>(null);

function resolveView(subFeatureId: string | null): { category: CategoryId; subFeature: string } | null {
  if (!subFeatureId) return null;
  const found = findSubFeature(subFeatureId);
  if (!found) return null;
  return { category: found.category.id, subFeature: found.sub.id };
}

export function AdminNavProvider({
  children,
  actorPermissions,
  actorRole,
}: {
  children: ReactNode;
  actorPermissions: readonly string[];
  actorRole: string;
}) {
  const allowedCategories = useMemo(
    () => visibleCategories(actorPermissions, actorRole),
    [actorPermissions, actorRole],
  );
  const allowedSubFeatureIds = useMemo(
    () =>
      new Set(
        allowedCategories.flatMap((cat) =>
          visibleSubFeatures(cat, actorPermissions, actorRole).map((sub) => sub.id),
        ),
      ),
    [allowedCategories, actorPermissions, actorRole],
  );
  const firstCategory = allowedCategories[0] ?? null;
  const firstSubFeature = firstCategory
    ? visibleSubFeatures(firstCategory, actorPermissions, actorRole)[0]?.id ?? null
    : null;

  const [category, setCategoryState] = useState<CategoryId | null>(firstCategory?.id ?? null);
  const [subFeature, setSubFeatureState] = useState<string | null>(firstSubFeature);
  const [badges, setBadgesState] = useState<Record<string, number>>({});
  /* Blocks the URL-mirror effect until the initial view has been restored,
     otherwise the default view would overwrite a deep-link like ?s=videos_manage. */
  const restoredRef = useRef(false);

  /* Restore deep-link (?c=..&s=..) or last-visited view once after mount.
     Only allowed views are accepted; otherwise fall back to the first
     category the actor is permitted to see. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let saved: string | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(LAST_VIEW_KEY) ?? "null");
    } catch {
      saved = null;
    }
    const candidates = [resolveView(params.get("s")), resolveView(saved)];
    const target = candidates.find((c) => c !== null && allowedSubFeatureIds.has(c.subFeature));
    const t = window.setTimeout(() => {
      if (target) {
        setCategoryState(target.category);
        setSubFeatureState(target.subFeature);
      } else {
        setCategoryState(firstCategory?.id ?? null);
        setSubFeatureState(firstSubFeature);
      }
      restoredRef.current = true;
    }, 0);
    return () => window.clearTimeout(t);
  }, [allowedSubFeatureIds, firstCategory?.id, firstSubFeature]);

  /* Mirror the active view into the URL + storage so features are
     bookmarkable and survive reloads — without triggering server work. */
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const url = new URL(window.location.href);
      if (category && subFeature) {
        url.searchParams.set("c", category);
        url.searchParams.set("s", subFeature);
        localStorage.setItem(LAST_VIEW_KEY, JSON.stringify(subFeature));
      } else {
        url.searchParams.delete("c");
        url.searchParams.delete("s");
      }
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      /* storage/history unavailable */
    }
  }, [category, subFeature]);

  const setCategory = useCallback(
    (next: CategoryId) => {
      const cat = allowedCategories.find((c) => c.id === next);
      if (!cat) return;
      setCategoryState(next);
      const sub = visibleSubFeatures(cat, actorPermissions, actorRole)[0];
      setSubFeatureState(sub?.id ?? null);
    },
    [allowedCategories, actorPermissions, actorRole],
  );

  const setSubFeature = useCallback(
    (next: string) => {
      if (!allowedSubFeatureIds.has(next)) return;
      const resolved = resolveView(next);
      if (!resolved) return;
      setCategoryState(resolved.category);
      setSubFeatureState(resolved.subFeature);
    },
    [allowedSubFeatureIds],
  );

  const setBadges = useCallback((next: Record<string, number>) => {
    setBadgesState(next);
  }, []);

  const value = useMemo<AdminNavValue>(
    () => ({ category, subFeature, setCategory, setSubFeature, badges, setBadges }),
    [category, subFeature, setCategory, setSubFeature, badges, setBadges],
  );

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav(): AdminNavValue {
  const ctx = useContext(AdminNavContext);
  if (!ctx) throw new Error("useAdminNav must be used inside <AdminNavProvider>");
  return ctx;
}
