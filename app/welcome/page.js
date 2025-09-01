"use client";
import { useAuth } from "../../components/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardTopBar from "../../components/DashboardTopBar";

export default function Welcome() {
  const { userData } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [cachedUser, setCachedUser] = useState(null);

  // Simple caching to prevent flash
  useEffect(() => {
    const cached = localStorage.getItem('brhs_user_cache');
    if (cached) {
      try {
        setCachedUser(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('brhs_user_cache');
      }
    }
  }, []);

  // Update cache when userData changes
  useEffect(() => {
    if (userData) {
      localStorage.setItem('brhs_user_cache', JSON.stringify(userData));
      setCachedUser(userData);
    }
  }, [userData]);

  const handleMathLabClick = () => {
    if (userData || cachedUser) {
      router.push('/mathlab');
    } else {
      router.push('/login');
    }
  };

  // Use cached user if available, fallback to real userData
  const displayUser = userData || cachedUser;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Use the reusable DashboardTopBar component */}
      <DashboardTopBar 
        title="BRHS Utilities" 
        showNavLinks={false} // Don't show navigation links on welcome page
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-8">
          {/* Math Lab Card */}
          <button
            type="button"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleMathLabClick}
            className={`card-elevated relative w-[300px] h-[300px] mx-auto flex items-center justify-center rounded-lg transition-transform duration-300 ${isHovered ? 'transform scale-105' : ''}`}
          >
            <div className="absolute inset-0 rounded-lg bg-primary/10"></div>
            <div className="relative z-10">
              <div className="text-2xl font-bold mb-2 text-foreground">BRHS</div>
              <div className="text-xl font-semibold text-foreground">Math Lab</div>
            </div>
          </button>

          {/* Welcome Message - Only show when signed in */}
          {displayUser && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {displayUser.displayName || displayUser.email}!
              </h2>
              <p className="text-muted-foreground">
                Click on Math Lab above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
