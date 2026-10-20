"use client";

import { useEffect, useState } from "react";
import { runEffectWork } from "@/hooks/runEffectWork";
import Link from "next/link";
import {
  fetchAllUnicefSubmissions,
  fetchUnicefProof,
  fetchUnicefProfiles,
  reviewUnicefSubmission,
  saveUnicefSettings,
  updateUnicefProfile,
} from "@/lib/unicef/api";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { unicefButtonClass, unicefCardClass, unicefInputClass, unicefOutlineButtonClass } from "@/components/unicef/ui";

export default function UnicefAdminPage() {
  const { user, officer, authLoading, settings, setSettings } = useUnicefAccess();
  const [tab, setTab] = useState("review");
  const [submissions, setSubmissions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const [subs, people] = await Promise.all([
      fetchAllUnicefSubmissions(),
      fetchUnicefProfiles(),
    ]);
    setSubmissions(subs.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
    setProfiles(people);
  };

  useEffect(() => {
    if (!officer) return undefined;
    return runEffectWork(() => {
      load().catch((err) => setError(err.message || "Could not load admin data."));
    });
  }, [officer]);

  if (authLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return <p className="text-sm">Sign in required. <Link href="/login?redirectTo=%2Funicef%2Fadmin" className="underline">Log in</Link></p>;
  }
  if (!officer) {
    return <p className="text-sm text-slate-600">Only UNICEF sponsors and board members can open admin.</p>;
  }

  const pending = submissions.filter((row) => row.status === "pending");

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin</h1>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {["review", "members", "settings"].map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? unicefButtonClass : unicefOutlineButtonClass}>
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      {tab === "review" ? (
        <ul className="space-y-3">
          {pending.length === 0 ? <li className={`${unicefCardClass} py-8 text-center text-sm text-slate-500`}>No submissions waiting for review.</li> : null}
          {pending.map((row) => (
            <li key={row.id} className={`${unicefCardClass} p-4 text-sm`}>
              <p className="font-semibold">{row.userName} · {row.hoursCompleted} hrs · {row.hourType}</p>
              <p className="mt-1 text-slate-700">{row.activityDescription}</p>
              <p className="text-slate-500">Contact: {row.pointOfContact}</p>
              <ProofImage submissionId={row.id} />
              <div className="mt-3 flex gap-2">
                <button type="button" className={unicefButtonClass} onClick={() => reviewUnicefSubmission(row.id, "approved", user.uid).then(load)}>Approve</button>
                <button type="button" className={unicefOutlineButtonClass} onClick={() => reviewUnicefSubmission(row.id, "declined", user.uid).then(load)}>Decline</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "members" ? (
        <ul className={`${unicefCardClass} divide-y divide-slate-200`}>
          {profiles.map((person) => (
            <li key={person.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">{`${person.firstName} ${person.lastName}`.trim() || person.email}</p>
                <p className="text-slate-500">{person.email} · {person.grade}</p>
              </div>
              <select
                value={person.role}
                onChange={(e) => updateUnicefProfile(person.id, { role: e.target.value }).then(load)}
                className="rounded-md border px-2 py-1"
              >
                <option value="member">Member</option>
                <option value="board">Board</option>
                <option value="sponsor">Sponsor</option>
              </select>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "settings" ? (
          <form
          className={`${unicefCardClass} grid max-w-lg gap-3 p-5`}
          onSubmit={(e) => {
            e.preventDefault();
            saveUnicefSettings(settings, user.uid).then(() => setError(""));
          }}
        >
          {[
            ["academicYear", "Academic year"],
            ["summerHoursCap", "Summer hours cap"],
            ["outOfClubHoursCap", "Out of club cap"],
            ["hourGoalFreshman", "Freshman goal"],
            ["hourGoalSophomore", "Sophomore goal"],
            ["hourGoalJunior", "Junior goal"],
            ["hourGoalSenior", "Senior goal"],
            ["clubHoursGoal", "Club hours goal"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              <input
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: key === "academicYear" ? e.target.value : Number(e.target.value) })}
                className={unicefInputClass}
              />
            </label>
          ))}
          <button type="submit" className={unicefButtonClass}>Save settings</button>
        </form>
      ) : null}
    </div>
  );
}

function ProofImage({ submissionId }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetchUnicefProof(submissionId).then((image) => {
      if (!cancelled) setSrc(image);
    });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);
  if (!src) return null;
  return (
    // User-uploaded proof is a data URL, not a static asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="mt-2 max-h-48 rounded-md" />
  );
}
