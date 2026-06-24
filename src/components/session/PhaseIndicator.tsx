import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface PhaseIndicatorProps {
  phaseCount: number;
  lapsPerCycle: number;
  totalCycles: number;
}

export function PhaseIndicator({ phaseCount, lapsPerCycle, totalCycles }: PhaseIndicatorProps) {
  const lapInCycle = phaseCount % lapsPerCycle;
  const currentCycle = Math.min(Math.floor(phaseCount / lapsPerCycle) + 1, totalCycles);

  const isDotFilled = (i: number) =>
    i < lapInCycle || (phaseCount > 0 && lapInCycle === 0 && i < lapsPerCycle);

  return (
    <View style={styles.container}>
      {Array.from({ length: lapsPerCycle }).map((_, i) => (
        <View key={i} style={[styles.dot, isDotFilled(i) ? styles.dotFilled : styles.dotEmpty]} />
      ))}
      <Text style={styles.label}>C{currentCycle}/{totalCycles}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotFilled: { backgroundColor: Colors.primary },
  dotEmpty: { backgroundColor: Colors.border },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.black,
    marginLeft: Spacing.xs,
    letterSpacing: 1,
  },
});
