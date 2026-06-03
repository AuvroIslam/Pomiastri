import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { DriverId } from '@/constants/drivers';

interface PartnerStatusProps {
  displayName: string | null;
  avatarId?: DriverId | null;
  isConnected: boolean;
  focusBroken: boolean;
  hasLeft?: boolean;
}

export function PartnerStatus({
  displayName,
  avatarId,
  isConnected,
  focusBroken,
  hasLeft = false,
}: PartnerStatusProps) {
  const dotColor = focusBroken || hasLeft
    ? Colors.error
    : isConnected
    ? Colors.success
    : Colors.textMuted;

  const label = hasLeft
    ? 'Left session'
    : focusBroken
    ? 'Focus broken'
    : isConnected
    ? 'In session'
    : 'Waiting...';

  return (
    <View style={styles.container}>
      <AvatarDisplay
        avatarId={avatarId}
        state={focusBroken || hasLeft ? 'sad' : isConnected ? 'focus' : 'idle'}
        size={44}
        animate={false}
      />
      <View>
        <Text style={styles.name}>{displayName ?? 'Waiting for partner'}</Text>
        <Text style={[styles.status, { color: dotColor }]}>{label}</Text>
      </View>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
});
