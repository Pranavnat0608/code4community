import { describe, expect, it } from "vitest";
import {
  formatMemberSignupStatus,
  isClubMembershipFull,
  normalizeMemberSignupLimit,
} from "@/lib/club-hub/memberSignupLimit";

describe("normalizeMemberSignupLimit", () => {
  it("treats empty as no limit", () => {
    expect(normalizeMemberSignupLimit(null)).toBe(null);
    expect(normalizeMemberSignupLimit("")).toBe(null);
    expect(normalizeMemberSignupLimit("  ")).toBe(null);
  });

  it("parses valid integers", () => {
    expect(normalizeMemberSignupLimit(25)).toBe(25);
    expect(normalizeMemberSignupLimit("40")).toBe(40);
  });

  it("rejects invalid values", () => {
    expect(normalizeMemberSignupLimit(0)).toBe(null);
    expect(normalizeMemberSignupLimit("abc")).toBe(null);
  });
});

describe("isClubMembershipFull", () => {
  it("is false when no limit", () => {
    expect(isClubMembershipFull(100, null)).toBe(false);
  });

  it("is true at limit", () => {
    expect(isClubMembershipFull(10, 10)).toBe(true);
    expect(isClubMembershipFull(11, 10)).toBe(true);
  });

  it("is false below limit", () => {
    expect(isClubMembershipFull(9, 10)).toBe(false);
  });
});

describe("formatMemberSignupStatus", () => {
  it("returns null without a limit", () => {
    expect(formatMemberSignupStatus(5, null)).toBe(null);
  });

  it("formats count and cap", () => {
    expect(formatMemberSignupStatus(3, 10)).toBe("3 / 10 members");
  });
});
