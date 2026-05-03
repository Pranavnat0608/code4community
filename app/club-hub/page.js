"use client";

import { useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ClubHubWeekCalendar from "@/components/club-hub/ClubHubWeekCalendar";

const MAROON = "#5c1417";
const MAROON_DARK = "#3f0e10";

const RANKINGS = [
  {
    title: "Club Engagement Rankings (L1)",
    rows: [
      { rank: 1, name: "Baking Club" },
      { rank: 2, name: "Book Club" },
      { rank: 3, name: "Robotics B Team" },
    ],
  },
  {
    title: "Club Engagement Rankings (L2)",
    rows: [
      { rank: 1, name: "Red Cross Club" },
      { rank: 2, name: "Peer Tutoring" },
      { rank: 3, name: "Asian Culture Club" },
    ],
  },
  {
    title: "Club Engagement Rankings (L3)",
    rows: [
      { rank: 1, name: "Student Senate" },
      { rank: 2, name: "Prefect Council" },
      { rank: 3, name: "Spartan Student Life" },
    ],
  },
];

function RankMedal({ rank }) {
  const ring =
    rank === 1
      ? "from-amber-300 via-yellow-400 to-amber-600 text-amber-950 border-amber-700 shadow-[0_0_0_1px_rgba(180,83,9,0.35)]"
      : rank === 2
        ? "from-slate-100 via-slate-300 to-slate-400 text-slate-800 border-slate-500"
        : "from-amber-800 via-amber-900 to-amber-950 text-amber-100 border-amber-950";
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br text-sm font-bold shadow-md ${ring}`}
    >
      {rank}
    </span>
  );
}

function nameColor(rank) {
  if (rank === 1) return "text-amber-600";
  if (rank === 2) return "text-slate-500";
  return "text-amber-900";
}

export default function ClubHubPage() {
  useLayoutEffect(() => {
    document.title = "Broad Run Club Hub";
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <section className="relative min-h-[280px] sm:min-h-[340px]">
        <Image
          src="/Broad_Run_HS_Ashburn_VA_20147_ext2.JPG"
          alt="Broad Run High School, Ashburn, Virginia"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(60,12,16,0.55) 0%, rgba(60,12,16,0.82) 100%)`,
          }}
        />
        <div className="relative z-10 flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[340px]">
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
            Broad Run Club Hub
          </h1>
        </div>
      </section>

      <nav
        className="sticky top-0 z-20 border-b border-black/10 shadow-md"
        style={{ backgroundColor: MAROON }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-10 px-4 py-3.5 text-sm font-semibold tracking-wide text-white sm:gap-16 sm:text-base">
          <Link href="#club-directory" className="hover:underline underline-offset-4">
            Club Directory
          </Link>
          <Link href="/login?redirectTo=%2Fclub-hub" className="hover:underline underline-offset-4">
            Login
          </Link>
        </div>
      </nav>

      <main id="club-directory" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {RANKINGS.map((col) => (
            <div
              key={col.title}
              className="overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            >
              <div
                className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white sm:text-[13px]"
                style={{ backgroundColor: MAROON }}
              >
                {col.title}
              </div>
              <ul className="divide-y divide-neutral-200">
                {col.rows.map((row) => (
                  <li key={row.name} className="flex items-center gap-3 px-4 py-4">
                    <RankMedal rank={row.rank} />
                    <span className={`text-base font-semibold sm:text-lg ${nameColor(row.rank)}`}>
                      {row.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <section
        className="relative border-t border-black/10 py-14 sm:py-16"
        style={{
          backgroundColor: MAROON_DARK,
          backgroundImage:
            "linear-gradient(rgba(40,8,10,0.88), rgba(40,8,10,0.92)), url(/Broad_Run_HS_Ashburn_VA_20147_ext2.JPG)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" aria-hidden />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
            Calendar
          </h2>
          <ClubHubWeekCalendar />
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500">
        <Link href="/" className="text-[#5c1417] hover:underline">
          ← Back to Code4Community
        </Link>
      </footer>
    </div>
  );
}
