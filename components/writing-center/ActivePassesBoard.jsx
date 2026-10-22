"use client";

import { useMemo, useState } from "react";
import { useRunEffect } from "@/hooks/useRunEffect";
import { firestoreToDate } from "@/lib/firestoreDates";

function clockLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function elapsedLabel(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function initials(name) {
  const parts = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "");
  return letters.join("") || "S";
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Live hall-pass board. Tutors and admins mark a student in on arrival.
 * @param {{
 *   passes: Array<Record<string, unknown>>,
 *   allSessions?: Array<Record<string, unknown>>,
 *   onMarkIn?: (pass: Record<string, unknown>) => void,
 *   onMarkOut?: (pass: Record<string, unknown>) => void,
 *   onAccept?: (pass: Record<string, unknown>) => void,
 *   markingId?: string,
 * }} props
 */
export function ActivePassesBoard({ passes, allSessions = [], onMarkIn, onMarkOut, onAccept, markingId = "" }) {
  const [now, setNow] = useState(null);

  useRunEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const passesToday = useMemo(() => {
    const counts = new Map();
    const today = new Date();
    for (const session of allSessions) {
      if (session.sessionType !== "IN_PERSON" || !session.studentId) continue;
      const when =
        firestoreToDate(session.hallPassStartedAt) ||
        firestoreToDate(session.createdAt);
      if (!when || !sameDay(when, today)) continue;
      counts.set(session.studentId, (counts.get(session.studentId) || 0) + 1);
    }
    return counts;
  }, [allSessions]);

  if (!passes.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
        No active passes.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <span className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white">Active</span>
        <span className="text-sm text-gray-500">{passes.length} out</span>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Out time</th>
              <th className="px-4 py-3 font-semibold">In time</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              {onAccept ? <th className="px-4 py-3 font-semibold">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => {
              const name = pass.studentName || "Student";
              const started = firestoreToDate(pass.hallPassStartedAt);
              const arrived = firestoreToDate(pass.hallPassInAt);
              const left = firestoreToDate(pass.hallPassLeftAt);
              const inRoom = Boolean(arrived) && !left;
              const markedOut = Boolean(left);
              const waiting = !started;
              const elapsed = started && now != null ? now - started.getTime() : 0;
              const overTen = !waiting && elapsed >= 10 * 60 * 1000;
              const todayCount = passesToday.get(pass.studentId) || 1;
              return (
                <tr key={pass.id} className={`border-b border-gray-100 last:border-b-0 ${overTen ? "bg-yellow-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {overTen ? (
                        <span className="rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold leading-none text-yellow-950">
                          10+ MIN
                        </span>
                      ) : null}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {initials(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-semibold text-gray-900">{name}</p>
                        <p className="m-0 text-xs text-gray-500">
                          has {todayCount} {todayCount === 1 ? "pass" : "passes"} today
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="m-0 text-sm font-medium text-gray-900">{name}</p>
                    <p className="m-0 mt-0.5 text-sm text-gray-600">{waiting ? "Waiting" : clockLabel(started)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="m-0 text-sm font-medium text-gray-900">Writing Center</p>
                    {markedOut ? (
                      <p className="m-0 mt-0.5 text-sm text-gray-600">Left {clockLabel(left)}</p>
                    ) : inRoom ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="m-0 text-sm text-gray-600">{clockLabel(arrived)}</p>
                        {onMarkOut ? (
                          <button
                            type="button"
                            onClick={() => onMarkOut(pass)}
                            disabled={Boolean(markingId)}
                            className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {markingId === `${pass.id}:out` ? "Saving…" : "Mark out"}
                          </button>
                        ) : null}
                      </div>
                    ) : waiting || !onMarkIn ? (
                      <p className="m-0 mt-0.5 text-sm text-gray-400">—</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkIn(pass)}
                        disabled={Boolean(markingId)}
                        className="mt-1 rounded-md bg-[#e23b3b] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {markingId === `${pass.id}:in` ? "Saving…" : "Mark in"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-gray-900">
                    {waiting || now == null ? "—" : elapsedLabel(elapsed)}
                  </td>
                  <td className="px-4 py-3">
                    {waiting ? (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                        Waiting
                      </span>
                    ) : markedOut ? (
                      <span className="inline-flex rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-800">
                        Marked out
                      </span>
                    ) : inRoom ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        In Room
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  {onAccept ? (
                    <td className="px-4 py-3">
                      {pass.status === "PENDING" && !pass.tutorId ? (
                        <button
                          type="button"
                          onClick={() => onAccept(pass)}
                          disabled={Boolean(markingId)}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {markingId === `${pass.id}:accept` ? "Saving…" : "Accept"}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">{pass.tutorId ? "Accepted" : "—"}</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
