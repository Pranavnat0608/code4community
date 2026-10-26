import { isMathLabAdminUser } from "@/lib/auth/productAdmins";

/** Self-reported study hall (users/{uid}.reportedStudyHall): "1"–"8" or "none". */
export const STUDY_HALL_BLOCKS = ["1", "2", "3", "4", "5", "6", "7", "8"];
export const NO_STUDY_HALL = "none";

export const STUDY_HALL_OPTIONS = [
  ...STUDY_HALL_BLOCKS.map((value) => ({ value, label: `Block ${value}` })),
  { value: NO_STUDY_HALL, label: "No study hall" },
];

/** @param {unknown} value */
export function isStudyHallBlock(value) {
  return typeof value === "string" && STUDY_HALL_BLOCKS.includes(value);
}

/** @param {unknown} value */
export function studyHallLabel(value) {
  if (isStudyHallBlock(value)) return `Block ${value}`;
  if (value === NO_STUDY_HALL) return "No study hall";
  return "Not set";
}

/**
 * Teachers and Math Lab admins aren't limited by study hall.
 * @param {{ role?: string, email?: string } | null | undefined} user
 */
export function isStudyHallExempt(user) {
  const role = (user?.role || "").toLowerCase();
  if (role === "teacher" || role === "admin") return true;
  return isMathLabAdminUser(user, user?.email);
}

/**
 * Live (right-now) help only pairs a tutor and student who share a study hall block.
 * Tutors with no study hall can only take scheduled before/after-school sessions.
 * @param {{ role?: string, email?: string, reportedStudyHall?: string } | null | undefined} tutor
 * @param {{ studentStudyHall?: string }} request
 */
export function tutorCanTakeLiveRequest(tutor, request) {
  if (isStudyHallExempt(tutor)) return true;
  return (
    isStudyHallBlock(tutor?.reportedStudyHall) &&
    tutor.reportedStudyHall === request?.studentStudyHall
  );
}
