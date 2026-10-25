import { firestoreToDate } from "@/lib/firestoreDates";

/** Open in-person passes close themselves after this long. */
export const HALL_PASS_AUTO_CLOSE_MS = 60 * 60 * 1000;

/** Start time once the student presses Start, otherwise when the pass was created. */
export function hallPassOpenSince(session) {
  return firestoreToDate(session?.hallPassStartedAt) || firestoreToDate(session?.createdAt);
}

/** @param {Date | null | undefined} since @param {Date} [now] */
export function isPastHallPassAutoClose(since, now = new Date()) {
  if (!(since instanceof Date) || Number.isNaN(since.getTime())) return false;
  return now.getTime() - since.getTime() >= HALL_PASS_AUTO_CLOSE_MS;
}
