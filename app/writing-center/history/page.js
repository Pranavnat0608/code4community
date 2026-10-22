"use client";

import { useAuth } from "@/utils/AuthContext";
import { AppPageLayout } from "@/components/common/AppPageLayout";
import StudentDashboard from "@/components/writing-center/StudentDashboard";
import WritingCenterPageShell from "@/components/writing-center/WritingCenterPageShell";
import { firestore } from "@/firebase";

export default function WritingCenterHistoryPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <WritingCenterPageShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </WritingCenterPageShell>
    );
  }

  if (!firestore || !user) {
    return (
      <AppPageLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Session History</h1>
            <p className="text-gray-600 mb-4">Please sign in to see your Writing Center requests.</p>
            <a
              href={`/login?redirectTo=${encodeURIComponent("/writing-center/history")}`}
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Sign In
            </a>
          </div>
        </div>
      </AppPageLayout>
    );
  }

  return (
    <WritingCenterPageShell>
      <StudentDashboard mode="history" />
    </WritingCenterPageShell>
  );
}
