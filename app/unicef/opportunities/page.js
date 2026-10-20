"use client";

import { useEffect, useState } from "react";
import { runEffectWork } from "@/hooks/runEffectWork";
import { addUnicefOpportunity, deleteUnicefOpportunity, fetchUnicefOpportunities } from "@/lib/unicef/api";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";
import { unicefButtonClass, unicefCardClass, unicefInputClass } from "@/components/unicef/ui";

const EMPTY = { title: "", description: "", link: "", date: "", maxHours: "" };

export default function UnicefOpportunitiesPage() {
  const { officer } = useUnicefAccess();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = async () => setRows(await fetchUnicefOpportunities());

  useEffect(() => {
    return runEffectWork(() => {
      load().catch((err) => setError(err.message || "Could not load opportunities."));
    });
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await addUnicefOpportunity({
      title: form.title.trim(),
      description: form.description.trim(),
      link: form.link.trim(),
      date: form.date,
      maxHours: form.maxHours ? Number(form.maxHours) : null,
    });
    setForm(EMPTY);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Opportunities</h1>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <ul className="space-y-3">
        {rows.length === 0 ? <li className={`${unicefCardClass} py-8 text-center text-sm text-slate-500`}>No opportunities posted yet.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className={`${unicefCardClass} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.title}</p>
                {row.date ? <p className="text-xs text-slate-500">{row.date}</p> : null}
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{row.description}</p>
                {row.maxHours ? <p className="mt-1 text-xs text-slate-500">Up to {row.maxHours} hours</p> : null}
                {row.link ? (
                  <a href={row.link} className="mt-2 inline-block text-sm font-medium underline" target="_blank" rel="noreferrer">
                    Open link
                  </a>
                ) : null}
              </div>
              {officer ? (
                <button type="button" onClick={() => deleteUnicefOpportunity(row.id).then(load)} className="text-xs font-semibold text-red-800">
                  Remove
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {officer ? (
        <form onSubmit={add} className={`${unicefCardClass} space-y-2 p-4`}>
          <h2 className="font-semibold">Add opportunity</h2>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className={unicefInputClass} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className={unicefInputClass} />
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link (optional)" className={unicefInputClass} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={unicefInputClass} />
            <input type="number" min="0" step="0.5" value={form.maxHours} onChange={(e) => setForm({ ...form, maxHours: e.target.value })} placeholder="Max hours" className={unicefInputClass} />
          </div>
          <button type="submit" className={unicefButtonClass}>Add</button>
        </form>
      ) : null}
    </div>
  );
}
