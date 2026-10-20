import { resolveDisplayName } from "@/lib/profile";

/**
 * Name from the Code4Community account. UNICEF does not store a separate name.
 * @param {{ displayName?: string | null, email?: string | null } | null | undefined} user
 * @param {{ displayName?: string, firstName?: string, lastName?: string, email?: string } | null | undefined} userData
 */
export function accountName(user, userData) {
  const displayName = resolveDisplayName(userData, user?.displayName || user?.email || "").trim();
  const parts = displayName.split(/\s+/).filter(Boolean);
  const emailLocal = (user?.email || "").split("@")[0];
  const looksLikeEmail = displayName.includes("@") || displayName === emailLocal;
  if (!displayName || looksLikeEmail) {
    return { displayName: "", firstName: "", lastName: "" };
  }
  return {
    displayName,
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}
