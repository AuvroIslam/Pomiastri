import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionHistoryEntry } from '@/types';

export async function getUserHistory(
  uid: string,
  limitCount = 20
): Promise<SessionHistoryEntry[]> {
  const q = query(
    collection(db, 'sessionHistory'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessionHistoryEntry));
}
