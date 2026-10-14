"use client";

import { useEffect, useState } from "react";
import { fetchClubPageInfo, saveClubPageInfo } from "@/lib/club-hub/clubPages";
import { clubHubButtonFocusClass } from "@/lib/club-hub/a11y";
import {
  MEMBER_SIGNUP_LIMIT_MAX,
  normalizeMemberSignupLimit,
} from "@/lib/club-hub/memberSignupLimit";

/**
 * @param {{
 *   clubSlug: string,
 *   clubName: string,
 *   memberCount: number,
 *   user: { uid: string } | null,
 *   onMessage?: (text: string) => void,
 *   onError?: (text: string) => void,
 *   onSaved?: () => void | Promise<void>,
 * }} props
 */
export default function ClubHubMemberSignupLimitPanel({
  clubSlug,
  clubName,
  memberCount,
  user,
  onMessage,
  onError,
  onSaved,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** @type {[string, import("react").Dispatch<import("react").SetStateAction<string>>]} */
  const [limitInput, setLimitInput] = useState("");
  /** @type {import("@/lib/club-hub/clubPages").ReturnType<typeof fetchClubPageInfo> extends Promise<infer T> ? T : never} */
  const [pageInfo, setPageInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const info = await fetchClubPageInfo(clubSlug);
        if (cancelled) return;
        setPageInfo(info);
        setLimitInput(
          info.memberSignupLimit != null ? String(info.memberSignupLimit) : "",
        );
      } catch (err) {
        if (!cancelled) {
          onError?.(err.message || "Could not load club settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubSlug, onError]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid || saving || !pageInfo) return;
    onMessage?.("");
    onError?.("");

    const trimmed = limitInput.trim();
    if (trimmed) {
      const parsed = normalizeMemberSignupLimit(trimmed);
      if (parsed == null) {
        onError?.(`Enter a whole number from 1 to ${MEMBER_SIGNUP_LIMIT_MAX}, or leave blank for no limit.`);
        return;
      }
      if (parsed < memberCount) {
        onError?.(
          `Limit cannot be below the current signup count (${memberCount}). Remove members first or set a higher limit.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const limit = trimmed ? normalizeMemberSignupLimit(trimmed) : null;
      await saveClubPageInfo({
        slug: clubSlug,
        info: { ...pageInfo, memberSignupLimit: limit },
        adminUid: user.uid,
      });
      setPageInfo((prev) => (prev ? { ...prev, memberSignupLimit: limit } : prev));
      onMessage?.(
        limit != null
          ? `Signup limit set to ${limit} member${limit === 1 ? "" : "s"}.`
          : "Signup limit removed — unlimited members can join.",
      );
      await onSaved?.();
    } catch (err) {
      onError?.(err.message || "Could not save signup limit.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-700">Loading settings…</p>;
  }

  const activeLimit = pageInfo?.memberSignupLimit ?? null;

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <p className="text-sm leading-relaxed text-neutral-700">
        Limit how many students can join <span className="font-semibold">{clubName}</span> through
        the site. Leave blank for no limit. The count uses current signups ({memberCount}).
      </p>
      <div>
        <label
          htmlFor="member-signup-limit"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700"
        >
          Maximum members (optional)
        </label>
        <input
          id="member-signup-limit"
          type="number"
          min={1}
          max={MEMBER_SIGNUP_LIMIT_MAX}
          inputMode="numeric"
          placeholder="No limit"
          value={limitInput}
          onChange={(e) => setLimitInput(e.target.value)}
          className="mt-1.5 w-full max-w-[12rem] rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-sm"
        />
        {activeLimit != null ? (
          <p className="mt-2 text-xs text-neutral-600">
            Active limit: {activeLimit} · {memberCount} joined
            {memberCount >= activeLimit ? " (full)" : ""}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={saving || !user?.uid}
        className={`rounded-lg bg-[#5c1417] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 ${clubHubButtonFocusClass}`}
      >
        {saving ? "Saving…" : "Save limit"}
      </button>
    </form>
  );
}
