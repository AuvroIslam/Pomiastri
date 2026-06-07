import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  addDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { Session, SessionInvite, SessionMode, SessionSettings, TimerState, PomodoroPhase } from '@/types';
import { DriverId, DEFAULT_DRIVER } from '@/constants/drivers';
import { DEFAULT_SESSION_SETTINGS } from '@/constants/pomodoro';
import { generateJoinCode } from '@/utils/code';
import { addPoints } from './users';
import { sendPush } from './notifications';

// ─── Points constants ─────────────────────────────────────────────────────────
// Duo (racing with a partner) — full rewards
export const POINTS_PER_PHASE = 10;          // per focus lap, duo
export const POINTS_FULL_COMPLETE = 50;      // both drivers finished together
export const POINTS_PARTNER_LEFT_BONUS = 25; // partner retired, you finished solo
// Solo practice — reduced rewards (no accountability partner)
export const POINTS_SOLO_PHASE = 5;          // per focus lap, solo
export const POINTS_SOLO_BONUS = 15;         // solo practice finished
// Shared
export const POINTS_LEAVE_PENALTY = -20;

export function phasePointsFor(mode: SessionMode): number {
  return mode === 'solo' ? POINTS_SOLO_PHASE : POINTS_PER_PHASE;
}

// ─── Create / Join ─────────────────────────────────────────────────────────────

export async function createSession(
  hostId: string,
  hostDisplayName: string,
  hostAvatarId: DriverId = DEFAULT_DRIVER,
  settings: SessionSettings = DEFAULT_SESSION_SETTINGS,
  mode: SessionMode = 'duo',
  // Duo races always have stakes; this only matters (and is only
  // surfaced in the UI) for solo practice sessions.
  stakesEnabled: boolean = true
): Promise<{ sessionId: string; joinCode: string }> {
  const joinCode = generateJoinCode();
  const sessionRef = doc(collection(db, 'sessions'));

  const timerState: TimerState = {
    phase: 'focus',
    timeRemaining: settings.focusDuration,
    isRunning: false,
    phaseCount: 0,
    endsAt: null,
    lastUpdatedAt: serverTimestamp() as any,
  };

  const session: Omit<Session, 'id'> = {
    mode,
    hostId,
    hostDisplayName,
    hostAvatarId,
    participantId: null,
    participantDisplayName: null,
    participantAvatarId: null,
    status: 'waiting',
    joinCode: joinCode.toUpperCase(),
    timerState,
    settings,
    stakesEnabled: mode === 'solo' ? stakesEnabled : true,
    leftParticipants: [],
    isBroken: false,
    hostFocusBroken: false,
    participantFocusBroken: false,
    hostPointsEarned: 0,
    participantPointsEarned: 0,
    createdAt: serverTimestamp() as any,
    startedAt: null,
    completedAt: null,
  };

  await setDoc(sessionRef, session);
  return { sessionId: sessionRef.id, joinCode: session.joinCode };
}

export async function joinSessionByCode(
  joinCode: string,
  participantId: string,
  participantDisplayName: string,
  participantAvatarId: DriverId = DEFAULT_DRIVER
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const q = query(
    collection(db, 'sessions'),
    where('joinCode', '==', joinCode.toUpperCase()),
    where('status', '==', 'waiting')
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { success: false, error: 'No waiting session found with that code.' };
  }

  const sessionDoc = snap.docs[0];
  const session = sessionDoc.data() as Session;

  if (session.mode === 'solo') {
    return { success: false, error: 'That is a solo practice session.' };
  }

  if (session.hostId === participantId) {
    return { success: false, error: 'You are the host of this session.' };
  }

  if (session.participantId !== null) {
    return { success: false, error: 'Session is full.' };
  }

  await updateDoc(sessionDoc.ref, {
    participantId,
    participantDisplayName,
    participantAvatarId,
  });

  // Notify the host that their partner joined
  sendPush(session.hostId, 'partner_joined', participantDisplayName, {
    sessionId: sessionDoc.id,
  });

  return { success: true, sessionId: sessionDoc.id };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
}

