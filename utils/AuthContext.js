"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "@/firebase";
import { UserCache, CachePerformance } from "@/utils/cache";
import { isAdminEmail } from "@/config/admin";
import { lookupBroadRunName } from "@/lib/broadRunRoster";
import {
  applyPendingGrantToProfile,
  MATHLAB_TEAM_PENDING_COLLECTION,
  pendingTeamDocId,
} from "@/lib/mathlabTeamPending";
import { normalizeEmail } from "@/lib/email";

const AuthContext = createContext({ user: null, userData: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(auth));
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchUserData = useCallback(async (currentUser, forceRefresh = false) => {
    if (!currentUser || !firestore) {
      return null;
    }

    const timing = CachePerformance.startTiming("fetchUserData");

    try {
      if (!forceRefresh) {
        const cachedData = UserCache.getUserData();
        if (cachedData && cachedData.uid === currentUser.uid) {
          CachePerformance.endTiming(timing);
          return cachedData;
        }
      }

      const docRef = doc(firestore, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const normalizedEmail = normalizeEmail(data.email || currentUser.email);
        if (data.email && data.email !== normalizedEmail) {
          try {
            await updateDoc(docRef, { email: normalizedEmail, updatedAt: serverTimestamp() });
            data.email = normalizedEmail;
          } catch (migrateErr) {
            console.warn("[AuthContext] could not normalize stored email", migrateErr);
          }
        }
        const userDataWithUid = { ...data, email: normalizedEmail, uid: currentUser.uid };
        UserCache.setUserData(userDataWithUid);
        setLastFetchTime(Date.now());
        CachePerformance.endTiming(timing);
        return userDataWithUid;
      }

      const normalizedEmail = normalizeEmail(currentUser.email);
      const rosterName = lookupBroadRunName(normalizedEmail);
      const displayName =
        rosterName ||
        (currentUser.displayName && currentUser.displayName.trim()) ||
        (normalizedEmail && normalizedEmail.split("@")[0]) ||
        "User";
      let role = isAdminEmail(normalizedEmail) ? "admin" : "student";
      let mathLabRole = "";
      const pendingRef = doc(
        firestore,
        MATHLAB_TEAM_PENDING_COLLECTION,
        pendingTeamDocId(normalizedEmail),
      );
      const pendingSnap = await getDoc(pendingRef);
      if (pendingSnap.exists()) {
        const withPending = applyPendingGrantToProfile(
          pendingSnap.data(),
          { role, mathLabRole },
          normalizedEmail,
        );
        role = withPending.role;
        mathLabRole = withPending.mathLabRole;
      }
      const newProfile = {
        email: normalizedEmail,
        displayName,
        photoURL: currentUser.photoURL || "",
        role,
        mathLabRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, newProfile);
      if (pendingSnap.exists()) {
        try {
          await deleteDoc(pendingRef);
        } catch (pendingErr) {
          console.warn("[AuthContext] could not clear pending team grant", pendingErr);
        }
      }
      const again = await getDoc(docRef);
      if (again.exists()) {
        const userDataWithUid = { ...again.data(), uid: currentUser.uid };
        UserCache.setUserData(userDataWithUid);
        setLastFetchTime(Date.now());
        CachePerformance.endTiming(timing);
        return userDataWithUid;
      }

      CachePerformance.endTiming(timing);
      return null;
    } catch (err) {
      console.error("[AuthContext] fetchUserData", {
        error: err,
        code: err?.code,
        message: err?.message,
        uid: currentUser?.uid,
        forceRefresh,
      });
      CachePerformance.endTiming(timing);
      return null;
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) {
      return;
    }

    const timing = CachePerformance.startTiming("refreshUserData");
    const timeSinceLastFetch = Date.now() - lastFetchTime;
    const shouldRefresh = timeSinceLastFetch > 5 * 60 * 1000;

    if (shouldRefresh) {
      const data = await fetchUserData(user, true);
      if (data) {
        setUserData(data);
        setLastFetchTime(Date.now());
      }
    }

    CachePerformance.endTiming(timing);
  }, [user, fetchUserData, lastFetchTime]);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);

        if (currentUser) {
          const freshData = await fetchUserData(currentUser, true);
          if (freshData) {
            setUserData(freshData);
            setLastFetchTime(Date.now());
          } else {
            const cachedData = UserCache.getUserData();
            if (cachedData && cachedData.uid === currentUser.uid) {
              setUserData(cachedData);
            }
          }
        } else {
          setUserData(null);
          UserCache.clearUserData();
        }
      } catch (error) {
        console.error("[AuthContext] Auth state change error:", {
          error: error.message,
          code: error.code,
          hasUser: !!currentUser,
          uid: currentUser?.uid,
        });
        const cachedData = UserCache.getUserData();
        if (cachedData) {
          setUserData(cachedData);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  useEffect(() => {
    const handleRoleChange = async (event) => {
      if (user && event.detail.userId === user.uid) {
        const freshData = await fetchUserData(user, true);
        if (freshData) {
          setUserData(freshData);
          setLastFetchTime(Date.now());
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("userRoleChanged", handleRoleChange);
      return () => {
        window.removeEventListener("userRoleChanged", handleRoleChange);
      };
    }
    return undefined;
  }, [user, fetchUserData]);

  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirectTo");
      if (redirectTo && redirectTo.startsWith("/")) {
        return redirectTo;
      }
    }
    return null;
  };

  const contextValue = useMemo(
    () => ({
      user,
      userData,
      loading,
      getRedirectUrl,
      refreshUserData,
      lastFetchTime,
      isEmailVerified: true,
    }),
    [user, userData, loading, refreshUserData, lastFetchTime],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
