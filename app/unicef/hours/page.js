"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyUnicefSubmissions } from "@/lib/unicef/api";
import { accountName } from "@/lib/unicef/accountName";
import { hourGoalForGrade, tallyApprovedHours } from "@/lib/unicef/hours";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { HoursPanel, MiniStat, StatusBadge, roundHours, unicefButtonClass, unicefCardClass } from "@/components/unicef/ui";

export default function UnicefHoursPage() {
  const { user, userData, profile, settings, authLoading } = useUnicefAccess();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    fetchMyUnicefSubmissions(user.uid).then((list) => {
      if (!cancelled) setRows(list);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  if (authLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <p className="text-sm">
        Sign in to see your hours.{" "}
        <Link className="font-medium underline" href="/login?redirectTo=%2Funicef%2Fhours">
          Log in
        </Link>
      </p>
    );
  }

  const tally = tallyApprovedHours(rows, settings);
  const goal = hourGoalForGrade(settings, profile?.grade || "Freshman");
  const firstName = accountName(user, userData).firstName || "there";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-sm text-slate-500">{today}</p>
      </header>

      <HoursPanel
        label="Your hours"
        total={tally.total}
        goal={goal}
        note={`Goal: ${goal} hrs (${profile?.grade || "Freshman"})`}
      >
        <div className="grid grid-cols-1 gap-3 pt-2 text-sm sm:grid-cols-3">
          <MiniStat label="In Club" value={roundHours(tally.inClub)} />
          <MiniStat
            label={`Out of Club (cap ${settings.outOfClubHoursCap})`}
            value={tally.outRaw > tally.outOfClub ? `${roundHours(tally.outOfClub)} / ${roundHours(tally.outRaw)}` : roundHours(tally.outOfClub)}
          />
          <MiniStat
            label={`Summer (cap ${settings.summerHoursCap})`}
            value={tally.summerRaw > tally.summer ? `${roundHours(tally.summer)} / ${roundHours(tally.summerRaw)}` : roundHours(tally.summer)}
          />
        </div>
      </HoursPanel>

      <Link href="/unicef/submit" className={`${unicefButtonClass} h-11 w-full text-base`}>
        Submit hours
      </Link>

      <section>
        <h2 className="mb-2 text-xl font-semibold">All submissions</h2>
        {rows.length === 0 ? (
          <div className={`${unicefCardClass} py-8 text-center text-slate-500`}>No submissions yet.</div>
        ) : (
          <div className={`${unicefCardClass} divide-y divide-slate-200`}>
            {rows.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.activityDescription}</p>
                  <p className="text-xs text-slate-500">
                    {formatWhen(row.submittedAt)} · {Number(row.hoursCompleted)} hrs · {row.hourType}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatWhen(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "Submitted";
  return date.toLocaleDateString();
}
