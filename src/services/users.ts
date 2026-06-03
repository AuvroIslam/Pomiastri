import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '@/types';
import { DriverId, DEFAULT_DRIVER } from '@/constants/drivers';
import { generateFriendCode } from '@/utils/code';
import { getDateString } from '@/utils/time';

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  avatarId: DriverId = DEFAULT_DRIVER
): Promise<void> {
  const friendCode = generateFriendCode();
  const profile: Omit<UserProfile, 'uid'> = {
    email,
    displayName,
    friendCode,
    avatarId,
    points: 0,
    createdAt: serverTimestamp() as any,
    totalFocusMinutes: 0,
    totalSessions: 0,
    currentStreak: 0,
    lastSessionDate: null,
  };
  await setDoc(doc(db, 'users', uid), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function getUserByFriendCode(
  friendCode: string
): Promise<UserProfile | null> {
  const q = query(
    collection(db, 'users'),
    where('friendCode', '==', friendCode.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
}

export async function updateAvatar(uid: string, avatarId: DriverId): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { avatarId });
}

export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { displayName });
}

export async function updatePushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
}

export async function addPoints(uid: string, delta: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    points: increment(delta),
  });
}


export async function recordSessionCompletion(
  uid: string,
  focusMinutes: number,
  pointsEarned: number
): Promise<void> {
  const today = getDateString();
  const profileRef = doc(db, 'users', uid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserProfile;
  const lastDate = profile.lastSessionDate;

  let streakDelta = 0;
  if (!lastDate) {
    streakDelta = 1;
  } else if (lastDate === today) {
    streakDelta = 0;
  } else {
    const yesterday = getDateString(new Date(Date.now() - 86400000));
    streakDelta = lastDate === yesterday ? 1 : -profile.currentStreak; // reset to 0 on gap
  }

  await updateDoc(profileRef, {
    totalFocusMinutes: increment(focusMinutes),
    totalSessions: increment(1),
    currentStreak: increment(streakDelta),
    lastSessionDate: today,
    points: increment(pointsEarned),
  });
}
