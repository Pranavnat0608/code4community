"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/utils/AuthContext";
import { isAdminUser } from "@/utils/authorization";
import { BROAD_RUN_CLUBS } from "@/lib/broadRunClubDirectory";
import { isClubAdmin, getUserAdminClubs } from "@/lib/clubHelpers";
import ClubAnnouncements from "./ClubAnnouncements";
import ClubAttendanceTracker from "./ClubAttendanceTracker";
import { useRouter } from "next/navigation";

const MAROON = "#5c1417";

export default function ClubAdminDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClubs, setAdminClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [activeTab, setActiveTab] = useState("announcements");
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    if (!loading && user && userData) {
      checkAdminStatus();
    }
  }, [loading, user, userData]);

  const checkAdminStatus = async () => {
    if (!user || !userData) return;

    // Check if user is a global admin
    const globalAdmin = isAdminUser(userData.role, user.email);
    setIsAdmin(globalAdmin);

    if (globalAdmin) {
      // Global admins can manage all clubs
      setAdminClubs(BROAD_RUN_CLUBS.map(club => club.name));
    } else {
      // Check for club-specific admin roles
      const userAdminClubs = await getUserAdminClubs(user.uid);
      setAdminClubs(userAdminClubs.map(ac => ac.clubName));
    }

    setLoadingAdmin(false);
  };

  const handleClubSelect = (clubName) => {
    setSelectedClub(clubName);
    setActiveTab("announcements");
  };

  if (loading || loadingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="rounded-lg bg-blue-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Sign in to access admin features</h2>
        <p className="text-blue-800 mb-4">You need to be logged in to manage clubs.</p>
        <button
          type="button"
          onClick={() => router.push("/login?redirectTo=%2Fclub-hub%2Fadmin")}
          className="inline-block rounded-lg bg-[#5c1417] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#731a1f]"
        >
          Log In
        </button>
      </div>
    );
  }

  if (!isAdmin && adminClubs.length === 0) {
    return (
      <div className="rounded-lg bg-yellow-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">No Admin Access</h2>
        <p className="text-yellow-800">
          You don't have admin privileges for any clubs. Contact a global admin if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            You have admin access to {adminClubs.length} club{adminClubs.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <h3 className="font-semibold text-neutral-900">Select Club to Manage</h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(isAdmin ? BROAD_RUN_CLUBS : BROAD_RUN_CLUBS.filter(club => adminClubs.includes(club.name))).map((club) => (
              <button
                key={club.name}
                type="button"
                onClick={() => handleClubSelect(club.name)}
                className={`min-h-[3rem] rounded-lg px-2 py-2 text-center text-[11px] font-semibold leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c1417] focus-visible:ring-offset-2 sm:text-xs ${
                  selectedClub === club.name
                    ? 'bg-[#5c1417] text-white'
                    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                }`}
              >
                <span className="line-clamp-3">{club.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedClub && (
        <>
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <h3 className="font-semibold text-neutral-900">Managing: {selectedClub}</h3>
            </div>

            <div className="border-b border-neutral-200">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("announcements")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "announcements"
                      ? "bg-white text-[#5c1417] border-b-2 border-[#5c1417]"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  Announcements
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("attendance")}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === "attendance"
                      ? "bg-white text-[#5c1417] border-b-2 border-[#5c1417]"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  Attendance
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "announcements" && (
                <ClubAnnouncements clubName={selectedClub} />
              )}
              {activeTab === "attendance" && (
                <ClubAttendanceTracker clubName={selectedClub} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}