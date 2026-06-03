import { useState, useEffect } from 'react';
import { registerForPushNotifications } from '@/services/notifications';

export function useNotifications(uid: string | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    registerForPushNotifications(uid).then((token) => {
      if (token) setExpoPushToken(token);
    });
  }, [uid]);

  return { expoPushToken };
}
