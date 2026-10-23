"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/firebase";
import { assertClientRateLimit } from "@/utils/clientRateLimit";
import {
  normalizeClubMeetingDay,
  setMeetingDayOverrides,
} from "@/lib/club-hub/clubDirectorySections";

export const CLUB_HUB_MEETING_DAYS_COLLECTION = "clubHubMeetingDays";

/** @returns {Promise<Record<string, import("@/lib/club-hub/clubDirectorySections").ClubMeetingDay>>} */
export async function fetchAllMeetingDayOverrides() {
  if (!firestore) return {};
  const snap = await getDocs(collection(firestore, CLUB_HUB_MEETING_DAYS_COLLECTION));
  /** @type {Record<string, import("@/lib/club-hub/clubDirectorySections").ClubMeetingDay>} */
  const map = {};
  for (const d of snap.docs) {
    const day = normalizeClubMeetingDay(d.data()?.meetingDay);
    if (day) map[d.id] = day;
  }
  return map;
}

/** @type {Promise<void> | null} */
let loadPromise = null;
const listeners = new Set();

/**
 * Load admin meeting-day overrides into clubDirectorySections (cached per page load).
 * @param {{ force?: boolean }} [options]
 */
export function loadMeetingDayOverrides({ force = false } = {}) {
  if (!loadPromise || force) {
    loadPromise = fetchAllMeetingDayOverrides()
      .then((map) => {
        setMeetingDayOverrides(map);
        for (const listener of listeners) listener();
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}

/**
 * Re-renders the caller once admin meeting-day overrides are loaded or change.
 * @returns {{ ready: boolean, version: number }}
 */
export function useMeetingDayOverrides() {
  const [state, setState] = useState({ ready: false, version: 0 });

  useEffect(() => {
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setState((s) => ({ ready: true, version: s.version + 1 }));
    };
    listeners.add(bump);
    loadMeetingDayOverrides().then(bump, bump);
    return () => {
      cancelled = true;
      listeners.delete(bump);
    };
  }, []);

  return state;
}

/**
 * @param {{
 *   slug: string,
 *   clubName: string,
 *   meetingDay: import("@/lib/club-hub/clubDirectorySections").ClubMeetingDay,
 *   adminUid: string,
 * }} args
 */
export async function saveClubMeetingDay({ slug, clubName, meetingDay, adminUid }) {
  if (!firestore) throw new Error("Firebase is not configured.");
  if (!slug) throw new Error("Missing club slug.");
  if (!adminUid) throw new Error("Not signed in.");
  const day = normalizeClubMeetingDay(meetingDay);
  if (!day) throw new Error("Pick Gold, Maroon, Gold & Maroon, or General.");

  assertClientRateLimit("clubHubPageWrite", adminUid);

  await setDoc(doc(firestore, CLUB_HUB_MEETING_DAYS_COLLECTION, slug), {
    slug,
    clubName: String(clubName || "").trim().slice(0, 120),
    meetingDay: day,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  });
  await loadMeetingDayOverrides({ force: true });
}

/** @param {{ slug: string, adminUid: string }} args */
export async function resetClubMeetingDay({ slug, adminUid }) {
  if (!firestore) throw new Error("Firebase is not configured.");
  if (!slug) throw new Error("Missing club slug.");
  if (!adminUid) throw new Error("Not signed in.");

  assertClientRateLimit("clubHubPageWrite", adminUid);
  await deleteDoc(doc(firestore, CLUB_HUB_MEETING_DAYS_COLLECTION, slug));
  await loadMeetingDayOverrides({ force: true });
}
