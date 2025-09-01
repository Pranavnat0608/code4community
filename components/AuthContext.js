"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/firebase";

const AuthContext = createContext({ user: null, userData: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(firestore, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          setUserData(docSnap.exists() ? docSnap.data() : null);
        } catch (err) {
          console.error("Error fetching user data", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to get redirect URL from query params
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo');
      if (redirectTo && redirectTo.startsWith('/')) {
        return redirectTo;
      }
    }
    return null;
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (user) {
      try {
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);
        setUserData(docSnap.exists() ? docSnap.data() : null);
      } catch (err) {
        console.error("Error refreshing user data", err);
        setUserData(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, getRedirectUrl, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
