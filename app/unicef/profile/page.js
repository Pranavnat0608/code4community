"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { updateUnicefProfile } from "@/lib/unicef/api";
import { accountName } from "@/lib/unicef/accountName";
import { UNICEF_GRADES } from "@/lib/unicef/hours";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { unicefButtonClass, unicefCardClass, unicefInputClass } from "@/components/unicef/ui";

const lockedClass = `${unicefInputClass} bg-slate-50 text-slate-600`;

export default function UnicefProfilePage() {
  const { user, userData, profile, setProfile, authLoading } = useUnicefAccess();
  const [grade, setGrade] = useState("Freshman");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const name = accountName(user, userData);

  useEffect(() => {
    if (!profile) return;
    setGrade(profile.grade || "Freshman");
    setPhone(profile.phone || "");
  }, [profile]);

  if (authLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return <p className="text-sm">Sign in to edit your profile. <Link className="font-medium underline" href="/login?redirectTo=%2Funicef%2Fprofile">Log in</Link></p>;
  }

  const save = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits && digits.length !== 10) return setError("Phone number must be 10 digits, or leave it blank.");
    await updateUnicefProfile(user.uid, { grade, phone: digits });
    setProfile({ ...profile, grade, phone: digits });
    setMessage("Profile saved.");
  };

  return (
    <form onSubmit={save} className={`${unicefCardClass} mx-auto max-w-lg space-y-3 p-6`}>
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-sm text-slate-500">Name comes from your Code4Community account.</p>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      {message ? <p className="text-sm text-green-800">{message}</p> : null}
      <label className="block text-sm font-medium">
        First name
        <input value={name.firstName} readOnly disabled className={lockedClass} />
      </label>
      <label className="block text-sm font-medium">
        Last name
        <input value={name.lastName} readOnly disabled className={lockedClass} />
      </label>
      <label className="block text-sm font-medium">Grade
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className={unicefInputClass}>
          {UNICEF_GRADES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="7035550100" className={unicefInputClass} /></label>
      <button type="submit" className={unicefButtonClass}>Save profile</button>
    </form>
  );
}
