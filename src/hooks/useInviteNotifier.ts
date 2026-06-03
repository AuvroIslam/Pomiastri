import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useSessionInvites } from './useSessionInvites';
import { sendLocalNotification } from '@/services/notifications';

/**
 * Watches the current user's incoming session invites in real time and fires
 * a heads-up local notification + haptic the moment a NEW one arrives — so a
 * friend's race invite is felt instantly while the app is open (PUBG-style).
 *
 * NOTE: This covers the foregrounded case. To notify a user whose app is fully
 * closed/backgrounded, you need a Cloud Function that calls the Expo Push API
 * using the recipient's stored `expoPushToken` (see src/services/notifications.ts).
 */
export function useInviteNotifier(uid: string | undefined) {
  const { invites } = useSessionInvites(uid);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!uid) return;

    // First snapshot: record what already exists without notifying.
    if (!initialized.current) {
      invites.forEach((i) => seenIds.current.add(i.id));
      initialized.current = true;
      return;
    }

    const fresh = invites.filter((i) => !seenIds.current.has(i.id));
    fresh.forEach((invite) => {
      seenIds.current.add(invite.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      sendLocalNotification(
        'Race Invite',
        `${invite.fromDisplayName} invited you to a Grand Prix — jump in!`
      ).catch(() => {});
    });
  }, [invites, uid]);
}
