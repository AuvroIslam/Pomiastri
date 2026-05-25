import { useState, useEffect } from 'react';
import { Session } from '@/types';
import { subscribeToSession } from '@/services/sessions';

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSession(sessionId, (data) => {
      if (data === null && loading) {
        setError('Session not found');
      }
      setSession(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [sessionId]);

  return { session, loading, error };
}
