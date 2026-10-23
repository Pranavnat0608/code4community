import {
  normalizeClubMeetingDay,
  setMeetingDayOverrides,
} from "@/lib/club-hub/clubDirectorySections";

const CLUB_HUB_MEETING_DAYS_COLLECTION = "clubHubMeetingDays";

/**
 * Load admin meeting-day overrides (Admin SDK) before validating Gold/Maroon picks.
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function applyMeetingDayOverridesFromAdminDb(db) {
  if (!db) return;
  const snap = await db.collection(CLUB_HUB_MEETING_DAYS_COLLECTION).get();
  /** @type {Record<string, string>} */
  const map = {};
  for (const d of snap.docs) {
    const day = normalizeClubMeetingDay(d.data()?.meetingDay);
    if (day) map[d.id] = day;
  }
  setMeetingDayOverrides(map);
}
