"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import ClubHubLiveMessage from "@/components/club-hub/ClubHubLiveMessage";
import { getSortedClubOptions } from "@/lib/club-hub/broadRunClubDirectory";
import {
  getDefaultMeetingDayForSlug,
  getEffectiveMeetingDayForSlug,
  getMeetingDayOverrides,
} from "@/lib/club-hub/clubDirectorySections";
import {
  resetClubMeetingDay,
  saveClubMeetingDay,
  useMeetingDayOverrides,
} from "@/lib/club-hub/clubMeetingDays";

const MEETING_DAY_LABELS = {
  gold: "Gold",
  maroon: "Maroon",
  both: "Gold & Maroon",
  general: "General",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "gold", label: "Gold" },
  { value: "maroon", label: "Maroon" },
  { value: "both", label: "Gold & Maroon" },
  { value: "general", label: "General" },
];

export default function ClubHubMeetingDaysAdminPanel() {
  const { user } = useAuth();
  const { ready } = useMeetingDayOverrides();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busySlug, setBusySlug] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clubOptions = useMemo(() => getSortedClubOptions(), []);
  const overrides = getMeetingDayOverrides();

  const rows = clubOptions
    .map((club) => ({
      ...club,
      meetingDay: getEffectiveMeetingDayForSlug(club.slug),
      defaultMeetingDay: getDefaultMeetingDayForSlug(club.slug),
      overridden: Object.prototype.hasOwnProperty.call(overrides, club.slug),
    }))
    .filter((row) => filter === "all" || row.meetingDay === filter)
    .filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()));

  const run = async (slug, action, successText) => {
    if (!user?.uid || busySlug) return;
    setBusySlug(slug);
    setError("");
    setMessage("");
    try {
      const extra = await action();
      setMessage(`${successText}${extra || ""}`);
    } catch (err) {
      setError(err.message || "Could not update meeting day.");
    } finally {
      setBusySlug("");
    }
  };

  const handleChange = (club, meetingDay) => {
    if (meetingDay === club.meetingDay || !user) return;
    const fromLabel = MEETING_DAY_LABELS[club.meetingDay];
    const toLabel = MEETING_DAY_LABELS[meetingDay];
    const confirmed = window.confirm(
      `Change ${club.name} from ${fromLabel} to ${toLabel}? Students who signed up for a day this club no longer meets will be removed from that signup and the Student meeting clubs sheet.`,
    );
    if (!confirmed) return;
    run(
      club.slug,
      async () => {
        const data =
          meetingDay === club.defaultMeetingDay && club.overridden
            ? await resetClubMeetingDay({ slug: club.slug, user })
            : await saveClubMeetingDay({
                slug: club.slug,
                clubName: club.name,
                meetingDay,
                user,
              });
        const removed =
          data.cleared > 0
            ? ` Removed ${data.cleared} signup${data.cleared === 1 ? "" : "s"}.`
            : "";
        const warning = data.sheetWarning ? ` ${data.sheetWarning}` : "";
        return `${removed}${warning}`;
      },
      `${club.name} is now ${toLabel}.`,
    );
  };

  return (
    <section className="rounded-[14px] bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-neutral-900">Club meeting days</h2>
      <p className="mt-1 text-sm text-neutral-700">
        Choose whether each club meets on Gold days, Maroon days, both, or is a General club.
        Students signed up for a day the club no longer meets are removed from that signup and
        from the Student meeting clubs sheet.
      </p>

      <ClubHubLiveMessage message={message} />
      <ClubHubLiveMessage message={error} variant="alert" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="club-hub-meeting-days-search" className="sr-only">
          Search clubs
        </label>
        <input
          id="club-hub-meeting-days-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clubs"
          className="min-w-[14rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <label htmlFor="club-hub-meeting-days-filter" className="sr-only">
          Filter by meeting day
        </label>
        <select
          id="club-hub-meeting-days-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {!ready ? (
        <p className="mt-4 text-sm text-neutral-700">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-700">No clubs match.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200">
          {rows.map((club) => {
            const selectId = `club-hub-meeting-day-${club.slug}`;
            return (
              <li key={club.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <label htmlFor={selectId} className="font-medium text-neutral-900">
                    {club.name}
                  </label>
                  {club.overridden ? (
                    <p className="text-xs text-neutral-700">
                      Changed by admin (default: {MEETING_DAY_LABELS[club.defaultMeetingDay]})
                    </p>
                  ) : null}
                </div>
                <select
                  id={selectId}
                  value={club.meetingDay}
                  disabled={!user?.uid || Boolean(busySlug)}
                  onChange={(e) => {
                    const next = e.target.value;
                    e.target.value = club.meetingDay;
                    handleChange(club, next);
                  }}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                >
                  {Object.entries(MEETING_DAY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
