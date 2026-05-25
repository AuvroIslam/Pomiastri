# Pomiastri 🌿

A minimalist one-to-one Pomodoro study accountability app. Study together, stay focused.

## Features

- **Authentication** — Email/password with persistent session
- **Friend System** — Unique friend codes, send/accept requests
- **Synced Sessions** — Real-time Firestore timer, both users always in sync
- **Pomodoro Timer** — Focus (25m) / Short break (5m) / Long break (15m)
- **Focus Mode** — App-background detection marks session as "Focus Broken"
- **Session History** — Tracks completed sessions, focus minutes, streaks
- **Calm UI** — Minimal, clean, distraction-free design

## Tech Stack

- Expo SDK 56 (managed workflow)
- React Native + TypeScript
- Expo Router (file-based routing)
- Firebase Authentication
- Firebase Firestore (realtime)

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android device or emulator

### 2. Clone & Install

```bash
git clone <repo-url>
cd pomiastri
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password sign-in
4. Enable **Firestore Database** → Start in production mode
5. Go to **Project Settings → General → Web app** → Register app → Copy config
6. Deploy Firestore rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add  # select your project
   firebase deploy --only firestore:rules
   ```

### 4. Environment

```bash
cp .env.example .env.local
```

Fill in your Firebase config values in `.env.local`.

### 5. Run on Android

```bash
npm run android
# or scan the QR with Expo Go
npm start
```

---

## Project Structure

```
app/
├── _layout.tsx           Root layout + auth guard
├── index.tsx             Redirect to (app)
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
└── (app)/
    ├── index.tsx         Home — friend code, quick stats, CTAs
    ├── friends.tsx       Friends list, requests, add by code
    ├── stats.tsx         Session history and totals
    ├── create-session.tsx
    ├── join-session.tsx
    └── session/[id].tsx  Active session room

src/
├── types/index.ts        All TypeScript interfaces
├── constants/
│   ├── theme.ts          Colors, spacing, typography
│   └── pomodoro.ts       Phase durations, transitions
├── services/
│   ├── firebase.ts       App init + auth/db exports
│   ├── auth.ts           Login, register, logout
│   ├── users.ts          Profile CRUD, stats update
│   ├── friends.ts        Requests, friends subcollection
│   ├── sessions.ts       Session lifecycle + timer writes
│   └── stats.ts          History queries
├── hooks/
│   ├── useAuth.ts        Auth state + profile
│   ├── useFriends.ts     Realtime friends + requests
│   ├── useSession.ts     Realtime session listener
│   ├── useTimer.ts       Live countdown from endsAt
│   └── useAppState.ts    Background detection
├── components/
│   ├── ui/               Button, Input, Card, TimerDisplay
│   ├── session/          PhaseIndicator, PartnerStatus
│   └── friends/          FriendItem
└── utils/
    ├── code.ts           generateFriendCode, generateJoinCode
    └── time.ts           formatSeconds, date helpers
```

---

## Firestore Collections

| Collection | Document | Purpose |
|---|---|---|
| `users/{uid}` | UserProfile | Profile, friendCode, stats |
| `users/{uid}/friends/{friendUid}` | Friend | Friends subcollection |
| `friendRequests/{id}` | FriendRequest | Pending requests |
| `sessions/{id}` | Session | Live session state + timer |
| `sessionHistory/{id}` | SessionHistoryEntry | Completed records |

**Key session fields:**

```
sessions/{id}
  hostId, hostDisplayName
  participantId, participantDisplayName
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'broken' | 'cancelled'
  joinCode
  timerState: { phase, timeRemaining, isRunning, phaseCount, endsAt }
  settings: { focusDuration, shortBreakDuration, longBreakDuration }
  isBroken, hostFocusBroken, participantFocusBroken
```

---

## Focus Mode — Honest Limitations

**What works in managed Expo:**
- `AppState` API detects when app goes to background
- `BackHandler` intercepts the Android back button within the app
- Session is marked `isBroken` in Firestore when either user leaves
- A "Focus Broken" screen is shown to both users

**What requires native Android modules (bare workflow):**
- `ActivityManager.startLockTask()` — true kiosk/lock-task mode
- Preventing the home button press
- System-level foreground locking

For a production app requiring true lock-task mode, eject to bare workflow and use a `DevicePolicyManager` + `startLockTask()` implementation.

---

## Timer Sync Strategy

The timer uses a **server-anchored approach** to keep both users in sync:

- When running: `timeRemaining = endsAt (server timestamp) - Date.now()`
- When paused: `timeRemaining` is stored directly in Firestore
- Only the **host** writes timer state to avoid conflicts
- Both users derive the countdown from the same `endsAt` field

This means even if one user's local clock is slightly off, both will always see the same countdown.
