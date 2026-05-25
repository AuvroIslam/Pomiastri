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
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Session, SessionSettings, TimerState, PomodoroPhase } from '@/types';
import { DEFAULT_SESSION_SETTINGS } from '@/constants/pomodoro';
import { generateJoinCode } from '@/utils/code';

// ─── Create / Join ─────────────────────────────────────────────────────────────

export async function createSession(
  hostId: string,
  hostDisplayName: string,
  settings: SessionSettings = DEFAULT_SESSION_SETTINGS
): Promise<string> {
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
    hostId,
    hostDisplayName,
    participantId: null,
    participantDisplayName: null,
    status: 'waiting',
    joinCode: joinCode.toUpperCase(),
    timerState,
    settings,
    isBroken: false,
    hostFocusBroken: false,
    participantFocusBroken: false,
    createdAt: serverTimestamp() as any,
    startedAt: null,
    completedAt: null,
  };

  await setDoc(sessionRef, session);
  return sessionRef.id;
}

export async function joinSessionByCode(
  joinCode: string,
  participantId: string,
  participantDisplayName: string
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

  if (session.hostId === participantId) {
    return { success: false, error: 'You are the host of this session.' };
  }

  if (session.participantId !== null) {
    return { success: false, error: 'Session is full.' };
  }

  await updateDoc(sessionDoc.ref, {
    participantId,
    participantDisplayName,
    status: 'waiting',
  });

  return { success: true, sessionId: sessionDoc.id };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
}

// ─── Timer Controls ───────────────────────────────────────────────────────────

export async function startSession(sessionId: string, settings: SessionSettings): Promise<void> {
  const now = Timestamp.now();
  const endsAt = new Timestamp(
    now.seconds + settings.focusDuration,
    now.nanoseconds
  );

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'active',
    startedAt: serverTimestamp(),
    'timerState.isRunning': true,
    'timerState.endsAt': endsAt,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function pauseSession(
  sessionId: string,
  timeRemaining: number
): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'paused',
    'timerState.isRunning': false,
    'timerState.timeRemaining': Math.max(0, timeRemaining),
    'timerState.endsAt': null,
    'timerState.lastUpdatedAt': serverTimestamp(),
  });
}

export async function resumeSession(
  sessionId: string,
  timeRemaining: number
): Promise<void> {
  const now = Timestamp.now();
  const endsAt = new Timestamp(
    now.seconds + timeRemaining,
    now.nanoseconds
  );

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
  const endsAt = new Timestamp(
    now.seconds + nextPhaseDuration,
    now.nanoseconds
  );

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

export async function markSessionBroken(
  sessionId: string,
  byHost: boolean
): Promise<void> {
  const field = byHost ? 'hostFocusBroken' : 'participantFocusBroken';
  await updateDoc(doc(db, 'sessions', sessionId), {
    [field]: true,
    isBroken: true,
    'timerState.isRunning': false,
    'timerState.endsAt': null,
  });
}

export async function cancelSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'cancelled',
    'timerState.isRunning': false,
  });
}

// ─── Session History ───────────────────────────────────────────────────────────

export async function saveSessionHistory(
  session: Session,
  userId: string
): Promise<void> {
  const isHost = session.hostId === userId;
  const partnerId = isHost ? session.participantId : session.hostId;
  const partnerDisplayName = isHost
    ? session.participantDisplayName
    : session.hostDisplayName;

  const focusSecondsCompleted =
    session.timerState.phaseCount * session.settings.focusDuration;
  const focusMinutes = Math.round(focusSecondsCompleted / 60);

  await addDoc(collection(db, 'sessionHistory'), {
    sessionId: session.id,
    userId,
    partnerId,
    partnerDisplayName,
    focusMinutes,
    phasesCompleted: session.timerState.phaseCount,
    wasCompleted: session.status === 'completed',
    wasBroken: session.isBroken,
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
