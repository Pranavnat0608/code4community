"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

const writingCenterIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const historyIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

function SidebarNavEntry({ item, isCollapsed, isMobile }) {
  const iconOnlyLabel = isCollapsed && !isMobile ? item.label : undefined;
  const className = isMobile
    ? `flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
        item.isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
      }`
    : `flex items-center p-3 rounded-lg transition-all duration-200 group w-full ${
        item.isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`;

  return (
    <Link href={item.href} className={className} aria-label={iconOnlyLabel} aria-current={item.isActive ? "page" : undefined}>
      <div className="flex-shrink-0">{item.icon}</div>
      {(!isCollapsed || isMobile) && (
        <span className={isMobile ? "text-xs font-medium truncate mt-1" : "ml-3 text-sm font-medium truncate"}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

export default function WritingCenterSidebar() {
  const isMobile = useIsMobile();
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const isCollapsed = isMobile ? true : desktopCollapsed;
  const pathname = usePathname();

  const navigationItems = [
    {
      id: "writing-center",
      label: "Writing Center",
      icon: writingCenterIcon,
      href: "/writing-center",
      isActive: pathname === "/writing-center",
    },
    {
      id: "history",
      label: "Session History",
      icon: historyIcon,
      href: "/writing-center/history",
      isActive: pathname === "/writing-center/history",
    },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 md:hidden">
        <nav className="flex" aria-label="Writing Center">
          {navigationItems.map((item) => (
            <SidebarNavEntry key={item.id} item={item} isCollapsed={false} isMobile />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div
      className={`fixed left-0 top-0 bottom-0 z-40 bg-background border-r border-border transition-all duration-300 flex flex-col pt-[var(--mathlab-header-height,4.5rem)] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-border">
        <button
          type="button"
          onClick={() => setDesktopCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
              isCollapsed ? "rotate-0" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <nav className="p-2 space-y-1 flex-1 overflow-y-auto overscroll-contain" aria-label="Writing Center">
        {navigationItems.map((item) => (
          <SidebarNavEntry key={item.id} item={item} isCollapsed={isCollapsed} isMobile={false} />
        ))}
      </nav>
    </div>
  );
}
