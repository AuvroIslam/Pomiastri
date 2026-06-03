import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { Friend } from '@/types';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';

interface FriendItemProps {
  friend: Friend;
  onInvite?: (friend: Friend) => void;
  onRemove?: (friend: Friend) => void;
}

export function FriendItem({ friend, onInvite, onRemove }: FriendItemProps) {
  return (
    <View style={styles.container}>
      <AvatarDisplay avatarId={friend.avatarId} state="idle" size={44} animate={false} />
      <View style={styles.info}>
        <Text style={styles.name}>{friend.displayName}</Text>
        <Text style={styles.code}>{friend.friendCode}</Text>
      </View>
      <View style={styles.actions}>
        {onInvite && (
          <TouchableOpacity onPress={() => onInvite(friend)} style={styles.inviteBtn}>
            <Text style={styles.inviteText}>INVITE</Text>
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
  info: { flex: 1 },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  code: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  inviteBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  inviteText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.textOnPrimary,
    letterSpacing: 1,
  },
  removeBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  removeText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
