import { describe, expect, it } from "vitest";
import { toCalendarBlock } from "@/lib/club-hub/clubEvents";
import {
  mergeActivityBusWednesdays,
  shouldShowActivityBus,
  sortCalendarDayEvents,
} from "@/lib/club-hub/calendarEventOrder";
import { mergeLcpsDaysIntoEventsByDate } from "@/lib/club-hub/lcpsSchoolCalendar2026";
import { mergeSpartanScheduleIntoEventsByDate } from "@/lib/club-hub/spartanAdvisoryClubSchedule2026";

describe("calendarEventOrder", () => {
  it("sorts LCPS milestones and advisory themes above club events", () => {
    const clubBlock = toCalendarBlock({
      id: "1",
      clubSlug: "deca",
      clubName: "DECA",
      title: "Meeting",
      description: "",
      date: "2026-10-28",
      time: "3:00 PM",
      location: "Room 1",
      createdBy: "",
      updatedBy: "",
    });

    let byDate = { "2026-10-28": [clubBlock] };
    byDate = mergeSpartanScheduleIntoEventsByDate(byDate, "2026-10-28", "2026-10-28");
    byDate = mergeLcpsDaysIntoEventsByDate(byDate, "2026-10-28", "2026-10-28");
    byDate = mergeActivityBusWednesdays(byDate, "2026-10-28", "2026-10-28");

    const sorted = sortCalendarDayEvents(byDate["2026-10-28"]);
    expect(sorted[0].title).toBe("End of quarter");
    expect(sorted[1].title).toBe("Advisory Lesson: Think Before You Speak");
    expect(sorted.some((e) => e.title === "Activity Bus")).toBe(true);
    expect(sorted[sorted.length - 1].title).toBe("Meeting");
  });

  it("includes Activity Bus on in-session Wednesdays but not last week of school", () => {
    expect(shouldShowActivityBus("2026-09-09")).toBe(true);
    expect(shouldShowActivityBus("2026-11-25")).toBe(false);
    expect(shouldShowActivityBus("2027-06-09")).toBe(false);
    expect(shouldShowActivityBus("2027-06-02")).toBe(true);
  });
});
