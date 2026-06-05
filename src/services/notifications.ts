import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { updatePushToken } from './users';

// expo-notifications throws warnOfExpoGoPushUsage when loaded inside Expo Go.
// Guard everything so it only runs in a real dev/production build.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Token registration ───────────────────────────────────────────────────────

export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (isExpoGo) return null; // not supported in Expo Go

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

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

// ─── Local notification ───────────────────────────────────────────────────────

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  if (isExpoGo) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

// ─── Remote push via Vercel server ────────────────────────────────────────────

type NotifyEvent = 'session_invite' | 'friend_request' | 'partner_joined' | 'partner_retired';

const SERVER_URL = process.env.EXPO_PUBLIC_NOTIFY_URL;
const API_KEY    = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

export async function sendPush(
  toUid: string,
  event: NotifyEvent,
  fromDisplayName: string,
  data?: Record<string, string>
): Promise<void> {
  if (!SERVER_URL || !API_KEY) return;
  try {
    await fetch(`${SERVER_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ event, toUid, fromDisplayName, data }),
    });
  } catch {
    // best-effort
  }
}
