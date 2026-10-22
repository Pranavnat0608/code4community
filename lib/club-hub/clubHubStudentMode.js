import { normalizeEmail } from "@/lib/email";

/** These accounts get the Settings toggle and student-mode club UI. */
export const CLUB_HUB_STUDENT_MODE_EMAILS = ["1021676@lcps.org", "1074443@lcps.org"];

/** @param {string | null | undefined} email */
export function isClubHubStudentModeAccount(email) {
  return CLUB_HUB_STUDENT_MODE_EMAILS.includes(normalizeEmail(email));
}

/** @param {string | null | undefined} email */
export function canOfferClubHubStudentMode(email) {
  return isClubHubStudentModeAccount(email);
}

/**
 * @param {{ clubHubStudentMode?: boolean } | null | undefined} userData
 * @param {string | null | undefined} email
 */
export function isClubHubStudentModeActive(userData, email) {
  if (!isClubHubStudentModeAccount(email)) return false;
  return userData?.clubHubStudentMode === true;
}
