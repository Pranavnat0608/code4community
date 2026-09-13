"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import ClubAdminDashboard from "@/components/club-hub/ClubAdminDashboard";

const MAROON = "#5c1417";

export default function ClubAdminPage() {
  useLayoutEffect(() => {
    document.title = "Club Admin - Broad Run Club Hub";
  }, []);

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
          <Link href="/club-hub/my-clubs" className="hover:underline underline-offset-4">
            My Clubs
          </Link>
          <span className="cursor-default opacity-95 underline decoration-white underline-offset-4">Admin</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[90vw] px-4 pb-12 pt-10 sm:px-6 sm:pt-12">
        <div className="border-y border-neutral-900 py-4 sm:py-5 mb-6">
          <h2 className="text-center text-base font-bold uppercase tracking-[0.06em] text-[#5c1417] sm:text-lg">
            Club Administration
          </h2>
        </div>

        <ClubAdminDashboard />
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