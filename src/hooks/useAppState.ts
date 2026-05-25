import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Detects when the app goes to background.
 * This is the best focus-break detection available in managed Expo.
 *
 * LIMITATION: In Expo managed workflow we cannot prevent the user from
 * leaving the app. We can only detect it happened and mark the session
 * as broken in Firestore.
 */
export function useAppState(onBackground: () => void) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prev === 'active' || prev === 'inactive') &&
        nextState === 'background'
      ) {
        onBackground();
      }
    });

    return () => subscription.remove();
  }, [onBackground]);
}
