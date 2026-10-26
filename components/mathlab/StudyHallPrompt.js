"use client";

import { useEffect, useRef, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import { useAuth } from "@/utils/AuthContext";
import { UserCache } from "@/utils/cache";
import { NO_STUDY_HALL, STUDY_HALL_OPTIONS } from "@/lib/mathlab/studyHall";

/**
 * One-time required question for Math Lab students and tutors (tutors are role=student
 * with mathLabRole=tutor). Saved as users/{uid}.reportedStudyHall; once set it never shows again.
 */
export default function StudyHallPrompt() {
  const { user, userData } = useAuth();
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedValue, setSavedValue] = useState(null);
  const firstOptionRef = useRef(null);

  const needsAnswer =
    Boolean(user && userData) &&
    (userData.role || "student").toLowerCase() === "student" &&
    !userData.reportedStudyHall &&
    !savedValue;

  useEffect(() => {
    if (needsAnswer) firstOptionRef.current?.focus();
  }, [needsAnswer]);

  if (!needsAnswer) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!choice || saving) return;
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        reportedStudyHall: choice,
        updatedAt: serverTimestamp(),
      });
      UserCache.setUserData({ ...userData, reportedStudyHall: choice });
      setSavedValue(choice);
      // Reload the profile in AuthContext so request matching sees the answer right away
      window.dispatchEvent(new CustomEvent("userRoleChanged", { detail: { userId: user.uid } }));
    } catch {
      setError("Couldn't save your study hall. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-hall-prompt-title"
        aria-describedby="study-hall-prompt-desc"
        onSubmit={handleSave}
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg"
      >
        <h2 id="study-hall-prompt-title" className="text-xl font-bold text-foreground">
          When is your study hall?
        </h2>
        <p id="study-hall-prompt-desc" className="mt-1 text-sm text-muted-foreground">
          Live Math Lab help pairs you with tutors who share your study hall. Without one, you can
          still book before- and after-school sessions. You only answer this once.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">Study hall block</legend>
          <div className="grid grid-cols-3 gap-2">
            {STUDY_HALL_OPTIONS.map((option, index) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-primary/40 ${
                  option.value === NO_STUDY_HALL ? "col-span-3" : ""
                } ${
                  choice === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/60"
                }`}
              >
                <input
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="radio"
                  name="study-hall"
                  value={option.value}
                  checked={choice === option.value}
                  onChange={(e) => setChoice(e.target.value)}
                  required
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!choice || saving}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
