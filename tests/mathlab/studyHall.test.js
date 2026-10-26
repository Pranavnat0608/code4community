import { describe, expect, it } from "vitest";
import {
  isStudyHallBlock,
  studyHallLabel,
  tutorCanTakeLiveRequest,
} from "@/lib/mathlab/studyHall";

const tutor = (reportedStudyHall, extra = {}) => ({
  role: "student",
  mathLabRole: "tutor",
  email: "tutor@example.com",
  reportedStudyHall,
  ...extra,
});

describe("isStudyHallBlock", () => {
  it("accepts blocks 1–8 only", () => {
    expect(isStudyHallBlock("1")).toBe(true);
    expect(isStudyHallBlock("8")).toBe(true);
    expect(isStudyHallBlock("9")).toBe(false);
    expect(isStudyHallBlock("none")).toBe(false);
    expect(isStudyHallBlock(3)).toBe(false);
    expect(isStudyHallBlock(undefined)).toBe(false);
  });
});

describe("tutorCanTakeLiveRequest", () => {
  it("pairs tutors and students with the same block", () => {
    expect(tutorCanTakeLiveRequest(tutor("3"), { studentStudyHall: "3" })).toBe(true);
    expect(tutorCanTakeLiveRequest(tutor("3"), { studentStudyHall: "4" })).toBe(false);
  });

  it("blocks tutors without a study hall from live requests", () => {
    expect(tutorCanTakeLiveRequest(tutor("none"), { studentStudyHall: "none" })).toBe(false);
    expect(tutorCanTakeLiveRequest(tutor(undefined), { studentStudyHall: undefined })).toBe(false);
  });

  it("rejects live requests missing a student block", () => {
    expect(tutorCanTakeLiveRequest(tutor("2"), {})).toBe(false);
  });

  it("lets teachers and Math Lab admins take any live request", () => {
    expect(tutorCanTakeLiveRequest(tutor("none", { role: "teacher" }), { studentStudyHall: "5" })).toBe(true);
    expect(tutorCanTakeLiveRequest(tutor(undefined, { mathLabAdmin: true }), { studentStudyHall: "5" })).toBe(true);
  });
});

describe("studyHallLabel", () => {
  it("formats values", () => {
    expect(studyHallLabel("6")).toBe("Block 6");
    expect(studyHallLabel("none")).toBe("No study hall");
    expect(studyHallLabel(undefined)).toBe("Not set");
  });
});
