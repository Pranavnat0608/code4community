"use client";

import { useState } from "react";
import { useRunEffect } from "@/hooks/useRunEffect";

function displayName(name) {
  const parts = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  return parts.join(" ") || "Student";
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function clockParts(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return { hours, minutes, ampm };
}

function formatClock(date) {
  const parts = clockParts(date);
  if (!parts) return "";
  return `${String(parts.hours).padStart(2, "0")}:${parts.minutes} ${parts.ampm}`;
}

function formatEndedStamp(date) {
  const parts = clockParts(date);
  if (!parts) return null;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return {
    line: `${month}-${day}-${year} ${parts.hours}:${parts.minutes}`,
    ampm: parts.ampm,
  };
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0 text-[#22a34a]" aria-hidden="true">
      <path
        d="M4.5 10.5 8 14l7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EndedFlag() {
  const squares = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      squares.push(
        <rect
          key={`${row}-${col}`}
          x={18 + col * 3}
          y={15.5 + row * 3}
          width="3"
          height="3"
          fill={(row + col) % 2 === 0 ? "#1a1a1a" : "#ffffff"}
        />,
      );
    }
  }
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="#f48aa2" />
      <rect x="16" y="13.5" width="2" height="21" rx="0.6" fill="#e2b431" />
      <rect x="30" y="13.5" width="2" height="21" rx="0.6" fill="#e2b431" />
      {squares}
    </svg>
  );
}

function AutoPass() {
  return (
    <span className="mt-2 inline-flex rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-medium leading-none text-white">
      Auto Pass
    </span>
  );
}

/**
 * Waiting, active, and ended hall-pass views.
 * @param {{
 *   studentName: string,
 *   startedAt?: Date | null,
 *   endedAt?: Date | null,
 *   inRoom?: boolean,
 *   markedOut?: boolean,
 *   passNumber?: number,
 *   onStart?: () => void,
 *   onStop?: () => void,
 *   onCancel?: () => void,
 *   starting?: boolean,
 *   stopping?: boolean,
 * }} props
 */
