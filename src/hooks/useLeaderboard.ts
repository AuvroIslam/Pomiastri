import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/types';
import { subscribeToLeaderboard } from '@/services/leaderboard';

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToLeaderboard(limit, (entries) => {
      setLeaderboard(entries);
      setLoading(false);
    });
    return unsub;
  }, [limit]);

  return { leaderboard, loading };
}
