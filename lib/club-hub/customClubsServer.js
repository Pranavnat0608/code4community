import { FieldValue } from "firebase-admin/firestore";
import { BROAD_RUN_CLUBS, clubNameToSlug } from "@/lib/club-hub/broadRunClubDirectory";
import { normalizeClubMeetingDay } from "@/lib/club-hub/clubDirectorySections";
import { setClubMeetingDayAndClearSignups } from "@/lib/club-hub/clubMeetingDaysServer";
import {
  normalizeCustomClub,
  normalizeCustomClubSponsors,
  setCustomClubs,
} from "@/lib/club-hub/customClubStore";

export const CLUB_HUB_CUSTOM_CLUBS = "clubHubCustomClubs";

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function applyCustomClubsFromAdminDb(db) {
  if (!db) return;
  const snap = await db.collection(CLUB_HUB_CUSTOM_CLUBS).get();
  setCustomClubs(snap.docs.map((docSnap) => ({ ...docSnap.data(), slug: docSnap.id })));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ name: string, meetingDay: string, sponsors: { name: string, email: string }[], adminUid: string }} args
 */
export async function createCustomClub(db, args) {
  const name = String(args.name || "").trim().slice(0, 120);
  const adminUid = args.adminUid?.trim() || "";
  const meetingDay = normalizeClubMeetingDay(args.meetingDay);
  const sponsors = normalizeCustomClubSponsors(args.sponsors);
  if (!name) throw new Error("Enter a club name.");
  if (!adminUid) throw new Error("Not signed in.");
  if (!meetingDay) throw new Error("Pick Gold, Maroon, Gold & Maroon, or General.");
  if (sponsors.length === 0) throw new Error("Add at least one sponsor name and email.");

  const slug = clubNameToSlug(name);
  if (!slug || slug.length > 120) throw new Error("That club name cannot be used.");
  if (BROAD_RUN_CLUBS.some((club) => clubNameToSlug(club.name) === slug)) {
    throw new Error("A club with that name already exists.");
  }

  const ref = db.collection(CLUB_HUB_CUSTOM_CLUBS).doc(slug);
  const existing = await ref.get();
  if (existing.exists) throw new Error("A club with that name already exists.");

  const club = normalizeCustomClub({ slug, name, sponsors, meetingDay }, slug);
  if (!club) throw new Error("Enter the club name, meeting day, and a sponsor.");

  await ref.set({
    slug: club.slug,
    name: club.name,
    sponsors: club.sponsors,
    meetingDay: club.meetingDay,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: adminUid,
  });

  await setClubMeetingDayAndClearSignups(db, {
    slug: club.slug,
    clubName: club.name,
    meetingDay: club.meetingDay,
    adminUid,
  });

  return club;
}