export function WritingCenterPassCard({
  studentName,
  startedAt = null,
  endedAt = null,
  inRoom = false,
  markedOut = false,
  passNumber = 1,
  onStart,
  onStop,
  onCancel,
  starting = false,
  stopping = false,
}) {
  const [now, setNow] = useState(null);
  const name = displayName(studentName);
  const startMs = startedAt instanceof Date ? startedAt.getTime() : null;
  const endMs = endedAt instanceof Date ? endedAt.getTime() : null;
  const phase = endMs != null ? "ended" : startMs != null ? "active" : "waiting";

  useRunEffect(() => {
    if (phase !== "active") return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, startMs]);

  const elapsed =
    phase === "ended" && startMs != null
      ? formatElapsed(endMs - startMs)
      : phase === "active" && now != null
        ? formatElapsed(now - startMs)
        : "00:00:00";
  const endedStamp = phase === "ended" ? formatEndedStamp(endedAt) : null;

  const cardColor = phase === "active" ? "bg-[#3cbe84]" : phase === "ended" ? "bg-[#8d8d8d]" : "bg-[#ef4d4d]";
  const timerColor = phase === "active" ? "text-[#1c8f72]" : "text-[#ef4d4d]";

  return (
    <div className="relative mx-auto w-full max-w-md pl-2 pt-2">
      <span className="absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#c62828] text-sm font-bold text-white">
        {passNumber}
      </span>
      <article className={`rounded-2xl px-4 py-4 text-white shadow-sm ${cardColor}`} aria-label="Writing Center pass">
        {phase === "waiting" && (
          <div className="mb-3 flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3">
            <p className="m-0 text-sm font-medium leading-snug text-neutral-600">
              Currently waiting
              <br />
              for approval!
            </p>
            <button
              type="button"
              onClick={onCancel}
              disabled={!onCancel || stopping}
              className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#ef4d4d] disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M6.5 6.5 13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {stopping ? "Canceling…" : "Cancel Request"}
            </button>
          </div>
        )}

        <div className="flex min-h-[9.3rem] items-center rounded-xl bg-white px-5 py-8">
          {phase === "active" && onStop ? (
            <button
              type="button"
              onClick={onStop}
              disabled={stopping}
              className="flex w-14 shrink-0 flex-col items-center text-[#e23b3b] disabled:opacity-50"
            >
              <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
                <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeWidth="2.25" />
                <rect x="18.5" y="18.5" width="11" height="11" rx="1.2" fill="currentColor" />
              </svg>
              <span className="text-[11px] font-semibold lowercase leading-none">stop</span>
            </button>
          ) : phase === "active" ? (
            <div className="w-14 shrink-0" />
          ) : phase === "ended" ? (
            <div className="flex w-14 shrink-0 justify-center">
              <EndedFlag />
            </div>
          ) : (
            <button
              type="button"
              onClick={onStart}
              disabled={!onStart || starting}
              className="flex w-14 shrink-0 flex-col items-center text-[#22a34a] disabled:opacity-50"
            >
              <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
                <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeWidth="2.25" />
                <path d="M20.5 16.5v15l12-7.5-12-7.5z" fill="currentColor" />
              </svg>
              <span className="text-[11px] font-semibold lowercase leading-none">{starting ? "…" : "start"}</span>
            </button>
          )}
          <p
            className={`m-0 flex-1 text-center text-[2.75rem] font-bold leading-none tracking-tight ${timerColor}`}
            style={{ fontFamily: '"Avenir Next", Nunito, ui-sans-serif, system-ui, sans-serif' }}
            role="timer"
          >
            {elapsed}
          </p>
        </div>

        <div className="my-4 h-px bg-white/40" />

        <div className="grid grid-cols-2 gap-x-4">
          <div className="flex min-w-0 flex-col items-center">
            <p className="m-0 self-start text-sm font-medium leading-none text-white">From:</p>
            <div
              className={`mt-2 flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold text-neutral-900 ${
                phase === "waiting" ? "bg-white" : "border border-white bg-white"
              }`}
            >
              <span className="truncate py-1 leading-normal">{name}</span>
              {phase === "waiting" ? <Check /> : null}
            </div>
            {phase !== "waiting" ? (
              <p className="m-0 mt-2 w-full text-center text-sm font-medium leading-none text-white">{formatClock(startedAt)}</p>
            ) : null}
            {phase !== "waiting" ? <AutoPass /> : null}
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <p className="m-0 self-start text-sm font-medium leading-none text-white">To:</p>
            <div
              className={`mt-2 flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold ${
                phase === "waiting"
                  ? "border border-white text-white"
                  : "bg-white text-neutral-900"
              }`}
            >
              <span className="truncate py-1 leading-normal">Writing Center</span>
              {phase !== "waiting" ? <Check /> : null}
            </div>
            {phase === "ended" ? (
              <p className="m-0 mt-2 w-full text-center text-sm font-medium leading-none text-white">{formatClock(endedAt)}</p>
            ) : null}
            {phase === "ended" ? <AutoPass /> : null}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <span className="text-sm font-semibold leading-none">Status:</span>
          {phase === "active" ? (
            <span className={`inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-bold leading-none ${markedOut ? "text-neutral-700" : inRoom ? "text-blue-700" : "text-[#1a7a34]"}`}>
              <Check />
              {markedOut ? "MARKED OUT" : inRoom ? "IN ROOM" : "ACTIVE"}
            </span>
          ) : phase === "ended" ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-bold leading-none text-[#e23b3b]">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
                  <circle cx="10" cy="10" r="7" fill="currentColor" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                ENDED
              </span>
              {endedStamp ? (
                <span className="text-left text-xs font-medium leading-snug text-white">
                  {endedStamp.line}
                  <br />
                  {endedStamp.ampm}
                </span>
              ) : null}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f5c400] px-3 py-1.5 text-xs font-bold leading-none text-neutral-900">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="4" y="3.5" width="12" height="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 8h6M7 11h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              WAITING APPROVAL
            </span>
          )}
        </div>
      </article>
    </div>
  );
}
