export const UNICEF_HOUR_TYPES = ["In Club", "Out of Club", "Summer Hours"];

export const UNICEF_GRADES = ["Freshman", "Sophomore", "Junior", "Senior"];

export const DEFAULT_UNICEF_SETTINGS = {
  academicYear: "2026–27",
  clubName: "UNICEF",
  summerHoursCap: 10,
  outOfClubHoursCap: 15,
  hourGoalFreshman: 30,
  hourGoalSophomore: 30,
  hourGoalJunior: 30,
  hourGoalSenior: 30,
  clubHoursGoal: 0,
  infoHtml: "Meeting details, dues, and announcements will show up here.",
};

/** @param {Record<string, unknown> | null | undefined} raw */
export function normalizeUnicefSettings(raw) {
  const n = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  };
  return {
    academicYear:
      typeof raw?.academicYear === "string" && raw.academicYear.trim()
        ? raw.academicYear.trim().slice(0, 40)
        : DEFAULT_UNICEF_SETTINGS.academicYear,
    clubName:
      typeof raw?.clubName === "string" && raw.clubName.trim()
        ? raw.clubName.trim().slice(0, 80)
        : DEFAULT_UNICEF_SETTINGS.clubName,
    summerHoursCap: n(raw?.summerHoursCap, DEFAULT_UNICEF_SETTINGS.summerHoursCap),
    outOfClubHoursCap: n(raw?.outOfClubHoursCap, DEFAULT_UNICEF_SETTINGS.outOfClubHoursCap),
    hourGoalFreshman: n(raw?.hourGoalFreshman, DEFAULT_UNICEF_SETTINGS.hourGoalFreshman),
    hourGoalSophomore: n(raw?.hourGoalSophomore, DEFAULT_UNICEF_SETTINGS.hourGoalSophomore),
    hourGoalJunior: n(raw?.hourGoalJunior, DEFAULT_UNICEF_SETTINGS.hourGoalJunior),
    hourGoalSenior: n(raw?.hourGoalSenior, DEFAULT_UNICEF_SETTINGS.hourGoalSenior),
    clubHoursGoal: n(raw?.clubHoursGoal, DEFAULT_UNICEF_SETTINGS.clubHoursGoal),
    infoHtml:
      typeof raw?.infoHtml === "string"
        ? raw.infoHtml.slice(0, 20000)
        : DEFAULT_UNICEF_SETTINGS.infoHtml,
  };
}

/** @param {ReturnType<typeof normalizeUnicefSettings>} settings @param {string} grade */
export function hourGoalForGrade(settings, grade) {
  if (grade === "Sophomore") return settings.hourGoalSophomore;
  if (grade === "Junior") return settings.hourGoalJunior;
  if (grade === "Senior") return settings.hourGoalSenior;
  return settings.hourGoalFreshman;
}

/**
 * Approved hours only. Out-of-club and summer totals are capped.
 * @param {{ hourType?: string, hoursCompleted?: number, status?: string }[]} submissions
 * @param {ReturnType<typeof normalizeUnicefSettings>} settings
 */
export function tallyApprovedHours(submissions, settings) {
  let inClub = 0;
  let outRaw = 0;
  let summerRaw = 0;
  for (const row of submissions) {
    if (row.status !== "approved") continue;
    const hours = Number(row.hoursCompleted) || 0;
    if (row.hourType === "In Club") inClub += hours;
    else if (row.hourType === "Out of Club") outRaw += hours;
    else if (row.hourType === "Summer Hours") summerRaw += hours;
  }
  const outOfClub = Math.min(outRaw, settings.outOfClubHoursCap);
  const summer = Math.min(summerRaw, settings.summerHoursCap);
  return {
    inClub,
    outRaw,
    outOfClub,
    summerRaw,
    summer,
    total: inClub + outOfClub + summer,
  };
}
