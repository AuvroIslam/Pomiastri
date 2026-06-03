import { useState, useEffect, useRef } from 'react';
import { Session } from '@/types';
import { subscribeToSession } from '@/services/sessions';

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(true); // avoids stale closure inside onSnapshot callback

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    loadingRef.current = true;
    setLoading(true);

    const unsubscribe = subscribeToSession(sessionId, (data) => {
      if (data === null && loadingRef.current) {
        setError('Session not found');
      }
      loadingRef.current = false;
      setSession(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId]);

  return { session, loading, error };
}
