"use client";

import { formatSessionDate } from "@/lib/firestoreDates";
import { isAsyncFormSession } from "@/lib/writing-center/form";
import { getSessionReportUrl } from "@/lib/writing-center/sessionReport";

const linkClass = "font-medium text-indigo-600 hover:text-indigo-900";

function TutorReceiptLine({ session }) {
  const url = getSessionReportUrl(session);
  return (
    <p className="m-0">
      <span className="font-medium text-gray-700">Tutor Reciept:</span>{" "}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          View session reciept (PDF)
        </a>
      ) : (
        <span className="text-gray-600">Not submitted yet</span>
      )}
    </p>
  );
}

const PASS_TIMES = [
  ["Out", "hallPassStartedAt"],
  ["In", "hallPassInAt"],
  ["Left", "hallPassLeftAt"],
  ["Ended", "hallPassEndedAt"],
];

function HallPassTimes({ session }) {
  if (session?.sessionType !== "IN_PERSON") return null;
  const recorded = PASS_TIMES.some(([, field]) => session[field]);
  if (!recorded) return null;

  return (
    <dl className="m-0 grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 text-sm text-gray-600">
      {PASS_TIMES.map(([label, field]) => (
        <div key={field} className="contents">
          <dt className="font-medium text-gray-700">{label}</dt>
          <dd className="m-0 tabular-nums">{formatSessionDate(session[field], "—")}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Admin History tab — expanded row details (async / in-person). */
export function AdminSessionExpandedPanel({ session, formResponseUrl }) {
  if (isAsyncFormSession(session)) {
    return (
      <div className="flex flex-col items-start gap-2">
        {formResponseUrl && (
          <p className="m-0">
            <span className="font-medium text-gray-700">Student Response:</span>{" "}
            <a
              href={formResponseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              View in Google Forms
            </a>
          </p>
        )}
        <TutorReceiptLine session={session} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <HallPassTimes session={session} />
      <TutorReceiptLine session={session} />
    </div>
  );
}
