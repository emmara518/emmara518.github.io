/** Pure exam timing rules; the service uses the same functions as the tests. */

export const SUBMIT_GRACE_MS = 5_000;

export function computeAttemptExpiry(
  startedAt: Date,
  durationMin: number,
  availableUntil: Date | null | undefined,
): Date {
  const durationMs = Math.max(1, durationMin) * 60_000;
  const windowEnd = availableUntil?.getTime() ?? Number.POSITIVE_INFINITY;
  return new Date(Math.min(startedAt.getTime() + durationMs, windowEnd));
}

export function isAttemptExpired(expiresAt: Date, now: Date, graceMs = SUBMIT_GRACE_MS): boolean {
  return now.getTime() > expiresAt.getTime() + graceMs;
}

export function questionDeadline(
  startedAt: Date,
  perQuestionSec: number,
  questionIndex: number,
  graceMs = SUBMIT_GRACE_MS,
): Date {
  return new Date(startedAt.getTime() + Math.max(1, perQuestionSec) * (questionIndex + 1) * 1000 + graceMs);
}

export function isQuestionExpired(deadline: Date, now: Date): boolean {
  return now.getTime() > deadline.getTime();
}
