"use client";

import { useMemo, useState } from "react";

export default function ConstraintEngine({ students, constraints, onConstraintsUpdate }) {
  const present = useMemo(() => students.filter((s) => !s.absent), [students]);
  const [blockA, setBlockA] = useState("");
  const [blockB, setBlockB] = useState("");
  const [buddyA, setBuddyA] = useState("");
  const [buddyB, setBuddyB] = useState("");

  const byId = useMemo(() => {
    const m = new Map();
    present.forEach((s) => m.set(s.id, s));
    return m;
  }, [present]);

  const addHardBlock = () => {
    if (!blockA || !blockB || blockA === blockB) return;
    const pair = [blockA, blockB].sort();
    const exists = (constraints.hardBlocks || []).some(
      ([a, b]) => a === pair[0] && b === pair[1]
    );
    if (exists) return;
    onConstraintsUpdate({
      ...constraints,
      hardBlocks: [...(constraints.hardBlocks || []), pair],
    });
    setBlockA("");
    setBlockB("");
  };

  const removeHardBlock = (index) => {
    const next = [...(constraints.hardBlocks || [])];
    next.splice(index, 1);
    onConstraintsUpdate({ ...constraints, hardBlocks: next });
  };

  const addBuddyPair = () => {
    if (!buddyA || !buddyB || buddyA === buddyB) return;
    const pair = [buddyA, buddyB].sort();
    const exists = (constraints.buddyPairs || []).some(
      ([a, b]) => a === pair[0] && b === pair[1]
    );
    if (exists) return;
    onConstraintsUpdate({
      ...constraints,
      buddyPairs: [...(constraints.buddyPairs || []), pair],
    });
    setBuddyA("");
    setBuddyB("");
  };

  const removeBuddy = (index) => {
    const next = [...(constraints.buddyPairs || [])];
    next.splice(index, 1);
    onConstraintsUpdate({ ...constraints, buddyPairs: next });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Constraints</h3>
        <p className="text-sm text-gray-600">
          Keep certain students apart, keep pairs together, and optionally avoid repeating last time&apos;s
          groups.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Must not be in the same group</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {(constraints.hardBlocks || []).map(([a, b], i) => (
            <button
              key={`${a}-${b}-${i}`}
              type="button"
              onClick={() => removeHardBlock(i)}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-800 hover:bg-red-200"
            >
              {byId.get(a)?.name ?? a} ↔ {byId.get(b)?.name ?? b}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Student A</label>
            <select
              value={blockA}
              onChange={(e) => setBlockA(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {present.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Student B</label>
            <select
              value={blockB}
              onChange={(e) => setBlockB(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {present.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={addHardBlock}
              disabled={!blockA || !blockB || blockA === blockB}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add separation
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Should be in the same group</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {(constraints.buddyPairs || []).map(([a, b], i) => (
            <button
              key={`buddy-${a}-${b}-${i}`}
              type="button"
              onClick={() => removeBuddy(i)}
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs text-green-800 hover:bg-green-200"
            >
              {byId.get(a)?.name ?? a} + {byId.get(b)?.name ?? b}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Student A</label>
            <select
              value={buddyA}
              onChange={(e) => setBuddyA(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {present.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Student B</label>
            <select
              value={buddyB}
              onChange={(e) => setBuddyB(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {present.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={addBuddyPair}
              disabled={!buddyA || !buddyB || buddyA === buddyB}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add pair
            </button>
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={!!constraints.avoidPrevious}
          onChange={(e) =>
            onConstraintsUpdate({
              ...constraints,
              avoidPrevious: e.target.checked,
            })
          }
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Prefer not to repeat previous group assignments (uses each student&apos;s{" "}
          <code className="text-xs">previousGroups</code> when set)
        </span>
      </label>

      {present.length === 0 && (
        <p className="text-sm text-amber-700">Add students on the Roster tab to use constraints.</p>
      )}
    </div>
  );
}
