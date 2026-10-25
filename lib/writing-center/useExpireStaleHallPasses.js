"use client";

import { useRef } from "react";
import { useRunEffect } from "@/hooks/useRunEffect";
import { expireWritingCenterPass, isHallPassPastAutoClose, isOpenHallPass } from "@/lib/writing-center/hallPass";
import { HALL_PASS_AUTO_CLOSE_MS, hallPassOpenSince } from "@/lib/writing-center/hallPassTiming";

/** Close forgotten in-person passes once they have been open for an hour. */
export function useExpireStaleHallPasses(sessions, onExpired) {
  const onExpiredRef = useRef(onExpired);

  useRunEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useRunEffect(() => {
    if (!sessions?.length) return undefined;
    let timer = 0;

    const run = () => {
      const now = Date.now();
      let nextWait = null;
      for (const session of sessions) {
        if (!isOpenHallPass(session)) continue;
        const since = hallPassOpenSince(session);
        if (!since) continue;
        if (isHallPassPastAutoClose(session, new Date(now))) {
          expireWritingCenterPass(session)
            .then((didExpire) => {
              if (didExpire) onExpiredRef.current?.(session);
            })
            .catch(() => {});
          continue;
        }
        const wait = since.getTime() + HALL_PASS_AUTO_CLOSE_MS - now;
        if (wait > 0 && (nextWait == null || wait < nextWait)) nextWait = wait;
      }
      if (nextWait != null) {
        timer = window.setTimeout(run, nextWait + 1000);
      }
    };

    run();
    return () => window.clearTimeout(timer);
  }, [sessions]);
}