/**
 * Whether `uid` can still get back into this session: either they never left,
 * or they left (grace-period timeout / abandon-with-penalty) but the session
 * is still 'solo' and their partner hasn't also walked away. Once the partner
 * is gone too, or the race is over, there's nothing left to rejoin.
 */
export function isSessionRecoverableFor(session: Session, uid: string): boolean {
  const left = session.leftParticipants ?? [];
  if (!left.includes(uid)) return true;
  if (session.status !== 'solo') return false;
  const otherUid = session.hostId === uid ? session.participantId : session.hostId;
  return !!otherUid && !left.includes(otherUid);
}

export async function getActiveSessionForUser(uid: string): Promise<Session | null> {
  const activeStatuses = ['waiting', 'active', 'paused', 'solo'];

  // Check as host — skip sessions that are no longer recoverable for this user
  const hostQuery = query(
    collection(db, 'sessions'),
    where('hostId', '==', uid),
    where('status', 'in', activeStatuses)
  );
  const hostSnap = await getDocs(hostQuery);
  if (!hostSnap.empty) {
    const d = hostSnap.docs[0];
    const session = { id: d.id, ...d.data() } as Session;
    if (isSessionRecoverableFor(session, uid)) {
      return session;
    }
  }

  // Check as participant — same recoverability rule
  const partQuery = query(
    collection(db, 'sessions'),
    where('participantId', '==', uid),
    where('status', 'in', activeStatuses)
  );
  const partSnap = await getDocs(partQuery);
  if (!partSnap.empty) {
    const d = partSnap.docs[0];
    const session = { id: d.id, ...d.data() } as Session;
    if (isSessionRecoverableFor(session, uid)) {
      return session;
    }
  }

  return null;
}

// ─── Timer Controls ───────────────────────────────────────────────────────────

export async function startSession(sessionId: string, settings: SessionSettings): Promise<void> {
  const now = Timestamp.now();
  const endsAt = new Timestamp(now.seconds + settings.focusDuration, now.nanoseconds);

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'active',
    startedAt: serverTimestamp(),
    'timerState.isRunning': true,
    'timerState.endsAt': endsAt,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function pauseSession(sessionId: string, timeRemaining: number): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'paused',
    'timerState.isRunning': false,
    'timerState.timeRemaining': Math.max(0, timeRemaining),
    'timerState.endsAt': null,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function resumeSession(sessionId: string, timeRemaining: number): Promise<void> {
  const now = Timestamp.now();
  const endsAt = new Timestamp(now.seconds + timeRemaining, now.nanoseconds);

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'active',
    'timerState.isRunning': true,
    'timerState.endsAt': endsAt,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function advancePhase(
  sessionId: string,
  nextPhase: PomodoroPhase,
  nextPhaseDuration: number,
  newPhaseCount: number
): Promise<void> {
  const now = Timestamp.now();
  const endsAt = new Timestamp(now.seconds + nextPhaseDuration, now.nanoseconds);

  await updateDoc(doc(db, 'sessions', sessionId), {
    'timerState.phase': nextPhase,
    'timerState.timeRemaining': nextPhaseDuration,
    'timerState.isRunning': true,
    'timerState.phaseCount': newPhaseCount,
    'timerState.endsAt': endsAt,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function endSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    'timerState.isRunning': false,
    'timerState.endsAt': null,
  });
}

// ─── Leave / Rejoin ───────────────────────────────────────────────────────────

export async function leaveSession(
  sessionId: string,
  uid: string,
  isHost: boolean
): Promise<{ penaltyApplied: boolean }> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return { penaltyApplied: false };

  const session = snap.data() as Session;
  const otherUid = isHost ? session.participantId : session.hostId;
  const alreadyLeft = session.leftParticipants ?? [];
  const leaverName = isHost ? session.hostDisplayName : (session.participantDisplayName ?? 'Your partner');

  // Practice-mode solo sessions (stakes off) carry no leave penalty —
  // "no consequence" means no points lost either.
  const stakesOff = session.mode === 'solo' && session.stakesEnabled === false;
  if (!stakesOff) {
    await addPoints(uid, POINTS_LEAVE_PENALTY);
  }

  // If the other person already left, mark fully broken
  if (otherUid === null || alreadyLeft.includes(otherUid)) {
    await updateDoc(sessionRef, {
      status: 'broken',
      isBroken: true,
      leftParticipants: arrayUnion(uid),
      'timerState.isRunning': false,
      'timerState.endsAt': null,
    });
  } else {
    // Partner continues solo — timer keeps running
    await updateDoc(sessionRef, {
      status: 'solo',
      leftParticipants: arrayUnion(uid),
    });
    // Notify the remaining driver
    sendPush(otherUid, 'partner_retired', leaverName, { sessionId });
  }

  return { penaltyApplied: !stakesOff };
}

export async function rejoinSession(sessionId: string, uid: string): Promise<boolean> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return false;

  const session = snap.data() as Session;
  const validStatuses: string[] = ['solo', 'active', 'paused', 'waiting'];
  if (!validStatuses.includes(session.status)) return false;

  const updates: Record<string, any> = {
    leftParticipants: arrayRemove(uid),
  };

  // If solo and this person is rejoining, go back to active/paused
  if (session.status === 'solo') {
    updates.status = session.timerState.isRunning ? 'active' : 'paused';
  }

  await updateDoc(sessionRef, updates);
  return true;
}

