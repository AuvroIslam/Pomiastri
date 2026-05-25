import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Friend, FriendRequest, UserProfile } from '@/types';
import { getUserByFriendCode, getUserProfile } from './users';

// ─── Friend Requests ──────────────────────────────────────────────────────────

export async function sendFriendRequest(
  fromUser: UserProfile,
  toFriendCode: string
): Promise<{ success: boolean; error?: string }> {
  if (fromUser.friendCode === toFriendCode.toUpperCase()) {
    return { success: false, error: "You can't add yourself." };
  }

  const target = await getUserByFriendCode(toFriendCode);
  if (!target) {
    return { success: false, error: 'No user found with that friend code.' };
  }

  // Check already friends
  const friendDoc = await getDoc(
    doc(db, 'users', fromUser.uid, 'friends', target.uid)
  );
  if (friendDoc.exists()) {
    return { success: false, error: 'You are already friends.' };
  }

  // Check pending request
  const pendingQuery = query(
    collection(db, 'friendRequests'),
    where('fromUid', '==', fromUser.uid),
    where('toFriendCode', '==', toFriendCode.toUpperCase()),
    where('status', '==', 'pending')
  );
  const pending = await getDocs(pendingQuery);
  if (!pending.empty) {
    return { success: false, error: 'Request already sent.' };
  }

  const ref = doc(collection(db, 'friendRequests'));
  await setDoc(ref, {
    fromUid: fromUser.uid,
    fromDisplayName: fromUser.displayName,
    fromFriendCode: fromUser.friendCode,
    toFriendCode: toFriendCode.toUpperCase(),
    toUid: target.uid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return { success: true };
}

export async function acceptFriendRequest(
  requestId: string,
  currentUid: string
): Promise<void> {
  const requestRef = doc(db, 'friendRequests', requestId);
  const snap = await getDoc(requestRef);
  if (!snap.exists()) throw new Error('Request not found');

  const request = snap.data() as FriendRequest & { toUid: string };
  const fromProfile = await getUserProfile(request.fromUid);
  const toProfile = await getUserProfile(currentUid);

  if (!fromProfile || !toProfile) throw new Error('User not found');

  // Add each user to the other's friends subcollection
  const now = serverTimestamp();

  await setDoc(doc(db, 'users', request.fromUid, 'friends', currentUid), {
    uid: currentUid,
    displayName: toProfile.displayName,
    friendCode: toProfile.friendCode,
    addedAt: now,
  });

  await setDoc(doc(db, 'users', currentUid, 'friends', request.fromUid), {
    uid: request.fromUid,
    displayName: fromProfile.displayName,
    friendCode: fromProfile.friendCode,
    addedAt: now,
  });

  await deleteDoc(requestRef);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', requestId));
}

export async function removeFriend(
  currentUid: string,
  friendUid: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', currentUid, 'friends', friendUid));
  await deleteDoc(doc(db, 'users', friendUid, 'friends', currentUid));
}

// ─── Realtime listeners ────────────────────────────────────────────────────────

export function subscribeToFriends(
  uid: string,
  callback: (friends: Friend[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, 'friends'),
    orderBy('addedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const friends = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Friend));
    callback(friends);
  });
}

export function subscribeToIncomingRequests(
  uid: string,
  callback: (requests: (FriendRequest & { id: string; toUid: string })[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as FriendRequest & { id: string; toUid: string })
    );
    callback(requests);
  });
}
