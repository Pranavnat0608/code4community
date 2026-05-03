"use client";

import { useMemo, useState } from "react";

function startOfWeekSunday(d) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmtRange(weekStart) {
  const end = addDays(weekStart, 6);
  const left = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const right = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${left} - ${right}`;
}

/** Demo events keyed by YYYY-MM-DD (local) — matches mock structure */
const DEMO_EVENTS = {
  "2025-10-26": [
    { time: "2:00 PM", title: "Chess Club", location: "Library" },
    { time: "3:30 PM", title: "Photography Walk", location: "Main Quad" },
  ],
  "2025-10-27": [
    { time: "8:00 AM", title: "Morning Announcements Crew", location: "Studio A" },
    { time: "12:00 PM", title: "Math Club Meeting", location: "RH 200" },
    { time: "3:15 PM", title: "Debate Team Practice", location: "Room 112" },
  ],
  "2025-10-28": [
    { time: "11:00 AM", title: "Environmental Club", location: "Science Wing" },
    { time: "4:00 PM", title: "Audio Engineering Club", location: "PAC 2", highlight: true },
  ],
  "2025-10-29": [
    { time: "12:30 PM", title: "Yearbook Committee", location: "Art Room" },
  ],
  "2025-10-30": [
    {
      time: "1:00 PM",
      title: "Red Cross Club Event",
      location: "Gymnasium",
      variant: "accent",
      note: "Please check Related Resources for volunteer forms.",
    },
    { time: "3:00 PM", title: "Robotics A Team", location: "Maker Lab" },
  ],
  "2025-10-31": [
    { time: "10:00 AM", title: "Spirit Club Planning", location: "Student Life" },
  ],
  "2025-11-01": [{ time: "9:00 AM", title: "Community Service Day", location: "Front Circle" }],
};

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const shortDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClubHubWeekCalendar() {
  const [anchor] = useState(() => new Date(2025, 9, 27));
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState("week");

  const weekStart = useMemo(() => {
    const base = startOfWeekSunday(anchor);
    return addDays(base, weekOffset * 7);
  }, [anchor, weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const demoWeekStart = useMemo(() => {
    const d = new Date(2025, 9, 26);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const isDemoWeek = weekStart.getTime() === demoWeekStart;
  const selectedIndex = isDemoWeek ? 1 : -1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12">
      <div className="rounded-lg border border-neutral-300 bg-white/95 shadow-lg px-3 py-4 sm:px-5 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5c1417] text-white shadow hover:bg-[#731a1f] transition-colors"
            >
              <span className="text-lg leading-none">‹</span>
            </button>
            <p className="min-w-0 text-center text-base font-bold text-[#5c1417] sm:text-lg">
              {fmtRange(weekStart)}
            </p>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5c1417] text-white shadow hover:bg-[#731a1f] transition-colors"
            >
              <span className="text-lg leading-none">›</span>
            </button>
          </div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                view === "week"
                  ? "bg-[#5c1417] text-white shadow"
                  : "border-2 border-[#5c1417] bg-white text-[#5c1417] hover:bg-[#f8e8ea]"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                view === "month"
                  ? "bg-[#5c1417] text-white shadow"
                  : "border-2 border-[#5c1417] bg-white text-[#5c1417] hover:bg-[#f8e8ea]"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {view === "month" ? (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-12 text-center text-neutral-600">
            Month view will be available in a future update.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {days.map((day, colIdx) => {
              const key = dateKey(day);
              const list = DEMO_EVENTS[key] || [];
              const isSelected = selectedIndex >= 0 && colIdx === selectedIndex;
              const header = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div
                  key={key}
                  className="flex min-h-[220px] flex-col rounded-lg bg-neutral-100/90 ring-1 ring-neutral-200/80"
                >
                  <div className="border-b border-neutral-200 px-2 py-1.5 text-center">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      {shortDay[colIdx]}
                    </div>
                    <div
                      className={`mt-1 rounded-md py-1 text-sm font-semibold ${
                        isSelected ? "bg-[#5c1417] text-white" : "bg-white text-neutral-800 ring-1 ring-neutral-200"
                      }`}
                    >
                      {header}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2">
                    {list.length === 0 ? (
                      <p className="text-center text-xs text-neutral-400 py-4">No events</p>
                    ) : (
                      list.map((ev, i) => (
                        <div
                          key={`${key}-${i}`}
                          className={`rounded-md border px-2 py-2 text-center text-xs shadow-sm transition-shadow ${
                            ev.variant === "accent"
                              ? "border-rose-200 bg-rose-50 text-[#5c1417]"
                              : ev.highlight
                                ? "border-neutral-900 bg-white ring-2 ring-neutral-900"
                                : "border-neutral-200 bg-white hover:border-neutral-400"
                          }`}
                        >
                          <p className="font-bold text-neutral-900">{ev.time}</p>
                          <p className="mt-1 font-bold text-neutral-900 leading-snug">{ev.title}</p>
                          <p className="mt-1 text-[11px] text-neutral-600">{ev.location}</p>
                          {ev.note ? (
                            <p className="mt-1 text-[10px] leading-snug text-neutral-500">{ev.note}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
