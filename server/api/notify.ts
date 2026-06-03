import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// ─── Firebase Admin (init once per cold start) ───────────────────────────────

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifyEvent =
  | 'session_invite'
  | 'friend_request'
  | 'partner_joined'
  | 'partner_retired';

interface NotifyBody {
  event: NotifyEvent;
  toUid: string;
  fromDisplayName: string;
  /** Extra payload for the client (e.g. sessionId to deep-link on tap) */
  data?: Record<string, string>;
}

const MESSAGES: Record<NotifyEvent, (from: string) => { title: string; body: string }> = {
  session_invite:   (from) => ({ title: '🏁 Race Invite', body: `${from} invited you to a Grand Prix — jump in!` }),
  friend_request:   (from) => ({ title: '🤝 Friend Request', body: `${from} wants to join your team.` }),
  partner_joined:   (from) => ({ title: '👥 Co-driver On Board', body: `${from} joined your session. Start the race!` }),
  partner_retired:  (from) => ({ title: '🚩 Partner Retired', body: `${from} left the race — you can keep going.` }),
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validate secret so only your own app can call this endpoint
  const secret = req.headers['x-api-key'];
  if (!secret || secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, toUid, fromDisplayName, data } = req.body as NotifyBody;

  if (!event || !toUid || !fromDisplayName) {
    return res.status(400).json({ error: 'Missing required fields: event, toUid, fromDisplayName' });
  }

  try {
    // Look up recipient's push token from Firestore
    const userDoc = await db.doc(`users/${toUid}`).get();
    const token: string | undefined = userDoc.data()?.expoPushToken;

    if (!token) {
      // User hasn't granted notification permission — not an error
      return res.status(200).json({ ok: true, delivered: false, reason: 'no_token' });
    }

    const { title, body } = MESSAGES[event](fromDisplayName);

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });

    const result = await response.json() as { data?: { status: string; message?: string } };

    // Expo returns { data: { status: 'error', message: 'DeviceNotRegistered' } } for stale tokens
    if (result.data?.status === 'error') {
      if (result.data.message === 'DeviceNotRegistered') {
        // Token is stale — clean it up so we don't try again
        await db.doc(`users/${toUid}`).update({ expoPushToken: admin.firestore.FieldValue.delete() });
      }
      return res.status(200).json({ ok: false, reason: result.data.message });
    }

    return res.status(200).json({ ok: true, delivered: true });
  } catch (err) {
    console.error('[notify] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
