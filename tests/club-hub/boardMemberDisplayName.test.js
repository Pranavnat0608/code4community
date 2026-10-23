import { describe, expect, it } from "vitest";
import { resolveBoardMemberDisplayName } from "@/lib/club-hub/boardMembersServer";

describe("resolveBoardMemberDisplayName", () => {
  it("prefers Broad Run roster over auth display name", () => {
    expect(
      resolveBoardMemberDisplayName("1020168@lcps.org", {
        authDisplayName: "1020168",
      }),
    ).toBe("Skyler Amaya");
  });

  it("uses explicit override when provided", () => {
    expect(
      resolveBoardMemberDisplayName("1020168@lcps.org", {
        explicit: "Custom Name",
        authDisplayName: "1020168",
      }),
    ).toBe("Custom Name");
  });

  it("falls back to non-numeric auth name when not on roster", () => {
    expect(
      resolveBoardMemberDisplayName("unknown@gmail.com", {
        authDisplayName: "Alex Student",
      }),
    ).toBe("Alex Student");
  });

  it("skips numeric-only auth names", () => {
    expect(
      resolveBoardMemberDisplayName("unknown@gmail.com", {
        authDisplayName: "909516",
      }),
    ).toBe("unknown");
  });
});
