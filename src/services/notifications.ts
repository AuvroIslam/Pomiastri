import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { updatePushToken } from './users';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Token registration ───────────────────────────────────────────────────────

export async function registerForPushNotifications(uid: string): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // projectId is required on SDK 49+ — pulled from app config or env
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

  let token: string | null = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenData.data;
  } catch (e) {
    console.warn('[notifications] getExpoPushTokenAsync failed:', e);
    return null;
  }

  if (token) {
    await updatePushToken(uid, token).catch(() => {});
  }

  return token;
}

// ─── Local notification (in-app heads-up) ─────────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

// ─── Remote push via Vercel server ────────────────────────────────────────────

type NotifyEvent =
  | 'session_invite'
  | 'friend_request'
  | 'partner_joined'
  | 'partner_retired';

const SERVER_URL = process.env.EXPO_PUBLIC_NOTIFY_URL;
const API_KEY    = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

/**
 * Best-effort push to a user via the Vercel notification server.
 * Silently does nothing if the server URL is not configured.
 */
export async function sendPush(
  toUid: string,
  event: NotifyEvent,
  fromDisplayName: string,
  data?: Record<string, string>
): Promise<void> {
  if (!SERVER_URL || !API_KEY) return; // not configured yet — dev mode

  try {
    await fetch(`${SERVER_URL}/api/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ event, toUid, fromDisplayName, data }),
    });
  } catch {
    // Network error — push is best-effort, never crash the app
  }
}
