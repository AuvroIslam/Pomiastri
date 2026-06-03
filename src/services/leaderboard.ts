import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { LeaderboardEntry, UserProfile } from '@/types';
import { DEFAULT_DRIVER } from '@/constants/drivers';

/** Realtime global leaderboard — top N users across all drivers, by points. */
export function subscribeToLeaderboard(
  limitCount: number,
  callback: (entries: LeaderboardEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users'),
    orderBy('points', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = snap.docs.map((d, index) => {
      const data = d.data() as UserProfile;
      return {
        uid: d.id,
        displayName: data.displayName,
        avatarId: data.avatarId ?? DEFAULT_DRIVER,
        points: data.points ?? 0,
        rank: index + 1,
      };
    });
    callback(entries);
  });
}

/**
 * Friends-only leaderboard — the current user plus their friends, ranked by
 * points. One-shot fetch (call on focus / toggle); friend lists are small in a
 * 1-to-1 accountability app so the N reads are cheap.
 */
export async function getFriendsLeaderboard(uid: string): Promise<LeaderboardEntry[]> {
  const friendsSnap = await getDocs(collection(db, 'users', uid, 'friends'));
  const ids = [uid, ...friendsSnap.docs.map((d) => d.id)];

  const profiles = await Promise.all(
    ids.map(async (id) => {
      const u = await getDoc(doc(db, 'users', id));
      if (!u.exists()) return null;
      const data = u.data() as UserProfile;
      return {
        uid: id,
        displayName: data.displayName,
        avatarId: data.avatarId ?? DEFAULT_DRIVER,
        points: data.points ?? 0,
      };
    })
  );

  return profiles
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.points - a.points)
    .map((p, index) => ({ ...p, rank: index + 1 }));
}
