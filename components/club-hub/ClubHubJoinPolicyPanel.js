"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runEffectWork } from "@/hooks/runEffectWork";
import { fetchClubPageInfo, saveClubPageInfo } from "@/lib/club-hub/clubPages";
import { clubHubButtonFocusClass } from "@/lib/club-hub/a11y";
import {
  JOIN_POLICY_APPROVAL,
  JOIN_POLICY_OPEN,
  clubRequiresJoinApproval,
} from "@/lib/club-hub/joinPolicy";
import {
  fetchPendingJoinRequestsForClub,
  reviewJoinRequestClient,
} from "@/lib/club-hub/joinRequests";
import {
  MEMBER_SIGNUP_LIMIT_MAX,
  normalizeMemberSignupLimit,
} from "@/lib/club-hub/memberSignupLimit";

/**
 * @param {{
 *   clubSlug: string,
 *   clubName: string,
 *   memberCount: number,
 *   user: { uid: string, getIdToken?: () => Promise<string> } | null,
 *   onMessage?: (text: string) => void,
 *   onError?: (text: string) => void,
 *   onSaved?: () => void | Promise<void>,
 * }} props
 */
export default function ClubHubJoinPolicyPanel({
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
  const [busyUserId, setBusyUserId] = useState("");
  const [policy, setPolicy] = useState(JOIN_POLICY_OPEN);
  const [limitInput, setLimitInput] = useState("");
  const [pageInfo, setPageInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const onErrorRef = useRef(onError);
  const userRef = useRef(user);
  useEffect(() => {
    return runEffectWork(() => {
      onErrorRef.current = onError;
      userRef.current = user;
    });
  }, [onError, user]);

  const loadRequests = useCallback(async () => {
    const rows = await fetchPendingJoinRequestsForClub(userRef.current, clubSlug);
    setRequests(rows);
  }, [clubSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [info, rows] = await Promise.all([
          fetchClubPageInfo(clubSlug),
          fetchPendingJoinRequestsForClub(userRef.current, clubSlug),
        ]);
        if (cancelled) return;
        setPageInfo(info);
        setPolicy(info.joinPolicy);
        setLimitInput(info.memberSignupLimit != null ? String(info.memberSignupLimit) : "");
        setRequests(rows);
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(err.message || "Could not load membership settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid || saving || !pageInfo) return;
    onMessage?.("");
    onError?.("");

    const trimmed = limitInput.trim();
    /** @type {number | null} */
    let limit = null;
    if (trimmed) {
      limit = normalizeMemberSignupLimit(trimmed);
      if (limit == null) {
        onError?.(
          `Enter a whole number from 1 to ${MEMBER_SIGNUP_LIMIT_MAX}, or leave blank for no limit.`,
        );
        return;
      }
      if (limit < memberCount) {
        onError?.(
          `Limit cannot be below the current signup count (${memberCount}). Remove members first or set a higher limit.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      await saveClubPageInfo({
        slug: clubSlug,
        info: { ...pageInfo, joinPolicy: policy, memberSignupLimit: limit },
        adminUid: user.uid,
      });
      setPageInfo((prev) =>
        prev ? { ...prev, joinPolicy: policy, memberSignupLimit: limit } : prev,
      );
      const joinText =
        policy === JOIN_POLICY_APPROVAL
          ? "New members need approval."
          : "Students can join immediately.";
      const limitText =
        limit != null ? ` Signup limit is ${limit}.` : " There is no signup limit.";
      onMessage?.(`${joinText}${limitText}`);
      await onSaved?.();
    } catch (err) {
      onError?.(err.message || "Could not save membership settings.");
    } finally {
      setSaving(false);
    }
  };

  const review = async (userId, action) => {
    if (!user?.getIdToken || busyUserId) return;
    onMessage?.("");
    onError?.("");
    setBusyUserId(userId);
    try {
      await reviewJoinRequestClient(user, { clubSlug, userId, action });
      await loadRequests();
      onMessage?.(action === "approve" ? "Member approved." : "Request denied.");
      if (action === "approve") await onSaved?.();
    } catch (err) {
      onError?.(err.message || "Could not update the request.");
    } finally {
      setBusyUserId("");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-700">Loading membership settings…</p>;
  }

  const approval = clubRequiresJoinApproval(policy);
  const activeLimit = pageInfo?.memberSignupLimit ?? null;

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={handleSave}>
        <p className="text-sm leading-relaxed text-neutral-700">
          Choose how students join <span className="font-semibold">{clubName}</span> and whether
          there is a cap. Sponsors and board members can approve requests. Current signups:{" "}
          {memberCount}.
        </p>
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            How students join
          </legend>
          <label className="flex items-start gap-2 text-sm text-neutral-900">
            <input
              type="radio"
              name="join-policy"
              checked={policy === JOIN_POLICY_OPEN}
              onChange={() => setPolicy(JOIN_POLICY_OPEN)}
              className="mt-1"
            />
            <span>
              <span className="font-semibold">Open join</span>
              <span className="mt-0.5 block text-xs font-normal text-neutral-600">
                Students join immediately
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-900">
            <input
              type="radio"
              name="join-policy"
              checked={policy === JOIN_POLICY_APPROVAL}
              onChange={() => setPolicy(JOIN_POLICY_APPROVAL)}
              className="mt-1"
            />
            <span>
              <span className="font-semibold">Approval required</span>
              <span className="mt-0.5 block text-xs font-normal text-neutral-600">
                A sponsor or board member must approve each student
              </span>
            </span>
          </label>
        </fieldset>
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
          ) : (
            <p className="mt-2 text-xs text-neutral-600">Leave blank for no limit.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !user?.uid}
          className={`rounded-lg bg-[#5c1417] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 ${clubHubButtonFocusClass}`}
        >
          {saving ? "Saving…" : "Save membership settings"}
        </button>
      </form>

      {approval || requests.length > 0 ? (
        <section aria-labelledby="join-requests-heading">
          <h3 id="join-requests-heading" className="text-sm font-bold text-neutral-900">
            Pending requests
          </h3>
          {requests.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-700">No students are waiting for approval.</p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-100">
              {requests.map((row) => {
                const busy = busyUserId === row.userId;
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {row.displayName || "Student"}
                      </p>
                      <p className="truncate text-xs text-neutral-600">{row.userEmail || "—"}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={Boolean(busyUserId)}
                        onClick={() => review(row.userId, "approve")}
                        className={`rounded-md px-2 py-1 text-xs font-semibold text-[#5c1417] hover:bg-rose-50 disabled:opacity-50 ${clubHubButtonFocusClass}`}
                      >
                        {busy ? "Saving…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busyUserId)}
                        onClick={() => review(row.userId, "deny")}
                        className={`rounded-md px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 ${clubHubButtonFocusClass}`}
                      >
                        Deny
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
