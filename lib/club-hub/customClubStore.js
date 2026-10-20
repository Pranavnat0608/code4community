import { isValidEmail, normalizeEmail } from "@/lib/email";

const MEETING_DAYS = ["gold", "maroon", "both", "general"];

/** @typedef {{ name: string, email: string }} CustomClubSponsor */
/** @typedef {{ slug: string, name: string, sponsors: CustomClubSponsor[], meetingDay: string }} CustomClub */

/**
 * @param {unknown} raw
 * @returns {CustomClubSponsor[]}
 */
export function normalizeCustomClubSponsors(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {CustomClubSponsor[]} */
  const sponsors = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const name = String(item.name || "").trim().slice(0, 100);
    const email = normalizeEmail(item.email);
    if (!name || !isValidEmail(email)) continue;
    sponsors.push({ name, email });
  }
  return sponsors.slice(0, 8);
}

/**
 * @param {unknown} raw
 * @param {string} [id]
 * @returns {CustomClub | null}
 */
export function normalizeCustomClub(raw, id = "") {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim().slice(0, 120);
  const slug = String(raw.slug || id || "").trim();
  const meetingDay = MEETING_DAYS.includes(raw.meetingDay) ? raw.meetingDay : "";
  const sponsors = normalizeCustomClubSponsors(raw.sponsors);
  if (!name || !slug || !meetingDay || sponsors.length === 0) return null;
  return { slug, name, sponsors, meetingDay };
}

/** @type {CustomClub[]} */
let customClubs = [];

/** @param {unknown[]} records */
export function setCustomClubs(records) {
  /** @type {CustomClub[]} */
  const next = [];
  for (const record of records || []) {
    const club = normalizeCustomClub(record, record?.slug);
    if (club) next.push(club);
  }
  customClubs = next;
}

/** @returns {CustomClub[]} */
export function getCustomClubs() {
  return customClubs;
}
