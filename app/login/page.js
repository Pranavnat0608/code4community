"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider, firestore } from "@/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { getFirebaseErrorMessage } from "@/utils/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!loading && user && justLoggedIn) {
      if (!userData) {
        router.push("/signup/role");
        return;
      }
      if (!userData.role) {
        router.push("/signup/role");
        return;
      }
      if (userData.role === "admin") {
        router.push("/admin/dashboard");
      } else if (userData.role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (userData.role === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [user, userData, loading, router, justLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setJustLoggedIn(true);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        const usersQuery = query(collection(firestore, "users"), where("email", "==", user.email));
        const userSnapshot = await getDocs(usersQuery);
        if (!userSnapshot.empty) {
          setError("An account with this email already exists using email/password. Please use your password to sign in.");
          return;
        }
        router.push("/signup");
        return;
      }
      const userData = userDoc.data();
      if (user.photoURL && userData.photoURL !== user.photoURL) {
        let modifiedPhotoURL = user.photoURL;
        if (user.photoURL.includes('lh3.googleusercontent.com')) {
          modifiedPhotoURL = user.photoURL.replace(/=s\d+-c$/, '=s400-c');
        }
        try {
          await updateDoc(doc(firestore, "users", user.uid), { photoURL: modifiedPhotoURL });
        } catch (error) {
          console.error("Error updating photoURL during login:", error);
        }
      }
      setJustLoggedIn(true);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium mb-4">Loading...</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary hover:text-primary/80 underline">If this takes too long, click here to reload</button>
        </div>
      </div>
    );
  }

  if (user && userData && userData.role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="relative">
              <Image src="/logo.png" alt="StudyHub Logo" width={40} height={40} className="w-10 h-10 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <span className="text-2xl font-bold text-foreground">StudyHub</span>
          </Link>
          <h1 className="text-3xl font-bold mb-3">Welcome back</h1>
          <p className="text-muted-foreground text-lg">Sign in to your account</p>
        </div>

        <div className="card-elevated p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-3 text-foreground">Email address</label>
              <input id="email" type="email" placeholder="Enter your email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-3 text-foreground">Password</label>
              <input id="password" type="password" placeholder="Enter your password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary w-full text-base py-4">
              Sign In
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="w-full btn-outline flex items-center justify-center gap-3 py-4 text-base">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6" />
            Continue with Google
          </button>

          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
