import {
  getAllClubSlugs,
  getClubBySlug,
} from "@/lib/club-hub/broadRunClubDirectory";
import { normalizeCustomClub } from "@/lib/club-hub/customClubStore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import ClubDetailView from "@/components/club-hub/ClubDetailView";
import CustomClubDetailGate from "@/components/club-hub/CustomClubDetailGate";

export const dynamicParams = true;

/** @param {string} slug */
async function fetchCustomClub(slug) {
  const db = getAdminFirestore();
  if (!db) return null;
  const snap = await db.collection("clubHubCustomClubs").doc(slug).get();
  if (!snap.exists) return null;
  return normalizeCustomClub({ ...snap.data(), slug: snap.id }, snap.id);
}

export function generateStaticParams() {
  return getAllClubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const club = getClubBySlug(slug) || (await fetchCustomClub(slug));
  if (!club) return { title: "Club | Broad Run Club Hub" };
  return {
    title: `${club.name} | Broad Run Club Hub`,
    description: `Learn more about ${club.name} at Broad Run High School.`,
  };
}

export default async function ClubDetailPage({ params }) {
  const { slug } = await params;
  const club = getClubBySlug(slug) || (await fetchCustomClub(slug));
  if (club) return <ClubDetailView club={club} slug={slug} />;
  return <CustomClubDetailGate slug={slug} />;
}
