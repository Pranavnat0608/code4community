import { isProtectedAdminEmail } from "@/config/admin";
import { normalizeEmail } from "@/lib/email";

export const MATHLAB_TEAM_PENDING_COLLECTION = "mathLabTeamPending";

/** @typedef {'tutor' | 'admin'} TeamGrantType */

/** @param {string} email */
export function pendingTeamDocId(email) {
  return normalizeEmail(email);
}

/** @param {{ grantType?: TeamGrantType } | null | undefined} pending */
export function applyPendingGrantToProfile(pending, profile, email) {
  if (!pending?.grantType) return profile;
  if (isProtectedAdminEmail(email)) {
    return { ...profile, role: "admin" };
  }
  if (pending.grantType === "admin") {
    return { ...profile, role: "admin" };
  }
  if (pending.grantType === "tutor") {
    return { ...profile, mathLabRole: "tutor" };
  }
  return profile;
}

export function mergePendingIntoTeam(parts, pendingRows) {
  const appointedEmails = new Set(
    parts.appointedAdmins.map((u) => normalizeEmail(u.email)).filter(Boolean),
  );
  const tutorEmails = new Set(parts.tutors.map((u) => normalizeEmail(u.email)).filter(Boolean));
  const protectedEmails = new Set(
    parts.protectedAdmins.map((u) => normalizeEmail(u.email)).filter(Boolean),
  );

  const appointedAdmins = [...parts.appointedAdmins];
  const tutors = [...parts.tutors];

  for (const row of pendingRows) {
    const email = normalizeEmail(row.email);
    if (!email || protectedEmails.has(email)) continue;
    if (row.grantType === "admin") {
      if (appointedEmails.has(email) || tutorEmails.has(email)) continue;
      appointedAdmins.push({ id: row.id, email, displayName: email, pending: true });
      appointedEmails.add(email);
    } else if (row.grantType === "tutor") {
      if (appointedEmails.has(email) || tutorEmails.has(email)) continue;
      tutors.push({ id: row.id, email, displayName: email, pending: true });
      tutorEmails.add(email);
    }
  }

  const byName = (a, b) =>
    (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "", undefined, {
      sensitivity: "base",
    });
  appointedAdmins.sort(byName);
  tutors.sort(byName);

  return { ...parts, appointedAdmins, tutors };
}
