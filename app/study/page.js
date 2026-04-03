"use client";

import { useLayoutEffect, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../utils/AuthContext";
import DashboardTopBar from "../../components/DashboardTopBar";
import Footer from "../../components/Footer";
import StudyQuiz from "../../components/study/StudyQuiz";

export default function StudyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useLayoutEffect(() => {
    document.title = "Code4Community | Studying";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.emailVerified) {
      router.replace("/verify-email");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || !user.emailVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopBar title="Code4Community" showNavLinks={true} />

      <div className="flex-1 container mx-auto px-6 py-4 md:py-6">
        <div className="max-w-6xl mx-auto w-full min-w-0 space-y-6">
          <StudyQuiz user={user} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
