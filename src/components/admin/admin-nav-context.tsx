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
import { CATEGORIES, findSubFeature, type CategoryId } from "./nav-config";

const LAST_VIEW_KEY = "admin-last-view";
const DEFAULT_CATEGORY: CategoryId = "overview";
const DEFAULT_SUB_FEATURE = "home";

interface AdminNavValue {
  category: CategoryId;
  subFeature: string;
  /** Switches hub and resets to its first sub-feature. */
  setCategory: (category: CategoryId) => void;
  /** Switches to any sub-feature, resolving its owning hub automatically. */
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

export function AdminNavProvider({ children }: { children: ReactNode }) {
  const [category, setCategoryState] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [subFeature, setSubFeatureState] = useState<string>(DEFAULT_SUB_FEATURE);
  const [badges, setBadgesState] = useState<Record<string, number>>({});
  /* Blocks the URL-mirror effect until the initial view has been restored,
     otherwise the default view would overwrite a deep-link like ?s=videos_manage. */
  const restoredRef = useRef(false);

  /* Restore deep-link (?c=..&s=..) or last-visited view once after mount.
     Params are captured synchronously; state is applied deferred so SSR
     output stays consistent (no hydration mismatch). */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let saved: string | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(LAST_VIEW_KEY) ?? "null");
    } catch {
      saved = null;
    }
    const target = resolveView(params.get("s")) ?? resolveView(saved);
    const t = window.setTimeout(() => {
      if (target) {
        setCategoryState(target.category);
        setSubFeatureState(target.subFeature);
      }
      restoredRef.current = true;
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* Mirror the active view into the URL + storage so features are
     bookmarkable and survive reloads — without triggering server work. */
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("c", category);
      url.searchParams.set("s", subFeature);
      window.history.replaceState(window.history.state, "", url.toString());
      localStorage.setItem(LAST_VIEW_KEY, JSON.stringify(subFeature));
    } catch {
      /* storage/history unavailable */
    }
  }, [category, subFeature]);

  const setCategory = useCallback((next: CategoryId) => {
    const cat = CATEGORIES.find((c) => c.id === next);
    setCategoryState(next);
    if (cat?.subFeatures[0]) setSubFeatureState(cat.subFeatures[0].id);
  }, []);

  const setSubFeature = useCallback((next: string) => {
    const resolved = resolveView(next);
    if (!resolved) return;
    setCategoryState(resolved.category);
    setSubFeatureState(resolved.subFeature);
  }, []);

  const setBadges = useCallback((next: Record<string, number>) => {
    setBadgesState(next);
  }, []);

  const value = useMemo<AdminNavValue>(
    () => ({ category, subFeature, setCategory, setSubFeature, badges, setBadges }),
    [category, subFeature, setCategory, setSubFeature, badges, setBadges]
  );

  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav(): AdminNavValue {
  const ctx = useContext(AdminNavContext);
  if (!ctx) throw new Error("useAdminNav must be used inside <AdminNavProvider>");
  return ctx;
}
