import { Timestamp } from 'firebase/firestore';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  friendCode: string;
  createdAt: Timestamp;
  totalFocusMinutes: number;
  totalSessions: number;
  currentStreak: number;
  lastSessionDate: string | null; // ISO date string YYYY-MM-DD
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  fromFriendCode: string;
  toFriendCode: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Friend {
  uid: string;
  displayName: string;
  friendCode: string;
  addedAt: Timestamp;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export type SessionStatus =
  | 'waiting'
  | 'active'
  | 'paused'
  | 'completed'
  | 'broken'
  | 'cancelled';

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  phase: PomodoroPhase;
  timeRemaining: number; // seconds
  isRunning: boolean;
  phaseCount: number; // number of completed focus phases
  endsAt: Timestamp | null; // when the current running phase ends (server time)
  lastUpdatedAt: Timestamp;
}

export interface SessionSettings {
  focusDuration: number; // seconds
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface Session {
  id: string;
  hostId: string;
  hostDisplayName: string;
  participantId: string | null;
  participantDisplayName: string | null;
  status: SessionStatus;
  joinCode: string;
  timerState: TimerState;
  settings: SessionSettings;
  isBroken: boolean;
  hostFocusBroken: boolean;
  participantFocusBroken: boolean;
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

// ─── Session History ──────────────────────────────────────────────────────────

export interface SessionHistoryEntry {
  id: string;
  sessionId: string;
  userId: string;
  partnerId: string | null;
  partnerDisplayName: string | null;
  focusMinutes: number;
  phasesCompleted: number;
  wasCompleted: boolean;
  wasBroken: boolean;
  createdAt: Timestamp;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
