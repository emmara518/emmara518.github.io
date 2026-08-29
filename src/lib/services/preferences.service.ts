import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Per-user notification + appearance preferences.
 *
 * NOTE: this v1 implementation persists to a JSON file under `data/prefs/{userId}.json`.
 * The user table has no dedicated `preferences` column, so a filesystem blob is the
 * cheapest viable stub. The long-term plan is a real DB column (or kv) — at which
 * point only the read/write functions below need to change.
 *
 * The directory is configurable via `PREFS_DIR` (defaults to `./data/prefs`).
 * `getPreferences` always returns a fully-populated object: missing keys fall back
 * to `DEFAULT_PREFERENCES`. `setPreferences` shallow-merges the partial input.
 */

export type UserPreferences = {
  notifications: {
    community: boolean;
    examResults: boolean;
    wallet: boolean;
    marketing: boolean;
  };
  density: "comfortable" | "compact";
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    community: true,
    examResults: true,
    wallet: true,
    marketing: false,
  },
  density: "comfortable",
};

const PREFS_DIR = process.env.PREFS_DIR || path.join(process.cwd(), "data", "prefs");

function pathFor(userId: string): string {
  // Sanitize — userId should be a uuid, but defend against path traversal.
  const safe = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  return path.join(PREFS_DIR, `${safe}.json`);
}

async function ensureDir(): Promise<void> {
  await mkdir(PREFS_DIR, { recursive: true });
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  try {
    const raw = await readFile(pathFor(userId), "utf8");
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return mergePreferences(parsed);
  } catch {
    // File missing or unreadable — return defaults. Never throw on read.
    return { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications } };
  }
}

export type UserPreferencesPatch = {
  notifications?: Partial<UserPreferences["notifications"]>;
  density?: UserPreferences["density"];
};

export async function setPreferences(
  userId: string,
  partial: UserPreferencesPatch,
): Promise<UserPreferences> {
  const current = await getPreferences(userId);
  const next = mergePreferences({
    notifications: { ...current.notifications, ...(partial.notifications ?? {}) },
    density: partial.density ?? current.density,
  });
  await ensureDir();
  await writeFile(pathFor(userId), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function mergePreferences(input: Partial<UserPreferences> | undefined): UserPreferences {
  return {
    notifications: {
      community:
        input?.notifications?.community ?? DEFAULT_PREFERENCES.notifications.community,
      examResults:
        input?.notifications?.examResults ?? DEFAULT_PREFERENCES.notifications.examResults,
      wallet: input?.notifications?.wallet ?? DEFAULT_PREFERENCES.notifications.wallet,
      marketing:
        input?.notifications?.marketing ?? DEFAULT_PREFERENCES.notifications.marketing,
    },
    density: input?.density ?? DEFAULT_PREFERENCES.density,
  };
}
