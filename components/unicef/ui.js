export const unicefCardClass = "rounded-xl border border-slate-200 bg-white";
export const unicefInputClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none focus:ring-2 focus:ring-slate-950/15";
export const unicefButtonClass =
  "inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";
export const unicefOutlineButtonClass =
  "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-50";
export const unicefGhostButtonClass =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-slate-100";

export function roundHours(n) {
  return Math.round(Number(n) * 10) / 10;
}

export function progressColor(pct) {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function HoursPanel({ label, total, goal, note, children }) {
  const safeGoal = Number(goal) || 0;
  const value = Number(total) || 0;
  const pct = safeGoal > 0 ? Math.min(100, (value / safeGoal) * 100) : 0;
  return (
    <div className={`${unicefCardClass} space-y-3 px-6 py-6`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-slate-500">{label}</p>
          <p className="text-5xl font-bold tabular-nums text-slate-950">{roundHours(value)}</p>
        </div>
        <p className="text-sm text-slate-500">{note || `Goal: ${safeGoal} hrs`}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500">
        {roundHours(value)} / {safeGoal} hrs ({Math.round(pct)}%)
      </p>
      {children}
    </div>
  );
}

export function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase text-slate-500">{label}</p>
      <p className="font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: "border-yellow-300 bg-yellow-100 text-yellow-900",
    approved: "border-green-300 bg-green-100 text-green-900",
    declined: "border-red-300 bg-red-100 text-red-900",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status] || "border-slate-200 text-slate-600"}`}>
      {status}
    </span>
  );
}
