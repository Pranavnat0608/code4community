import { describe, expect, it } from "vitest";
import { hourGoalForGrade, normalizeUnicefSettings, tallyApprovedHours } from "@/lib/unicef/hours";

describe("unicef hours", () => {
  const settings = normalizeUnicefSettings(null);

  it("caps out-of-club and summer hours", () => {
    const tally = tallyApprovedHours(
      [
        { status: "approved", hourType: "In Club", hoursCompleted: 5 },
        { status: "approved", hourType: "Out of Club", hoursCompleted: 20 },
        { status: "approved", hourType: "Summer Hours", hoursCompleted: 12 },
        { status: "pending", hourType: "In Club", hoursCompleted: 8 },
      ],
      settings,
    );
    expect(tally.inClub).toBe(5);
    expect(tally.outOfClub).toBe(15);
    expect(tally.summer).toBe(10);
    expect(tally.total).toBe(30);
  });

  it("uses the junior goal", () => {
    expect(hourGoalForGrade(settings, "Junior")).toBe(30);
  });
});