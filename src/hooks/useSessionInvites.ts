import { useEffect, useState } from 'react';
import { SessionInvite } from '@/types';
import { subscribeToSessionInvites } from '@/services/sessions';

export function useSessionInvites(uid: string | undefined) {
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSessionInvites(uid, (data) => {
      setInvites(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { invites, loading };
}
