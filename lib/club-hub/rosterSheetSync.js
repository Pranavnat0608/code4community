/**
 * Club membership rosters stay in Firestore. The spreadsheet only keeps
 * the Student meeting clubs tab.
 */

export async function syncClubRosterMemberJoin() {
  return { ok: true, skipped: true };
}

export async function syncClubRosterMemberLeave() {
  return { ok: true, skipped: true };
}

export async function bootstrapClubRosterSpreadsheet() {
  return { ok: true, skipped: true };
}
