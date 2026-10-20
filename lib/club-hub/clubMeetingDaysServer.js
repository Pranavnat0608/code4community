import { FieldValue } from "firebase-admin/firestore";
import {
  getDefaultMeetingDayForSlug,
  meetingChoicesAfterClubDayChange,
  normalizeClubMeetingDay,
  setMeetingDayOverrides,
} from "@/lib/club-hub/clubDirectorySections";
import {
  CLUB_HUB_MEETING_CHOICES,
  normalizeMeetingChoices,
} from "@/lib/club-hub/clubMeetingChoices";

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

/**
 * Save or reset a club's meeting day, then clear student signups for any day
 * that club no longer meets.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   slug: string,
 *   clubName?: string,
 *   meetingDay?: string,
 *   adminUid: string,
 *   reset?: boolean,
 * }} args
 */
export async function setClubMeetingDayAndClearSignups(db, args) {
  const slug = args.slug?.trim() || "";
  const adminUid = args.adminUid?.trim() || "";
  if (!slug) throw new Error("Missing club.");
  if (!adminUid) throw new Error("Not signed in.");

  const defaultDay = getDefaultMeetingDayForSlug(slug);
  const meetingDay = args.reset ? defaultDay : normalizeClubMeetingDay(args.meetingDay);
  if (!meetingDay) throw new Error("Pick Gold, Maroon, Gold & Maroon, or General.");

  const dayRef = db.collection(CLUB_HUB_MEETING_DAYS_COLLECTION).doc(slug);
  if (args.reset || meetingDay === defaultDay) {
    await dayRef.delete();
  } else {
    await dayRef.set({
      slug,
      clubName: String(args.clubName || "").trim().slice(0, 120),
      meetingDay,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminUid,
    });
  }

  const [goldSnap, maroonSnap] = await Promise.all([
    db.collection(CLUB_HUB_MEETING_CHOICES).where("goldClubSlug", "==", slug).get(),
    db.collection(CLUB_HUB_MEETING_CHOICES).where("maroonClubSlug", "==", slug).get(),
  ]);

  /** @type {Map<string, FirebaseFirestore.QueryDocumentSnapshot>} */
  const docs = new Map();
  for (const docSnap of goldSnap.docs) docs.set(docSnap.id, docSnap);
  for (const docSnap of maroonSnap.docs) docs.set(docSnap.id, docSnap);

  /** @type {{ userId: string, goldClubSlug: string, maroonClubSlug: string }[]} */
  const cleared = [];
  for (const [userId, docSnap] of docs) {
    const current = normalizeMeetingChoices(docSnap.data());
    const next = meetingChoicesAfterClubDayChange(current, slug, meetingDay);
    if (!next.changed) continue;
    await docSnap.ref.update({
      goldClubSlug: next.goldClubSlug,
      maroonClubSlug: next.maroonClubSlug,
      updatedAt: FieldValue.serverTimestamp(),
    });
    cleared.push({
      userId,
      goldClubSlug: next.goldClubSlug,
      maroonClubSlug: next.maroonClubSlug,
    });
  }

  /** @type {{ userId: string, displayName: string, goldClubSlug: string, maroonClubSlug: string }[]} */
  const rows = [];
  for (let i = 0; i < cleared.length; i += 50) {
    const chunk = cleared.slice(i, i + 50);
    const snaps = await db.getAll(...chunk.map((row) => db.collection("users").doc(row.userId)));
    chunk.forEach((row, index) => {
      const displayName = snaps[index]?.data()?.displayName?.trim() || "Student";
      rows.push({ ...row, displayName });
    });
  }

  return { meetingDay, rows };
}
