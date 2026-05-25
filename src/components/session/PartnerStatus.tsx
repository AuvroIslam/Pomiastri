import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

interface PartnerStatusProps {
  displayName: string | null;
  isConnected: boolean;
  focusBroken: boolean;
}

export function PartnerStatus({
  displayName,
  isConnected,
  focusBroken,
}: PartnerStatusProps) {
  const dotColor = focusBroken
    ? Colors.error
    : isConnected
    ? Colors.success
    : Colors.textMuted;

  const label = focusBroken
    ? 'Focus broken'
    : isConnected
    ? 'In session'
    : 'Waiting...';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View>
        <Text style={styles.name}>{displayName ?? 'Waiting for partner'}</Text>
        <Text style={[styles.status, { color: dotColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
