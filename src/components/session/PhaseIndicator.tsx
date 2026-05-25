import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { LONG_BREAK_INTERVAL } from '@/constants/pomodoro';

interface PhaseIndicatorProps {
  phaseCount: number;
}

export function PhaseIndicator({ phaseCount }: PhaseIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: LONG_BREAK_INTERVAL }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < phaseCount % LONG_BREAK_INTERVAL || (phaseCount > 0 && phaseCount % LONG_BREAK_INTERVAL === 0 && i < LONG_BREAK_INTERVAL)
              ? styles.dotFilled
              : styles.dotEmpty,
          ]}
        />
      ))}
      <Text style={styles.label}>
        {phaseCount} {phaseCount === 1 ? 'session' : 'sessions'}
      </Text>
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
    marginLeft: Spacing.xs,
  },
});
