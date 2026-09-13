"use client";

import { useState, useEffect } from "react";
import { createClubAnnouncement, getClubAnnouncements, isClubAdmin } from "@/lib/clubHelpers";
import { useAuth } from "@/utils/AuthContext";

const MAROON = "#5c1417";

export default function ClubAnnouncements({ clubName }) {
  const { user, userData } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && clubName) {
      checkAdminStatus();
      loadAnnouncements();
    }
  }, [user, clubName]);

  const checkAdminStatus = async () => {
    if (!user || !clubName) return;
    const adminStatus = await isClubAdmin(user.uid, clubName);
    setIsAdmin(adminStatus);
  };

  const loadAnnouncements = async () => {
    if (!clubName) return;
    
    setLoading(true);
    try {
      const clubAnnouncements = await getClubAnnouncements(clubName);
      setAnnouncements(clubAnnouncements);
    } catch (err) {
      console.error("Error loading announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!user || !userData || !content.trim()) return;

    setPosting(true);
    setError("");

    try {
      const result = await createClubAnnouncement(
        clubName,
        content.trim(),
        userData.displayName,
        user.uid
      );
      
      if (result.success) {
        setContent("");
        await loadAnnouncements();
      }
    } catch (err) {
      setError("Failed to post announcement. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-center text-neutral-600">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <h3 className="font-semibold text-neutral-900">Club Announcements</h3>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {isAdmin && (
          <form onSubmit={handlePostAnnouncement} className="mb-6">
            <label htmlFor="announcement" className="block text-sm font-medium text-neutral-700 mb-2">
              Post a new announcement
            </label>
            <textarea
              id="announcement"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your announcement..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#5c1417] focus:outline-none focus:ring-1 focus:ring-[#5c1417]"
              rows={3}
              maxLength={2000}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {content.length}/2000 characters
              </span>
              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="rounded-lg bg-[#5c1417] px-4 py-2 text-sm font-semibold text-white hover:bg-[#731a1f] disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </form>
        )}

        {announcements.length === 0 ? (
          <p className="text-center text-neutral-600 py-4">No announcements yet.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900">{announcement.senderName}</span>
                    <span className="mx-2 text-neutral-400">•</span>
                    <span className="text-xs text-neutral-600">
                      {announcement.createdAt?.toDate?.()?.toLocaleString() || "Recently"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}