"use client";

import { useLayoutEffect } from "react";
import { AppPageLayout } from "@/components/common/AppPageLayout";
import GroupGenerator from "@/components/groups/GroupGenerator";

export default function StudentGroupsPage() {
  useLayoutEffect(() => {
    document.title = "Code4Community | Student Groups";
  }, []);

  return (
    <AppPageLayout title="Student Groups">
      <div className="flex-1 min-h-0">
        <GroupGenerator />
      </div>
    </AppPageLayout>
  );
}
