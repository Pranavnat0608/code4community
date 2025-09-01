"use client";
import { useAuth } from "../../components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardTopBar from "../../components/DashboardTopBar";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/firebase";

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);
  const [mathLabRole, setMathLabRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  // Simple caching to prevent loading delay
  useEffect(() => {
    const cached = localStorage.getItem('brhs_user_cache');
    if (cached) {
      try {
        const user = JSON.parse(cached);
        setCachedUser(user);
        setMathLabRole(user.mathLabRole || "");
      } catch (e) {
        localStorage.removeItem('brhs_user_cache');
      }
    }
  }, []);

  // Update cache when userData changes
  useEffect(() => {
    if (userData && user) {
      // Combine Firebase Auth user with Firestore data
      const combinedUserData = {
        ...userData,
        uid: user.uid,
        email: user.email
      };
      localStorage.setItem('brhs_user_cache', JSON.stringify(combinedUserData));
      setCachedUser(combinedUserData);
      setMathLabRole(userData.mathLabRole || "");
    }
  }, [userData, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !cachedUser) {
      router.push('/login');
    }
  }, [user, cachedUser, router]);

  const handleMathLabRoleUpdate = async () => {
    if (!mathLabRole) {
      setUpdateMessage("Please select a role");
      return;
    }

    setIsUpdating(true);
    setUpdateMessage("");

    try {
      // Get user ID from multiple sources with proper fallback
      const userId = user?.uid || cachedUser?.uid;
      if (!userId) {
        throw new Error("User ID not found. Please try refreshing the page.");
      }

      // Update Firestore
      await updateDoc(doc(firestore, "users", userId), {
        mathLabRole: mathLabRole,
        updatedAt: new Date()
      });

      // Update local cache
      const updatedUser = { ...cachedUser, mathLabRole };
      localStorage.setItem('brhs_user_cache', JSON.stringify(updatedUser));
      setCachedUser(updatedUser);

      setUpdateMessage("Math Lab role updated successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(""), 3000);
    } catch (error) {
      console.error("Error updating math lab role:", error);
      setUpdateMessage(error.message || "Failed to update role. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Use cached user if available, fallback to real userData + user
  const displayUser = cachedUser || (userData && user ? { ...userData, uid: user.uid, email: user.email } : null);

  if (!displayUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopBar title="Settings" showNavLinks={false} />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

          {/* Math Lab Section */}
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Math Lab Preferences</h2>
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Choose your role in the Math Lab system. This determines how you&apos;ll interact with the tutoring platform.
            </p>

            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Math Lab Role
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Option */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      mathLabRole === 'student' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setMathLabRole('student')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        mathLabRole === 'student' 
                          ? 'border-primary bg-primary' 
                          : 'border-border'
                      }`}>
                        {mathLabRole === 'student' && (
                          <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Student</div>
                        <div className="text-sm text-muted-foreground">
                          Get help from tutors and access learning resources
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tutor Option */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      mathLabRole === 'tutor' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setMathLabRole('tutor')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        mathLabRole === 'tutor' 
                          ? 'border-primary bg-primary' 
                          : 'border-border'
                      }`}>
                        {mathLabRole === 'tutor' && (
                          <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Tutor</div>
                        <div className="text-sm text-muted-foreground">
                          Help students and manage tutoring sessions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Button */}
              <div className="pt-4">
                <button
                  onClick={handleMathLabRoleUpdate}
                  disabled={isUpdating || !mathLabRole}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    "Update Math Lab Role"
                  )}
                </button>
              </div>

              {/* Status Message */}
              {updateMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  updateMessage.includes("successfully") 
                    ? "bg-green-100 text-green-800 border border-green-200" 
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                  {updateMessage}
                </div>
              )}
            </div>
          </div>

          {/* User Info Section */}
          <div className="card-elevated p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Display Name
                </label>
                <div className="text-foreground font-medium">
                  {displayUser.displayName || "Not set"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <div className="text-foreground font-medium">
                  {displayUser.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Account Role
                </label>
                <div className="text-foreground font-medium capitalize">
                  {displayUser.role}
                </div>
              </div>

              {displayUser.mathLabRole && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Math Lab Role
                  </label>
                  <div className="text-foreground font-medium capitalize">
                    {displayUser.mathLabRole}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
