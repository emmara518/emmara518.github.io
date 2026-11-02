/**
 * Learning progress policy.
 *
 * Assurance level: the server owns completion and never trusts a client
 * `completed` flag. Completion is derived from the submitted watched duration
 * against the authoritative video duration. YouTube iframe playback does not
 * expose cryptographically trustworthy watch telemetry, so a determined client
 * can still claim elapsed seconds. This is a deliberate product limitation, not
 * proof of actual viewing; the server rejects impossible values and enforces
 * monotonic progress, enrollment, sequence order, and view limits.
 */

export const MAX_PROGRESS_SECONDS = 24 * 60 * 60;

export function normalizeWatchedSeconds(
  submitted: number,
  durationSec: number,
): { watchedSeconds: number; completed: boolean } {
  if (!Number.isFinite(submitted) || submitted < 0) {
    throw new Error("INVALID_WATCHED_SECONDS");
  }
  if (!Number.isInteger(submitted)) {
    throw new Error("INVALID_WATCHED_SECONDS");
  }
  if (submitted > MAX_PROGRESS_SECONDS) {
    throw new Error("INVALID_WATCHED_SECONDS");
  }
  if (durationSec > 0 && submitted > durationSec) {
    throw new Error("EXCESSIVE_WATCHED_SECONDS");
  }

  const watchedSeconds = durationSec > 0 ? Math.min(submitted, durationSec) : 0;
  return {
    watchedSeconds,
    completed: durationSec > 0 && watchedSeconds >= durationSec,
  };
}

export function mergeWatchedSeconds(previous: number, next: number): number {
  return Math.max(Math.max(0, previous), Math.max(0, next));
}
