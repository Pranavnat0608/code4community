"use client";

import { useState, useEffect } from "react";
import { BROAD_RUN_CLUBS } from "@/lib/broadRunClubDirectory";
import { useAuth } from "@/utils/AuthContext";
import { isUserClubMember, joinClub, leaveClub } from "@/lib/clubHelpers";
import Link from "next/link";

const MAROON = "#5c1417";

export default function BroadRunClubDirectory() {
  const [selected, setSelected] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");
  const { user, userData } = useAuth();

  useEffect(() => {
    if (user && userData) {
      // Check membership status for all clubs
      BROAD_RUN_CLUBS.forEach(async (club) => {
        const isMember = await isUserClubMember(user.uid, club.name);
        setMembershipStatus(prev => ({
          ...prev,
          [club.name]: isMember
        }));
      });
    }
  }, [user, userData]);

  const handleJoinClub = async (clubName) => {
    if (!user || !userData) {
      setError("Please log in to join clubs");
      return;
    }

    setLoading(prev => ({ ...prev, [clubName]: true }));
    setError("");

    try {
      const result = await joinClub(user.uid, userData.displayName, clubName);
      if (result.success) {
        setMembershipStatus(prev => ({ ...prev, [clubName]: true }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to join club. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [clubName]: false }));
    }
  };

  const handleLeaveClub = async (clubName) => {
    if (!user) return;

    setLoading(prev => ({ ...prev, [clubName]: true }));
    setError("");

    try {
      const result = await leaveClub(user.uid, clubName);
      if (result.success) {
        setMembershipStatus(prev => ({ ...prev, [clubName]: false }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to leave club. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [clubName]: false }));
    }
  };

  return (
    <>
      {/* Section title between full-width rules — reference "club directory" */}
      <div className="border-y border-neutral-900 py-4 sm:py-5">
        <h2 className="text-center text-base font-bold uppercase tracking-[0.06em] text-[#5c1417] sm:text-lg">
          Broad Run Club List
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!user && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <Link href="/login?redirectTo=%2Fclub-hub%2Fdirectory" className="font-semibold underline">
            Log in
          </Link>
          {" "}to join clubs and see your memberships.
        </div>
      )}

      <p className="sr-only">
        Club buttons below; activate a button to view sponsor names and email addresses.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
        {BROAD_RUN_CLUBS.map((club) => {
          const isMember = membershipStatus[club.name];
          const isLoading = loading[club.name];

          return (
            <button
              key={club.name}
              type="button"
              onClick={() => setSelected(club)}
              className="min-h-[3.5rem] rounded-[10px] px-2 py-3 text-center text-[11px] font-semibold leading-snug text-white transition-colors hover:bg-[#731a1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c1417] focus-visible:ring-offset-2 sm:min-h-[3.75rem] sm:text-xs md:text-sm relative"
              style={{ backgroundColor: MAROON }}
            >
              {isMember && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-400" aria-label="Member" />
              )}
              <span className="line-clamp-4">{club.name}</span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-detail-title"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-neutral-400 bg-white p-5 shadow-md sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="club-detail-title" className="text-lg font-bold text-[#5c1417]">
              {selected.name}
            </h3>
            <p className="mt-1 text-xs text-neutral-600">Sponsor(s)</p>
            <table className="mt-4 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-300">
                  <th className="py-2 pr-3 font-semibold text-neutral-800">Name</th>
                  <th className="py-2 font-semibold text-neutral-800">Email</th>
                </tr>
              </thead>
              <tbody>
                {selected.sponsors.map((s) => (
                  <tr key={`${selected.name}-${s.email}`} className="border-b border-neutral-200">
                    <td className="py-2 pr-3 align-top text-neutral-900">{s.name}</td>
                    <td className="py-2 align-top">
                      <a href={`mailto:${s.email}`} className="break-all text-[#5c1417] underline underline-offset-2 hover:text-[#731a1f]">
                        {s.email}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {user && (
              <div className="mt-5 border-t border-neutral-200 pt-4">
                {membershipStatus[selected.name] ? (
                  <button
                    type="button"
                    className="w-full border border-red-300 bg-red-50 py-2.5 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
                    onClick={() => handleLeaveClub(selected.name)}
                    disabled={loading[selected.name]}
                  >
                    {loading[selected.name] ? "Leaving..." : "Leave Club"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full border border-green-300 bg-green-50 py-2.5 text-sm font-semibold text-green-900 hover:bg-green-100 disabled:opacity-50"
                    onClick={() => handleJoinClub(selected.name)}
                    disabled={loading[selected.name]}
                  >
                    {loading[selected.name] ? "Joining..." : "Join Club"}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className="mt-3 w-full border border-neutral-400 bg-white py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}