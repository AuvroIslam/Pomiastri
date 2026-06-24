import { Timestamp } from 'firebase/firestore';
import { DriverId } from '@/constants/drivers';

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
  avatarId: DriverId;
  points: number;
  expoPushToken?: string;
  createdAt: Timestamp;
  totalFocusMinutes: number;
  totalSessions: number;
  currentStreak: number;
  lastSessionDate: string | null; // ISO date YYYY-MM-DD
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatarId: DriverId;
  points: number;
  rank: number;
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  fromFriendCode: string;
  fromAvatarId: DriverId;
  toFriendCode: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Friend {
  uid: string;
  displayName: string;
  friendCode: string;
  avatarId: DriverId;
  addedAt: Timestamp;
}

export interface SessionInvite {
  id: string;
  sessionId: string;
  joinCode: string;
  fromUid: string;
  fromDisplayName: string;
  fromAvatarId: DriverId;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export type SessionStatus =
  | 'waiting'
  | 'active'
  | 'paused'
  | 'solo'       // one participant left, the other continues
  | 'completed'
  | 'broken'     // both left
  | 'cancelled';

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  phase: PomodoroPhase;
  timeRemaining: number; // seconds
  isRunning: boolean;
  phaseCount: number;
  endsAt: Timestamp | null;
  lastUpdatedAt: Timestamp;
}

export interface SessionSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  lapsPerCycle: number;
  totalCycles: number;
}

export type SessionMode = 'duo' | 'solo';

export interface Session {
  id: string;
  mode: SessionMode;
  hostId: string;
  hostDisplayName: string;
  hostAvatarId: DriverId;
  participantId: string | null;
  participantDisplayName: string | null;
  participantAvatarId: DriverId | null;
  status: SessionStatus;
  joinCode: string;
  timerState: TimerState;
  settings: SessionSettings;
  // Duo races always have stakes. Solo practice can opt in/out of points
  // (gain + leave penalty) via the toggle on the create-session screen.
  stakesEnabled: boolean;
  leftParticipants: string[];   // UIDs who left — DNF is final, no rejoin
  isBroken: boolean;
  hostFocusBroken: boolean;
  participantFocusBroken: boolean;
  // App-switch strikes per driver. 3rd switch during a focus phase = auto-DNF.
  hostSwitchCount: number;
  participantSwitchCount: number;
  hostPointsEarned: number;
  participantPointsEarned: number;
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
  pointsEarned: number;
  pointsLost: number;
  createdAt: Timestamp;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
