"use client";

import { useLayoutEffect, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/utils/AuthContext";
import { getUserClubMemberships, leaveClub } from "@/lib/clubHelpers";
import LoadingSpinner from "@/components/LoadingSpinner";

const MAROON = "#5c1417";

export default function MyClubsPage() {
  useLayoutEffect(() => {
    document.title = "My Clubs - Broad Run Club Hub";
  }, []);

  const { user, userData, loading } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [leaving, setLeaving] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && userData) {
      loadMemberships();
    } else if (!loading) {
      setLoadingMemberships(false);
    }
  }, [user, userData, loading]);

  const loadMemberships = async () => {
    if (!user) return;
    
    setLoadingMemberships(true);
    try {
      const userMemberships = await getUserClubMemberships(user.uid);
      setMemberships(userMemberships.filter(m => !m.cancelledAt));
    } catch (err) {
      console.error("Error loading memberships:", err);
      setError("Failed to load your club memberships");
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleLeaveClub = async (clubName) => {
    if (!user) return;

    setLeaving(prev => ({ ...prev, [clubName]: true }));
    setError("");

    try {
      const result = await leaveClub(user.uid, clubName);
      if (result.success) {
        setMemberships(prev => prev.filter(m => m.clubName !== clubName));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to leave club. Please try again.");
    } finally {
      setLeaving(prev => ({ ...prev, [clubName]: false }));
    }
  };

  if (loading || loadingMemberships) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-neutral-900">
        <nav className="border-b border-black/10 shadow-md" style={{ backgroundColor: MAROON }}>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 py-3.5 text-sm font-semibold tracking-wide text-white sm:gap-12 sm:text-base md:gap-16">
            <Link href="/club-hub" className="hover:underline underline-offset-4">
              Home
            </Link>
            <Link href="/club-hub/directory" className="hover:underline underline-offset-4">
              Club Directory
            </Link>
            <span className="cursor-default opacity-95 underline decoration-white underline-offset-4">My Clubs</span>
            <Link href="/login?redirectTo=%2Fclub-hub%2Fmy-clubs" className="hover:underline underline-offset-4">
              Log in
            </Link>
          </div>
        </nav>

        <main className="mx-auto w-full max-w-[90vw] px-4 pb-12 pt-10 sm:px-6 sm:pt-12">
          <div className="rounded-lg bg-blue-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Sign in to view your clubs</h2>
            <p className="text-blue-800 mb-4">You need to be logged in to see your club memberships.</p>
            <Link
              href="/login?redirectTo=%2Fclub-hub%2Fmy-clubs"
              className="inline-block rounded-lg bg-[#5c1417] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#731a1f]"
            >
              Log In
            </Link>
          </div>
        </main>

        <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
          <Link href="/club-hub" className="text-[#5c1417] hover:underline">
            ← Broad Run Club Hub
          </Link>
          <span className="mx-2 text-neutral-300">·</span>
          <Link href="/" className="hover:underline">
            Code4Community home
          </Link>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <nav className="border-b border-black/10 shadow-md" style={{ backgroundColor: MAROON }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 py-3.5 text-sm font-semibold tracking-wide text-white sm:gap-12 sm:text-base md:gap-16">
          <Link href="/club-hub" className="hover:underline underline-offset-4">
            Home
          </Link>
          <Link href="/club-hub/directory" className="hover:underline underline-offset-4">
            Club Directory
          </Link>
          <span className="cursor-default opacity-95 underline decoration-white underline-offset-4">My Clubs</span>
          <Link href="/club-hub/admin" className="hover:underline underline-offset-4">
            Admin
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[90vw] px-4 pb-12 pt-10 sm:px-6 sm:pt-12">
        <div className="border-y border-neutral-900 py-4 sm:py-5 mb-6">
          <h2 className="text-center text-base font-bold uppercase tracking-[0.06em] text-[#5c1417] sm:text-lg">
            My Club Memberships
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {memberships.length === 0 ? (
          <div className="rounded-lg bg-neutral-50 p-8 text-center">
            <p className="text-neutral-600 mb-4">You haven't joined any clubs yet.</p>
            <Link
              href="/club-hub/directory"
              className="inline-block rounded-lg bg-[#5c1417] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#731a1f]"
            >
              Browse Clubs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{membership.clubName}</h3>
                    <p className="text-xs text-neutral-600">
                      Joined: {membership.joinedAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
                    onClick={() => handleLeaveClub(membership.clubName)}
                    disabled={leaving[membership.clubName]}
                  >
                    {leaving[membership.clubName] ? "Leaving..." : "Leave Club"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
        <Link href="/club-hub" className="text-[#5c1417] hover:underline">
          ← Broad Run Club Hub
        </Link>
        <span className="mx-2 text-neutral-300">·</span>
        <Link href="/" className="hover:underline">
          Code4Community home
        </Link>
      </footer>
    </div>
  );
}