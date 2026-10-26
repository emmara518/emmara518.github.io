/** Exam policy helpers kept pure so they can be unit-tested without a DB. */

/** Exams without an explicit cap get a finite default (no unlimited attempts). */
export const DEFAULT_MAX_ATTEMPTS = 5;

export function effectiveMaxAttempts(value: number | null | undefined): number {
  return value ?? DEFAULT_MAX_ATTEMPTS;
}

/** Answers may be revealed only when configured, or after the exam window. */
export function shouldRevealResults(
  showImmediately: boolean,
  availableUntil: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return showImmediately || (availableUntil != null && availableUntil <= now);
}
