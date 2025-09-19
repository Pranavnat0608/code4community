"use client";
import { useAuth } from "../../components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardTopBar from "../../components/DashboardTopBar";
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { SettingsCache, UserCache, MathLabCache, CachePerformance, CacheInvalidation } from "@/utils/cache";
import { invalidateOnDataChange } from "@/utils/cacheInvalidation";

export default function SettingsPage() {
  const { user, userData, isEmailVerified } = useAuth();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);
  const [mathLabRole, setMathLabRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  
  // Tutor management state
  const [tutors, setTutors] = useState([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [newTutorEmail, setNewTutorEmail] = useState("");
  const [isAddingTutor, setIsAddingTutor] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Optimized caching with centralized cache manager
  useEffect(() => {
    const timing = CachePerformance.startTiming('loadSettingsCachedUser');
    
    const cached = UserCache.getUserData();
    if (cached) {
      setCachedUser(cached);
      setMathLabRole(cached.mathLabRole || "");
    }
    
    CachePerformance.endTiming(timing);
  }, []);

  // Update cache when userData changes
  useEffect(() => {
    if (userData && user) {
      const timing = CachePerformance.startTiming('updateSettingsCache');
      
      // Combine Firebase Auth user with Firestore data
      const combinedUserData = {
        ...userData,
        uid: user.uid,
        email: user.email
      };
      
      // Update cache using centralized cache manager
      UserCache.setUserData(combinedUserData);
      setCachedUser(combinedUserData);
      setMathLabRole(userData.mathLabRole || "");
      
      CachePerformance.endTiming(timing);
    }
  }, [userData, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !cachedUser) {
      router.push('/login');
    }
  }, [user, cachedUser, router]);

  // Redirect to email verification if email is not verified
  useEffect(() => {
    if (userData && !isEmailVerified) {
      router.push('/verify-email?email=' + encodeURIComponent(userData.email));
    }
  }, [userData, isEmailVerified, router]);

  const handleMathLabRoleUpdate = async (selectedRole = mathLabRole) => {
    if (!selectedRole) {
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

      // Check if user is switching roles
      const currentRole = cachedUser?.mathLabRole;
      const isSwitchingToStudent = currentRole === 'tutor' && selectedRole === 'student';
      
      // If switching to student, clear any active tutor sessions
      if (isSwitchingToStudent) {
        // Clear MathLab cache to remove any tutor-related data
        MathLabCache.clearAll();
      }

      // Update Firestore
      await updateDoc(doc(firestore, "users", userId), {
        mathLabRole: selectedRole,
        updatedAt: new Date()
      });

      // Update local cache using centralized cache manager
      const updatedUser = { ...cachedUser, mathLabRole: selectedRole };
      UserCache.setUserData(updatedUser);
      setCachedUser(updatedUser);
      
      // Invalidate related caches to prevent stale data
      invalidateOnDataChange('mathlab_role', 'update');
      
      // Trigger a custom event to force AuthContext refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userRoleChanged', { 
          detail: { newRole: selectedRole, userId } 
        }));
      }

      // Show appropriate success message
      if (isSwitchingToStudent) {
        setUpdateMessage("Role updated to student. Any active tutor sessions have been cleared.");
      } else {
        setUpdateMessage("Math Lab role updated successfully!");
      }
      
      // Clear message after 4 seconds (longer for role change message)
      setTimeout(() => setUpdateMessage(""), 4000);
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

  // Tab configuration
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "mathlab", label: "Math Lab" },
    { id: "preferences", label: "Preferences" },
    { id: "account", label: "Account" }
  ];

  // Fetch tutors (admin only)
  const fetchTutors = async () => {
    if (displayUser?.role !== 'admin') return;
    
    setIsLoadingTutors(true);
    try {
      const q = query(
        collection(firestore, "users"),
        where("mathLabRole", "==", "tutor")
      );
      
      const snapshot = await getDocs(q);
      const tutorsList = [];
      snapshot.forEach((doc) => {
        tutorsList.push({ id: doc.id, ...doc.data() });
      });
      
      setTutors(tutorsList);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setUpdateMessage("Failed to fetch tutors");
    } finally {
      setIsLoadingTutors(false);
    }
  };

  // Add tutor (admin only)
  const handleAddTutor = async () => {
    if (!newTutorEmail.trim()) {
      setUpdateMessage("Please enter an email address");
      return;
    }

    setIsAddingTutor(true);
    try {
      // First, find the user by email
      const q = query(
        collection(firestore, "users"),
        where("email", "==", newTutorEmail.trim())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setUpdateMessage("User with this email not found. They must sign up first.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Update their mathLabRole to tutor
      await updateDoc(doc(firestore, "users", userDoc.id), {
        mathLabRole: "tutor",
        updatedAt: new Date()
      });

      // Refresh tutors list
      await fetchTutors();
      setNewTutorEmail("");
      setUpdateMessage(`Successfully added ${userData.displayName || userData.email} as a tutor`);
    } catch (error) {
      console.error("Error adding tutor:", error);
      setUpdateMessage("Failed to add tutor. Please try again.");
    } finally {
      setIsAddingTutor(false);
    }
  };

  // Remove tutor (admin only)
  const handleRemoveTutor = async (tutorId, tutorName) => {
    if (!confirm(`Are you sure you want to remove ${tutorName} as a tutor?`)) {
      return;
    }

    try {
      // Update their mathLabRole to student
      await updateDoc(doc(firestore, "users", tutorId), {
        mathLabRole: "student",
        updatedAt: new Date()
      });

      // Refresh tutors list
      await fetchTutors();
      setUpdateMessage(`Successfully removed ${tutorName} as a tutor`);
    } catch (error) {
      console.error("Error removing tutor:", error);
      setUpdateMessage("Failed to remove tutor. Please try again.");
    }
  };

  // Load tutors when admin accesses the page
  useEffect(() => {
    if (displayUser?.role === 'admin' && activeTab === 'mathlab') {
      fetchTutors();
    }
  }, [displayUser?.role, activeTab]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Profile Information</h3>
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
              </div>
            </div>
          </div>
        );

      case "mathlab":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Math Lab Settings</h3>
              <p className="text-muted-foreground mb-6">
                Choose your role in the Math Lab system. This determines how you&apos;ll interact with the tutoring platform.
              </p>

              <div className="space-y-6">
                {/* Student Role - Only Option */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    Math Lab Role
                  </label>
                  
                  <div className="max-w-md">
                    <div className="p-4 border-2 border-primary bg-primary/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary">
                          <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Student</div>
                          <div className="text-sm text-muted-foreground">
                            Get help from tutors and access learning resources
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-3">
                      Tutor roles are managed by administrators only. Contact an admin if you need tutor access.
                    </p>
                  </div>
                </div>

                {/* Update Button - Only show if not already student */}
                {displayUser?.mathLabRole !== 'student' && (
                  <div className="pt-4">
                    <button
                      onClick={() => handleMathLabRoleUpdate('student')}
                      disabled={isUpdating}
                      className={`px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors ${
                        !isUpdating
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isUpdating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Setting up...
                        </div>
                      ) : (
                        "Set as Student"
                      )}
                    </button>
                  </div>
                )}

                {/* Admin Tutor Management */}
                {displayUser?.role === 'admin' && (
                  <div className="border-t border-border pt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Tutor Management</h4>
                    
                    {/* Add Tutor Section */}
                    <div className="bg-muted/20 rounded-lg p-4 mb-6">
                      <h5 className="font-medium text-foreground mb-3">Add New Tutor</h5>
                      <div className="flex space-x-3">
                        <input
                          type="email"
                          placeholder="Enter user's email address"
                          value={newTutorEmail}
                          onChange={(e) => setNewTutorEmail(e.target.value)}
                          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          onClick={handleAddTutor}
                          disabled={isAddingTutor || !newTutorEmail.trim()}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAddingTutor ? "Adding..." : "Add Tutor"}
                        </button>
                      </div>
                    </div>

                    {/* Current Tutors List */}
                    <div>
                      <h5 className="font-medium text-foreground mb-3">Current Tutors ({tutors.length})</h5>
                      
                      {isLoadingTutors ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading tutors...</p>
                        </div>
                      ) : tutors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No tutors found. Add tutors using the form above.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tutors.map((tutor) => (
                            <div key={tutor.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {tutor.displayName ? tutor.displayName.charAt(0).toUpperCase() : tutor.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {tutor.displayName || tutor.email}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{tutor.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveTutor(tutor.id, tutor.displayName || tutor.email)}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">App Preferences</h3>
              <div className="space-y-6">
                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Theme
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred color scheme
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Notifications
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Manage email and push notifications
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Language
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred language
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "account":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">Account Security</h3>
              <div className="space-y-6">
                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Password
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Two-Factor Authentication
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Account Recovery
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Set up recovery options for your account
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopBar title="Settings" showNavLinks={false} />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and application settings</p>
          </div>

          {/* Horizontal Tab Navigation */}
          <div className="bg-card border border-border rounded-xl mb-8 overflow-hidden shadow-sm">
            <nav className="flex">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-5 px-6 font-semibold text-sm transition-all duration-200 relative group ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  } ${index > 0 ? 'border-l border-border/50' : ''}`}
                >
                  <span className="block text-center tracking-wide">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/20"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
