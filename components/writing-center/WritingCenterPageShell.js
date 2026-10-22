"use client";

import { Suspense } from "react";
import DashboardTopBar from "@/components/layout/DashboardTopBar";
import WritingCenterSidebar from "@/components/writing-center/WritingCenterSidebar";
import SiteSkipLink from "@/components/common/SiteSkipLink";
import { SITE_MAIN_ID } from "@/lib/a11y/site";

export default function WritingCenterPageShell({
  children,
  contentClassName = "ml-0 md:ml-16 flex min-h-0 flex-1 flex-col pb-16 md:pb-0",
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteSkipLink />
      <DashboardTopBar title="Writing Center" />
      <Suspense fallback={null}>
        <WritingCenterSidebar />
      </Suspense>
      <main
        id={SITE_MAIN_ID}
        className={["outline-none", contentClassName].filter(Boolean).join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
