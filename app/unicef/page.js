"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllUnicefSubmissions } from "@/lib/unicef/api";
import { tallyApprovedHours } from "@/lib/unicef/hours";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { HoursPanel, MiniStat, roundHours, unicefButtonClass, unicefOutlineButtonClass } from "@/components/unicef/ui";

export default function UnicefHomePage() {
  const { user, settings, authLoading } = useUnicefAccess();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const submissions = await fetchAllUnicefSubmissions();
        if (cancelled) return;
        setStats(tallyApprovedHours(submissions, settings));
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings]);

  return (
    <div className="space-y-12 py-4">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-wider text-slate-500">{settings.academicYear}</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">UNICEF</h1>
        <p className="mx-auto max-w-xl text-slate-500">
          Your one stop shop for UNICEF. Review your previously submitted hours, find volunteer opportunities, and log new hours. Stay connected through the Info page.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {authLoading ? null : user ? (
            <Link href="/unicef/hours" className={`${unicefButtonClass} h-10 px-6`}>
              Go to My Hours
            </Link>
          ) : (
            <>
              <Link href="/login?redirectTo=%2Funicef" className={`${unicefButtonClass} h-10 px-6`}>
                Sign in
              </Link>
              <Link href="/signup?redirectTo=%2Funicef" className={`${unicefOutlineButtonClass} h-10 px-6`}>
                Create account
              </Link>
            </>
          )}
        </div>
      </section>

      <HoursPanel label="Club hours" total={stats?.total || 0} goal={settings.clubHoursGoal}>
        <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
          <MiniStat label="In Club" value={stats ? roundHours(stats.inClub) : "—"} />
          <MiniStat label="Out of Club" value={stats ? roundHours(stats.outOfClub) : "—"} />
          <MiniStat label="Summer" value={stats ? roundHours(stats.summer) : "—"} />
        </div>
      </HoursPanel>

      <section className="border-t border-slate-200 pt-6 text-sm text-slate-500">
        <h3 className="mb-1 font-semibold text-slate-950">About UNICEF</h3>
        <p>
          UNICEF at Broad Run is a student-led club. Members log hours by submitting an activity description, a point of contact, and a photo as proof. Officers review each submission before the hours count.
        </p>
      </section>
    </div>
  );
}
