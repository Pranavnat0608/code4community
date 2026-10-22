import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { WC_LIVE_STATUSES } from "@/lib/writing-center/sessionQueries";

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

/** Student ends the pass after they have been marked out. */
export async function endWritingCenterPass(sessionId) {
  await updateDoc(doc(firestore, "sessions", sessionId), {
    hallPassEndedAt: serverTimestamp(),
    status: "COMPLETED",
    updatedAt: serverTimestamp(),
  });
}
