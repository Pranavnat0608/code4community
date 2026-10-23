"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { unicefButtonClass, unicefGhostButtonClass } from "@/components/unicef/ui";

const PUBLIC_LINKS = [
  { href: "/unicef", label: "Home" },
  { href: "/unicef/info", label: "Info" },
  { href: "/unicef/opportunities", label: "Opportunities" },
];

const MEMBER_LINKS = [
  ...PUBLIC_LINKS,
  { href: "/unicef/submit", label: "Submit" },
  { href: "/unicef/hours", label: "My Hours" },
  { href: "/unicef/profile", label: "Profile" },
];

/**
 * @param {{ children: React.ReactNode, officer?: boolean, signedIn?: boolean, displayName?: string }} props
 */
export default function UnicefShell({ children, officer = false, signedIn = false, displayName = "" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = signedIn ? [...MEMBER_LINKS, ...(officer ? [{ href: "/unicef/admin", label: "Admin" }] : [])] : PUBLIC_LINKS;

  const item = (href, label, block = false) => {
    const active = href === "/unicef" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`${unicefGhostButtonClass} ${block ? "justify-start" : ""} ${active ? "bg-slate-100" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-base leading-normal text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/unicef" className="text-lg font-bold text-slate-950">
            UNICEF
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="UNICEF">
            {links.map((link) => item(link.href, link.label))}
            {signedIn ? (
              <span className="ml-2 text-sm text-slate-500">{displayName}</span>
            ) : (
              <Link href="/login?redirectTo=%2Funicef" className={`${unicefButtonClass} ml-2 h-8 px-3`}>
                Sign in
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="rounded-md p-2 md:hidden"
            aria-label={open ? "Close menu" : "Menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden">
            {links.map((link) => item(link.href, link.label, true))}
            {signedIn ? null : (
              <Link href="/login?redirectTo=%2Funicef" onClick={() => setOpen(false)} className={`${unicefButtonClass} mt-1`}>
                Sign in
              </Link>
            )}
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
