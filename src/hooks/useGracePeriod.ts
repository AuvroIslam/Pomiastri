import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const GRACE_SECONDS = 10;

/**
 * Calls onGraceExpired only if the app stays in background for GRACE_SECONDS.
 * If the user returns before the grace period, the timer is cancelled.
 */
export function useGracePeriod(
  active: boolean,
  onGraceExpired: () => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!active) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prev === 'active' || prev === 'inactive') &&
        nextState === 'background'
      ) {
        // Start grace countdown
        timerRef.current = setTimeout(() => {
          onGraceExpired();
        }, GRACE_SECONDS * 1000);
      }

      if (nextState === 'active') {
        // User returned — cancel penalty
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    });

    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onGraceExpired]);
}
