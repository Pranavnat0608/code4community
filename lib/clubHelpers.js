/**
 * Helper functions for club operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { firestore } from "@/firebase";
import { normalizeEmail } from "@/lib/email";
import { BROAD_RUN_CLUBS } from "@/lib/club-hub/broadRunClubDirectory";

const CLUB_MEMBERSHIPS_COLLECTION = "clubMemberships";
const CLUB_ADMINS_COLLECTION = "clubAdmins";
const CLUB_ANNOUNCEMENTS_COLLECTION = "clubAnnouncements";
const CLUB_ATTENDANCE_COLLECTION = "clubAttendance";

/**
 * Get all club memberships for a user
 */
export async function getUserClubMemberships(userId) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_MEMBERSHIPS_COLLECTION),
      where("studentId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user club memberships:", error);
    return [];
  }
}

/**
 * Get club data by name
 */
export function getClubByName(clubName) {
  return BROAD_RUN_CLUBS.find(club => club.name === clubName) || null;
}

/**
 * Check if user is a member of a specific club
 */
export async function isUserClubMember(userId, clubName) {
  if (!firestore) return false;
  
  try {
    const q = query(
      collection(firestore, CLUB_MEMBERSHIPS_COLLECTION),
      where("studentId", "==", userId),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      // Check if membership is active (not cancelled)
      return !data.cancelledAt;
    }
    return false;
  } catch (error) {
    console.error("Error checking club membership:", error);
    return false;
  }
}

/**
 * Sign up user for a club
 */
export async function joinClub(userId, userName, clubName) {
  if (!firestore) throw new Error("Firestore not available");
  
  try {
    // Check if user is already a member
    const q = query(
      collection(firestore, CLUB_MEMBERSHIPS_COLLECTION),
      where("studentId", "==", userId),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      if (data.cancelledAt) {
        // Reactivate cancelled membership
        await updateDoc(doc.ref, {
          cancelledAt: null,
          updatedAt: serverTimestamp()
        });
        return { success: true, message: "Membership reactivated" };
      }
      return { success: false, message: "Already a member" };
    }
    
    // Create new membership
    await addDoc(collection(firestore, CLUB_MEMBERSHIPS_COLLECTION), {
      studentId: userId,
      studentName: userName,
      clubName: clubName,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, message: "Successfully joined club" };
  } catch (error) {
    console.error("Error joining club:", error);
    throw error;
  }
}

/**
 * Cancel user's club membership
 */
export async function leaveClub(userId, clubName) {
  if (!firestore) throw new Error("Firestore not available");
  
  try {
    const q = query(
      collection(firestore, CLUB_MEMBERSHIPS_COLLECTION),
      where("studentId", "==", userId),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: "Not a member of this club" };
    }
    
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, message: "Membership cancelled" };
  } catch (error) {
    console.error("Error leaving club:", error);
    throw error;
  }
}

/**
 * Get all members of a specific club
 */
export async function getClubMembers(clubName) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_MEMBERSHIPS_COLLECTION),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(membership => !membership.cancelledAt);
  } catch (error) {
    console.error("Error getting club members:", error);
    return [];
  }
}

/**
 * Check if user is admin of a specific club
 */
export async function isClubAdmin(userId, clubName) {
  if (!firestore) return false;
  
  try {
    const adminId = `${userId}_${normalizeEmail(clubName)}`;
    const docRef = doc(firestore, CLUB_ADMINS_COLLECTION, adminId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking club admin status:", error);
    return false;
  }
}

/**
 * Get all clubs where user is admin
 */
export async function getUserAdminClubs(userId) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_ADMINS_COLLECTION),
      where("adminId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting user admin clubs:", error);
    return [];
  }
}

/**
 * Create club announcement
 */
export async function createClubAnnouncement(clubName, content, senderName, senderId) {
  if (!firestore) throw new Error("Firestore not available");
  
  try {
    const docRef = await addDoc(collection(firestore, CLUB_ANNOUNCEMENTS_COLLECTION), {
      clubName: clubName,
      content: content,
      senderName: senderName,
      senderId: senderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating club announcement:", error);
    throw error;
  }
}

/**
 * Get announcements for a specific club
 */
export async function getClubAnnouncements(clubName) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_ANNOUNCEMENTS_COLLECTION),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
  } catch (error) {
    console.error("Error getting club announcements:", error);
    return [];
  }
}

/**
 * Create attendance record
 */
export async function createAttendanceRecord(clubName, meetingDate, studentId, studentName, status, recordedBy) {
  if (!firestore) throw new Error("Firestore not available");
  
  try {
    const attendanceId = `${normalizeEmail(clubName)}_${meetingDate}_${studentId}`;
    const docRef = doc(firestore, CLUB_ATTENDANCE_COLLECTION, attendanceId);
    
    await addDoc(collection(firestore, CLUB_ATTENDANCE_COLLECTION), {
      clubName: clubName,
      meetingDate: meetingDate,
      studentId: studentId,
      studentName: studentName,
      status: status,
      recordedBy: recordedBy,
      recordedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: attendanceId };
  } catch (error) {
    console.error("Error creating attendance record:", error);
    throw error;
  }
}

/**
 * Update attendance record
 */
export async function updateAttendanceRecord(attendanceId, status) {
  if (!firestore) throw new Error("Firestore not available");
  
  try {
    const docRef = doc(firestore, CLUB_ATTENDANCE_COLLECTION, attendanceId);
    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating attendance record:", error);
    throw error;
  }
}

/**
 * Get attendance records for a club and meeting date
 */
export async function getClubAttendance(clubName, meetingDate) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_ATTENDANCE_COLLECTION),
      where("clubName", "==", clubName),
      where("meetingDate", "==", meetingDate)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting club attendance:", error);
    return [];
  }
}

/**
 * Get all meeting dates for a club
 */
export async function getClubMeetingDates(clubName) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_ATTENDANCE_COLLECTION),
      where("clubName", "==", clubName)
    );
    const querySnapshot = await getDocs(q);
    
    const dates = new Set();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.meetingDate) {
        dates.add(data.meetingDate);
      }
    });
    
    return Array.from(dates).sort().reverse();
  } catch (error) {
    console.error("Error getting club meeting dates:", error);
    return [];
  }
}

/**
 * Get attendance history for a student in a club
 */
export async function getStudentAttendanceHistory(clubName, studentId) {
  if (!firestore) return [];
  
  try {
    const q = query(
      collection(firestore, CLUB_ATTENDANCE_COLLECTION),
      where("clubName", "==", clubName),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.recordedAt?.toMillis() - a.recordedAt?.toMillis());
  } catch (error) {
    console.error("Error getting student attendance history:", error);
    return [];
  }
}