import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Fires `onSwitch` the moment the app goes to the background while `active` is
 * true — no grace period. Each background episode counts once: the iOS
 * `active → inactive → background` sequence won't double-fire, and we don't
 * re-fire until the app has come back to the foreground.
 */
export function useAppSwitchPenalty(active: boolean, onSwitch: () => void) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const firedRef = useRef(false);
  const onSwitchRef = useRef(onSwitch);
  onSwitchRef.current = onSwitch;

  useEffect(() => {
    if (!active) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      console.log('[AppSwitch] state change:', prev, '->', nextState, '| active:', active, '| firedRef:', firedRef.current);

      if (nextState === 'background' && !firedRef.current) {
        firedRef.current = true;
        console.log('[AppSwitch] >>> FIRING onSwitch (going to background while active)');
        onSwitchRef.current();
      } else if (nextState === 'active') {
        // Back in the foreground — arm the next strike.
        firedRef.current = false;
        console.log('[AppSwitch] back to foreground — strike armed again');
      } else {
        console.log('[AppSwitch] no-op (inactive/other or already fired)');
      }
    });

    return () => subscription.remove();
  }, [active]);
}
