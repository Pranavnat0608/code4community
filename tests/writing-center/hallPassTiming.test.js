import { describe, expect, it } from "vitest";
import {
  HALL_PASS_AUTO_CLOSE_MS,
  hallPassOpenSince,
  isPastHallPassAutoClose,
} from "@/lib/writing-center/hallPassTiming";

describe("hall pass auto close", () => {
  it("starts the hour when the student presses Start", () => {
    const started = new Date("2026-10-25T14:00:00Z");
    const created = new Date("2026-10-25T13:00:00Z");
    const since = hallPassOpenSince({
      hallPassStartedAt: started,
      createdAt: created,
    });
    expect(since).toEqual(started);
    expect(isPastHallPassAutoClose(since, new Date(started.getTime() + HALL_PASS_AUTO_CLOSE_MS - 1))).toBe(false);
    expect(isPastHallPassAutoClose(since, new Date(started.getTime() + HALL_PASS_AUTO_CLOSE_MS))).toBe(true);
  });

  it("uses created time when the pass was never started", () => {
    const created = new Date("2026-10-25T13:00:00Z");
    const since = hallPassOpenSince({ createdAt: created });
    expect(since).toEqual(created);
    expect(isPastHallPassAutoClose(since, new Date(created.getTime() + HALL_PASS_AUTO_CLOSE_MS))).toBe(true);
  });
});
