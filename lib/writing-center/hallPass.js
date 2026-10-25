import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { WC_LIVE_STATUSES } from "@/lib/writing-center/sessionQueries";
import {
  hallPassOpenSince,
  isPastHallPassAutoClose,
} from "@/lib/writing-center/hallPassTiming";
import { firestoreToDate } from "@/lib/firestoreDates";

const expiringPassIds = new Set();

/** In-person pass that is still running, including after they are marked in the room. */
export function isOpenHallPass(session) {
  if (!session || session.sessionType !== "IN_PERSON") return false;
  if (!WC_LIVE_STATUSES.includes(session.status)) return false;
  if (session.hallPassEndedAt) return false;
  return true;
}

/** Tutor or admin records arrival. The pass keeps running. */
export async function markWritingCenterPassIn(sessionId) {
  await updateDoc(doc(firestore, "sessions", sessionId), {
    hallPassInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Tutor or admin records that the student left the room. The pass keeps running. */
export async function markWritingCenterPassOut(sessionId) {
  await updateDoc(doc(firestore, "sessions", sessionId), {
    hallPassLeftAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Student ends the pass. It does not have to be marked in or out first. */
export async function endWritingCenterPass(sessionId) {
  await updateDoc(doc(firestore, "sessions", sessionId), {
    hallPassEndedAt: serverTimestamp(),
    status: "COMPLETED",
    updatedAt: serverTimestamp(),
  });
}

export function isHallPassPastAutoClose(session, now = new Date()) {
  if (!isOpenHallPass(session)) return false;
  return isPastHallPassAutoClose(hallPassOpenSince(session), now);
}

/**
 * Close a pass that has been open for an hour.
 * A started pass is completed. A pass that was never started is cancelled.
 */
export async function expireWritingCenterPass(session) {
  const sessionId = session?.id;
  if (!sessionId || !isHallPassPastAutoClose(session) || expiringPassIds.has(sessionId)) return false;
  expiringPassIds.add(sessionId);
  try {
    if (firestoreToDate(session.hallPassStartedAt)) {
      await endWritingCenterPass(sessionId);
    } else {
      await updateDoc(doc(firestore, "sessions", sessionId), {
        status: "CANCELLED",
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (err) {
    expiringPassIds.delete(sessionId);
    throw err;
  }
}
