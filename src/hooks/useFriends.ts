import { useState, useEffect } from 'react';
import { Friend, FriendRequest } from '@/types';
import {
  subscribeToFriends,
  subscribeToIncomingRequests,
} from '@/services/friends';

export function useFriends(uid: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<(FriendRequest & { id: string; toUid: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let friendsLoaded = false;
    let requestsLoaded = false;

    const checkLoaded = () => {
      if (friendsLoaded && requestsLoaded) setLoading(false);
    };

    const unsubFriends = subscribeToFriends(uid, (data) => {
      setFriends(data);
      friendsLoaded = true;
      checkLoaded();
    });

    const unsubRequests = subscribeToIncomingRequests(uid, (data) => {
      setRequests(data);
      requestsLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [uid]);

  return { friends, requests, loading };
}