/**
 * A participant backing out of a session that hasn't started yet. Nothing has
 * been raced for, so there's no penalty and nothing to record — just free up
 * the seat so the host can invite someone else.
 */
export async function leaveWaitingSession(sessionId: string, uid: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return;

  const session = snap.data() as Session;
  if (session.status !== 'waiting' || session.participantId !== uid) return;

  await updateDoc(sessionRef, {
    participantId: null,
    participantDisplayName: null,
    participantAvatarId: null,
  });
}

export async function cancelSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'cancelled',
    'timerState.isRunning': false,
  });
}

// ─── Session Invites ──────────────────────────────────────────────────────────

export async function sendSessionInvite(
  sessionId: string,
  joinCode: string,
  fromUid: string,
  fromDisplayName: string,
  fromAvatarId: DriverId,
  toUid: string
): Promise<void> {
  const ref = doc(collection(db, 'sessionInvites'));
  await setDoc(ref, {
    sessionId,
    joinCode,
    fromUid,
    fromDisplayName,
    fromAvatarId,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  // Push recipient regardless of whether the app is open
  sendPush(toUid, 'session_invite', fromDisplayName, { sessionId, joinCode });
}

export function subscribeToSessionInvites(
  toUid: string,
  callback: (invites: SessionInvite[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'sessionInvites'),
    where('toUid', '==', toUid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    const invites = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessionInvite));
    callback(invites);
  });
}

export async function respondToSessionInvite(
  inviteId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  await updateDoc(doc(db, 'sessionInvites', inviteId), { status });
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function saveSessionHistory(
  session: Session,
  userId: string,
  totalPointsEarned: number = 0
): Promise<void> {
  const isHost = session.hostId === userId;
  const partnerId = isHost ? session.participantId : session.hostId;
  const partnerDisplayName = isHost
    ? session.participantDisplayName
    : session.hostDisplayName;

  const focusSecondsCompleted =
    session.timerState.phaseCount * session.settings.focusDuration;
  const focusMinutes = Math.round(focusSecondsCompleted / 60);

  const pointsEarned = totalPointsEarned;
  const pointsLost =
    session.leftParticipants.includes(userId) ? Math.abs(POINTS_LEAVE_PENALTY) : 0;

  await addDoc(collection(db, 'sessionHistory'), {
    sessionId: session.id,
    userId,
    partnerId,
    partnerDisplayName,
    focusMinutes,
    phasesCompleted: session.timerState.phaseCount,
    wasCompleted: session.status === 'completed',
    wasBroken: session.isBroken,
    pointsEarned,
    pointsLost,
    createdAt: serverTimestamp(),
  });
}

// ─── Realtime Subscription ─────────────────────────────────────────────────────

export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Session);
  });
}
