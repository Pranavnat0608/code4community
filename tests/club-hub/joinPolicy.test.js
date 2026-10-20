import { describe, expect, it } from "vitest";
import { clubRequiresJoinApproval, normalizeJoinPolicy } from "@/lib/club-hub/joinPolicy";

describe("joinPolicy", () => {
  it("defaults to open join", () => {
    expect(normalizeJoinPolicy(undefined)).toBe("open");
    expect(normalizeJoinPolicy("nope")).toBe("open");
    expect(clubRequiresJoinApproval("open")).toBe(false);
  });

  it("recognizes approval required", () => {
    expect(normalizeJoinPolicy("approval")).toBe("approval");
    expect(clubRequiresJoinApproval("approval")).toBe(true);
  });
});
