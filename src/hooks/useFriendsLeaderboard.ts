import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LeaderboardEntry } from '@/types';
import { getFriendsLeaderboard } from '@/services/leaderboard';

export function useFriendsLeaderboard(uid: string | undefined) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!uid) {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      getFriendsLeaderboard(uid)
        .then((entries) => {
          if (active) setLeaderboard(entries);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [uid])
  );

  return { leaderboard, loading };
}
