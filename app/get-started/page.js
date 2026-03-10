"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GetStartedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <p className="text-muted-foreground">Redirecting to sign up…</p>
    </div>
  );
}
