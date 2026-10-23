"use client";

import { ClubHubAccessProvider } from "@/lib/club-hub/ClubHubAccessProvider";
import UnicefShell from "@/components/unicef/UnicefShell";
import { accountName } from "@/lib/unicef/accountName";
import { useUnicefAccess } from "@/lib/unicef/useUnicefAccess";

function Frame({ children }) {
  const { officer, user, userData } = useUnicefAccess();
  const displayName = accountName(user, userData).displayName;
  return (
    <UnicefShell officer={officer} signedIn={Boolean(user)} displayName={displayName}>
      {children}
    </UnicefShell>
  );
}

export default function UnicefLayout({ children }) {
  return (
    <ClubHubAccessProvider>
      <Frame>{children}</Frame>
    </ClubHubAccessProvider>
  );
}
