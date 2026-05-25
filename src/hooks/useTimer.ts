import { useState, useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Session } from '@/types';

/**
 * Derives the live countdown from the Firestore session's timerState.
 *
 * Strategy:
 * - When running: timeRemaining = endsAt - now (server-anchored)
 * - When paused: timeRemaining = timerState.timeRemaining (stored value)
 *
 * This keeps both users in sync even if their local clocks differ slightly,
 * since the authoritative countdown is derived from endsAt (a server timestamp).
 */
export function useTimer(session: Session | null) {
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!session) return;

    const { timerState } = session;

    if (!timerState.isRunning || !timerState.endsAt) {
      setDisplaySeconds(Math.max(0, timerState.timeRemaining));
      return;
    }

    const tick = () => {
      const endsAt = timerState.endsAt as Timestamp;
      const nowMs = Date.now();
      const endsAtMs = endsAt.toMillis();
      const remaining = Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
      setDisplaySeconds(remaining);
    };

    tick(); // immediate tick to avoid 1s delay
    intervalRef.current = setInterval(tick, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    session?.timerState.isRunning,
    session?.timerState.endsAt,
    session?.timerState.timeRemaining,
    session?.timerState.phase,
  ]);

  return displaySeconds;
}
