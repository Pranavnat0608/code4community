import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase";
import { normalizeEmail } from "@/lib/email";
import { accountName } from "@/lib/unicef/accountName";
import { normalizeUnicefSettings } from "@/lib/unicef/hours";

export const UNICEF_PROFILES = "unicefProfiles";
export const UNICEF_SUBMISSIONS = "unicefSubmissions";
export const UNICEF_SETTINGS = "unicefSettings";
export const UNICEF_OPPORTUNITIES = "unicefOpportunities";
export const UNICEF_ANNOUNCEMENTS = "unicefAnnouncements";
export const UNICEF_PROOFS = "unicefProofs";

const SETTINGS_ID = "config";

function db() {
  if (!firestore) throw new Error("Firebase is not configured.");
  return firestore;
}

/** @param {unknown} raw @param {string} id */
export function normalizeUnicefProfile(raw, id) {
  const data = raw && typeof raw === "object" ? raw : {};
  const role = data.role === "board" || data.role === "sponsor" ? data.role : "member";
  return {
    id,
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    email: normalizeEmail(data.email) || "",
    grade: typeof data.grade === "string" ? data.grade : "Freshman",
    phone: typeof data.phone === "string" ? data.phone : "",
    role,
    duesPaid: data.duesPaid === true,
  };
}

export async function fetchUnicefSettings() {
  const snap = await getDoc(doc(db(), UNICEF_SETTINGS, SETTINGS_ID));
  return normalizeUnicefSettings(snap.exists() ? snap.data() : null);
}

export async function saveUnicefSettings(settings, uid) {
  await setDoc(
    doc(db(), UNICEF_SETTINGS, SETTINGS_ID),
    { ...normalizeUnicefSettings(settings), updatedAt: serverTimestamp(), updatedBy: uid },
    { merge: true },
  );
}

/** @param {string} uid */
export async function fetchUnicefProfile(uid) {
  const snap = await getDoc(doc(db(), UNICEF_PROFILES, uid));
  if (!snap.exists()) return null;
  return normalizeUnicefProfile(snap.data(), snap.id);
}

/**
 * @param {string} uid
 * @param {{ email?: string, displayName?: string }} user
 * @param {{ displayName?: string, firstName?: string, lastName?: string, email?: string } | null} [userData]
 */
export async function ensureUnicefProfile(uid, user, userData = null) {
  const name = accountName(user, userData);
  const email = normalizeEmail(user.email) || "";
  const existing = await fetchUnicefProfile(uid);
  if (existing) {
    if (existing.firstName !== name.firstName || existing.lastName !== name.lastName || existing.email !== email) {
      await updateDoc(doc(db(), UNICEF_PROFILES, uid), {
        firstName: name.firstName,
        lastName: name.lastName,
        email,
        updatedAt: serverTimestamp(),
      });
      return { ...existing, firstName: name.firstName, lastName: name.lastName, email };
    }
    return existing;
  }
  const payload = {
    firstName: name.firstName,
    lastName: name.lastName,
    email,
    grade: "Freshman",
    phone: "",
    role: "member",
    duesPaid: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db(), UNICEF_PROFILES, uid), payload);
  return normalizeUnicefProfile(payload, uid);
}

/** @param {string} uid @param {Record<string, unknown>} patch */
export async function updateUnicefProfile(uid, patch) {
  await updateDoc(doc(db(), UNICEF_PROFILES, uid), { ...patch, updatedAt: serverTimestamp() });
}

export async function fetchUnicefProfiles() {
  const snap = await getDocs(collection(db(), UNICEF_PROFILES));
  return snap.docs
    .map((d) => normalizeUnicefProfile(d.data(), d.id))
    .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
}

/** @param {string} uid */
export async function fetchMyUnicefSubmissions(uid) {
  const snap = await getDocs(
    query(collection(db(), UNICEF_SUBMISSIONS), where("userId", "==", uid)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
}

export async function fetchAllUnicefSubmissions() {
  const snap = await getDocs(collection(db(), UNICEF_SUBMISSIONS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** @param {Record<string, unknown>} payload @param {string} imageData */
export async function createUnicefSubmission(payload, imageData) {
  const ref = doc(collection(db(), UNICEF_SUBMISSIONS));
  const batch = writeBatch(db());
  batch.set(ref, {
    ...payload,
    status: "pending",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db(), UNICEF_PROOFS, ref.id), {
    userId: payload.userId,
    imageData,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return ref.id;
}

/** @param {string} id */
export async function fetchUnicefProof(id) {
  const snap = await getDoc(doc(db(), UNICEF_PROOFS, id));
  return snap.exists() && typeof snap.data().imageData === "string" ? snap.data().imageData : "";
}

/**
 * @param {string} id
 * @param {"approved" | "declined"} status
 * @param {string} reviewerUid
 */
export async function reviewUnicefSubmission(id, status, reviewerUid) {
  await updateDoc(doc(db(), UNICEF_SUBMISSIONS, id), {
    status,
    reviewedByUid: reviewerUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchUnicefOpportunities() {
  const snap = await getDocs(collection(db(), UNICEF_OPPORTUNITIES));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/** @param {Record<string, unknown>} payload */
export async function addUnicefOpportunity(payload) {
  await addDoc(collection(db(), UNICEF_OPPORTUNITIES), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/** @param {string} id */
export async function deleteUnicefOpportunity(id) {
  await deleteDoc(doc(db(), UNICEF_OPPORTUNITIES, id));
}

export async function fetchUnicefAnnouncements() {
  const snap = await getDocs(collection(db(), UNICEF_ANNOUNCEMENTS));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/** @param {{ title: string, body: string, authorUid: string }} payload */
export async function addUnicefAnnouncement(payload) {
  await addDoc(collection(db(), UNICEF_ANNOUNCEMENTS), {
    title: payload.title.slice(0, 120),
    body: payload.body.slice(0, 4000),
    authorUid: payload.authorUid,
    createdAt: serverTimestamp(),
  });
}

/** @param {File} file */
export async function compressProofImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Proof must be an image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10 MB.");
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  if (dataUrl.length > 700_000) throw new Error("Image is still too large after compressing. Try a smaller photo.");
  return dataUrl;
}
