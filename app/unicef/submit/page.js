"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressProofImage, createUnicefSubmission } from "@/lib/unicef/api";
import { accountName } from "@/lib/unicef/accountName";
import { UNICEF_HOUR_TYPES } from "@/lib/unicef/hours";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { unicefButtonClass, unicefCardClass, unicefInputClass, unicefOutlineButtonClass } from "@/components/unicef/ui";

export default function UnicefSubmitPage() {
  const { user, userData, profile, authLoading } = useUnicefAccess();
  const name = accountName(user, userData);
  const router = useRouter();
  const [activity, setActivity] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState("");
  const [hourType, setHourType] = useState("In Club");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <p className="text-sm">
        Sign in to submit hours.{" "}
        <Link href="/login?redirectTo=%2Funicef%2Fsubmit" className="font-medium underline">
          Log in
        </Link>
      </p>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user || !profile) return;
    setError("");
    const desc = activity.trim();
    const hoursNum = Number(hours);
    if (desc.length < 10) return setError("Description must be at least 10 characters.");
    if (contact.trim().length < 5) return setError("Point of contact must be at least 5 characters.");
    if (!Number.isFinite(hoursNum) || hoursNum <= 0 || hoursNum > 24) return setError("Hours must be greater than 0 and at most 24.");
    if (!file) return setError("Attach a proof image.");
    setBusy(true);
    try {
      const imageData = await compressProofImage(file);
      await createUnicefSubmission({
        userId: user.uid,
        userName: name.displayName || user.email || "",
        userEmail: user.email || "",
        grade: profile.grade,
        activityDescription: desc.slice(0, 1000),
        pointOfContact: contact.trim().slice(0, 300),
        hoursCompleted: hoursNum,
        hourType,
      }, imageData);
      router.push("/unicef/hours");
    } catch (err) {
      setError(err.message || "Could not submit hours.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Submit Volunteer Hours</h1>
      {!profile ? (
        <p className="text-sm text-slate-500">Loading your account…</p>
      ) : (
        <div className={unicefCardClass}>
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold">New submission</h2>
          </div>
          <form onSubmit={onSubmit} className="space-y-4 px-6 py-5" noValidate>
            {error ? <p className="text-sm text-red-800">{error}</p> : null}
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <ReadOnly label="Name" value={name.displayName || "Set your name in account settings"} />
              <ReadOnly label="Grade" value={profile.grade || ""} />
            </div>
            <label className="block text-sm font-medium">
              Description of volunteer activity
              <textarea value={activity} onChange={(e) => setActivity(e.target.value)} rows={4} placeholder="What did you do? Where? Who organized it?" className={unicefInputClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{activity.trim().length} / 1000 (min 10)</span>
            </label>
            <label className="block text-sm font-medium">
              Point of contact
              <textarea value={contact} onChange={(e) => setContact(e.target.value)} rows={2} placeholder="e.g. Jane Smith, Director, 703-555-0100" className={unicefInputClass} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Number of hours
                <input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} className={unicefInputClass} />
              </label>
              <label className="block text-sm font-medium">
                Type of hours
                <select value={hourType} onChange={(e) => setHourType(e.target.value)} className={unicefInputClass}>
                  {UNICEF_HOUR_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">
              Picture proof (image)
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className={`${unicefInputClass} file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Photos are compressed before they are saved.</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className={unicefButtonClass}>
                {busy ? "Submitting…" : "Submit hours"}
              </button>
              <Link href="/unicef/hours" className={unicefOutlineButtonClass}>Cancel</Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="truncate font-medium">{value || "—"}</div>
    </div>
  );
}
