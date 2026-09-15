import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";

/**
 * Per-user notification + appearance preferences — DB-backed.
 *
 * One typed row per user in `user_preferences` (see schema.ts + the v6 block
 * in init-sql.ts). This replaced the v1 filesystem store
 * (`data/prefs/{userId}.json`), which is unwritable on serverless hosts and
 * made every Vercel `PUT /api/v1/me/preferences` fail with HTTP 500.
 *
 * `getPreferences` always returns a fully-populated object: a missing row (or
 * any read failure) falls back to `DEFAULT_PREFERENCES`, so GET never 500s.
 * `setPreferences` upserts ONLY the provided keys in a single statement, so
 * concurrent PUTs touching different keys cannot clobber each other and no
 * filesystem write/race exists anywhere in this module.
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

type PreferencesRow = typeof userPreferences.$inferSelect;

/** Map a DB row (or lack of one) to the typed, fully-populated shape. Pure. */
export function rowToPreferences(row: PreferencesRow | undefined): UserPreferences {
  if (!row) {
    return { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications } };
  }
  const n = DEFAULT_PREFERENCES.notifications;
  return {
    notifications: {
      community: row.notifCommunity ?? n.community,
      examResults: row.notifExamResults ?? n.examResults,
      wallet: row.notifWallet ?? n.wallet,
      marketing: row.notifMarketing ?? n.marketing,
    },
    density: row.density === "compact" ? "compact" : "comfortable",
  };
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  try {
    const rows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return rowToPreferences(rows[0]);
  } catch {
    // DB unreadable — return defaults. GET never throws (contract preserved).
    return rowToPreferences(undefined);
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
  // Column-wise single-statement upsert: only provided keys are written, so a
  // concurrent PUT touching other keys cannot be lost. No read-modify-write.
  const values: Partial<PreferencesRow> & { userId: string } = { userId };
  const patch = partial ?? {};
  if (patch.density !== undefined) values.density = patch.density;
  if (patch.notifications?.community !== undefined) values.notifCommunity = patch.notifications.community;
  if (patch.notifications?.examResults !== undefined) values.notifExamResults = patch.notifications.examResults;
  if (patch.notifications?.wallet !== undefined) values.notifWallet = patch.notifications.wallet;
  if (patch.notifications?.marketing !== undefined) values.notifMarketing = patch.notifications.marketing;

  const rows = await db
    .insert(userPreferences)
    .values(values)
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        ...(values.density !== undefined ? { density: values.density } : {}),
        ...(values.notifCommunity !== undefined ? { notifCommunity: values.notifCommunity } : {}),
        ...(values.notifExamResults !== undefined ? { notifExamResults: values.notifExamResults } : {}),
        ...(values.notifWallet !== undefined ? { notifWallet: values.notifWallet } : {}),
        ...(values.notifMarketing !== undefined ? { notifMarketing: values.notifMarketing } : {}),
        updatedAt: new Date(),
      },
    })
    .returning();
  return rowToPreferences(rows[0]);
}
