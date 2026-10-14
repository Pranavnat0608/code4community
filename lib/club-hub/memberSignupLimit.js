/** Max members sponsors may allow via signup (matches Firestore rules). */
export const MEMBER_SIGNUP_LIMIT_MAX = 5000;

/**
 * @param {unknown} raw
 * @returns {number | null} null = no limit
 */
export function normalizeMemberSignupLimit(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.floor(raw);
    if (n < 1) return null;
    return Math.min(n, MEMBER_SIGNUP_LIMIT_MAX);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, MEMBER_SIGNUP_LIMIT_MAX);
  }
  return null;
}

/**
 * @param {number} memberCount
 * @param {number | null | undefined} limit
 */
export function isClubMembershipFull(memberCount, limit) {
  const lim = normalizeMemberSignupLimit(limit);
  if (lim == null) return false;
  const count =
    typeof memberCount === "number" && Number.isFinite(memberCount)
      ? Math.max(0, Math.floor(memberCount))
      : 0;
  return count >= lim;
}

/** @param {number} memberCount @param {number | null | undefined} limit */
export function formatMemberSignupStatus(memberCount, limit) {
  const lim = normalizeMemberSignupLimit(limit);
  if (lim == null) return null;
  const count =
    typeof memberCount === "number" && Number.isFinite(memberCount)
      ? Math.max(0, Math.floor(memberCount))
      : 0;
  return `${count} / ${lim} members`;
}

export const CLUB_MEMBERSHIP_FULL_MESSAGE =
  "This club has reached its member signup limit. Contact the sponsor if you still want to join.";
