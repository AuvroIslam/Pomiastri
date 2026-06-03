import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { LeaderboardEntry } from '@/types';
import { DRIVERS, DEFAULT_DRIVER } from '@/constants/drivers';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const RANK_COLORS = [Colors.gold, Colors.silver, Colors.bronze];

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const rankColor = entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : Colors.textMuted;
  const driver = DRIVERS[entry.avatarId] ?? DRIVERS[DEFAULT_DRIVER];

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <Text style={[styles.rank, { color: rankColor }]}>
        {entry.rank <= 3 ? ['1ST', '2ND', '3RD'][entry.rank - 1] : `#${entry.rank}`}
      </Text>
      <Image source={driver.assets.helmet} style={styles.helmet} resizeMode="contain" />
      <Text style={[styles.name, isCurrentUser && styles.nameHighlight]} numberOfLines={1}>
        {entry.displayName}
        {isCurrentUser ? ' (You)' : ''}
      </Text>
      <View style={[styles.pointsBadge, { borderColor: rankColor }]}>
        <Text style={[styles.points, { color: rankColor }]}>{entry.points}</Text>
        <Text style={styles.ptsLabel}>PTS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowHighlight: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  rank: {
    width: 38,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    letterSpacing: 0.5,
  },
  helmet: { width: 36, height: 36 },
  name: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  nameHighlight: { color: Colors.primary },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  points: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
  },
  ptsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
});
