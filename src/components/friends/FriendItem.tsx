import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { Friend } from '@/types';

interface FriendItemProps {
  friend: Friend;
  onInvite?: (friend: Friend) => void;
  onRemove?: (friend: Friend) => void;
}

export function FriendItem({ friend, onInvite, onRemove }: FriendItemProps) {
  const initials = friend.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{friend.displayName}</Text>
        <Text style={styles.code}>{friend.friendCode}</Text>
      </View>
      <View style={styles.actions}>
        {onInvite && (
          <TouchableOpacity
            onPress={() => onInvite(friend)}
            style={styles.inviteBtn}
          >
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(friend)} style={styles.removeBtn}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
  },
  info: { flex: 1 },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  code: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  inviteBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  inviteText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  removeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  removeText: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
});
