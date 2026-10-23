"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { isSiteAdminUser } from "@/lib/auth/productAdmins";
import { canEditClubHubPage } from "@/lib/club-hub/access";
import { useClubHubAccess } from "@/lib/club-hub/useClubHubAccess";
import { ensureUnicefProfile, fetchUnicefSettings } from "@/lib/unicef/api";
import { DEFAULT_UNICEF_SETTINGS } from "@/lib/unicef/hours";

export function useUnicefAccess() {
  const { user, userData, loading: authLoading } = useAuth();
  const { accessRecord, sponsorOverrides, loading: accessLoading } = useClubHubAccess();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_UNICEF_SETTINGS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || accessLoading) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const nextSettings = await fetchUnicefSettings();
        if (cancelled) return;
        setSettings(nextSettings);
        if (user?.uid) {
          const nextProfile = await ensureUnicefProfile(user.uid, user, userData);
          if (!cancelled) setProfile(nextProfile);
        } else if (!cancelled) {
          setProfile(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load UNICEF.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, accessLoading, user, userData]);

  const clubEditor = Boolean(
    user &&
      canEditClubHubPage({
        email: user.email,
        slug: "unicef",
        userData,
        accessRecord,
        sponsorOverrides,
      }),
  );
  const siteAdmin = isSiteAdminUser(userData, user?.email);
  const officer =
    siteAdmin || clubEditor || profile?.role === "board" || profile?.role === "sponsor";

  return {
    user,
    userData,
    authLoading: authLoading || accessLoading || !ready,
    profile,
    setProfile,
    settings,
    setSettings,
    officer,
    error,
  };
}
