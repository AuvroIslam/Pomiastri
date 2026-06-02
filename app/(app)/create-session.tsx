import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { createSession, sendSessionInvite } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FriendItem } from '@/components/friends/FriendItem';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { DEFAULT_SESSION_SETTINGS } from '@/constants/pomodoro';
import { SessionSettings, Friend } from '@/types';

export default function CreateSessionScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const { friends, loading: friendsLoading } = useFriends(profile?.uid);

  // Simple settings — MVP uses defaults
  const settings: SessionSettings = DEFAULT_SESSION_SETTINGS;

  async function handleCreate() {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const result = await createSession(user.uid, profile.displayName, settings);
      setCreatedSessionId(result.sessionId);
      setJoinCode(result.joinCode);
    } catch {
      Alert.alert('Error', 'Could not create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!joinCode) return;
    await Clipboard.setStringAsync(joinCode);
    Alert.alert('Copied', 'Session join code copied to clipboard.');
  }

  const [inviteLoading, setInviteLoading] = useState<string | null>(null);

  async function handleInvite(friend: Friend) {
    if (!joinCode || !createdSessionId || !user) return;
    setInviteLoading(friend.uid);
    try {
      await sendSessionInvite(
        createdSessionId,
        joinCode,
        user.uid,
        profile?.displayName ?? 'Someone',
        friend.uid
      );
      Alert.alert('Invite sent', `${friend.displayName} has been invited.`);
    } catch {
      Alert.alert('Error', 'Could not send invite. Please try again.');
    } finally {
      setInviteLoading(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>New Study Session</Text>
        <Text style={styles.subtitle}>
          Create a room and share the code with a friend.
        </Text>

        {/* Session Settings Preview */}
        <Card style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Session Settings</Text>
          <SettingRow
            label="Focus"
            value={`${settings.focusDuration / 60} min`}
            emoji="🎯"
          />
          <View style={styles.divider} />
          <SettingRow
            label="Short Break"
            value={`${settings.shortBreakDuration / 60} min`}
            emoji="☕"
          />
          <View style={styles.divider} />
          <SettingRow
            label="Long Break"
            value={`${settings.longBreakDuration / 60} min`}
            emoji="🌿"
          />
        </Card>

        {createdSessionId ? (
          <>
            <Card style={styles.joinCodeCard}>
              <Text style={styles.settingsTitle}>Session Created</Text>
              <Text style={styles.joinCodeLabel}>Join code</Text>
              <Text style={styles.joinCodeValue}>{joinCode}</Text>
              <Button
                label="Copy Code"
                onPress={handleCopyJoinCode}
                size="md"
                style={styles.copyBtn}
              />
            </Card>

            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                Your session is ready. Invite a friend below or copy the code and share it directly. The session will wait for someone to join.
              </Text>
            </Card>

            <Card style={styles.friendCard}>
              <Text style={styles.settingsTitle}>Invite Friends</Text>
              {friendsLoading ? (
                <Text style={styles.friendText}>Loading friends…</Text>
              ) : friends.length === 0 ? (
                <Text style={styles.friendText}>
                  You have no friends yet. Add friends first to invite them here.
                </Text>
              ) : (
                friends.map((friend, index) => (
                  <React.Fragment key={friend.uid}>
                    {index > 0 && <View style={styles.friendDivider} />}
                    <FriendItem friend={friend} onInvite={handleInvite} />
                  </React.Fragment>
                ))
              )}
            </Card>

            <Button
              label="Open Session"
              onPress={() => router.replace(`/(app)/session/${createdSessionId}`)}
              size="lg"
            />
          </>
        ) : (
          <>
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                After creating, you'll get a join code. Share it with your study partner.
                The session starts when they join and you press Start.
              </Text>
            </Card>

            <Button
              label="Create Session"
              onPress={handleCreate}
              loading={loading}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <View style={settingStyles.row}>
      <Text style={settingStyles.emoji}>{emoji}</Text>
      <Text style={settingStyles.label}>{label}</Text>
      <Text style={settingStyles.value}>{value}</Text>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emoji: { fontSize: FontSize.lg },
  label: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  value: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  backBtn: { marginBottom: Spacing.xs },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  settingsCard: { gap: Spacing.sm },
  settingsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  infoCard: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  joinCodeCard: {
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  joinCodeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  joinCodeValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 8,
  },
  copyBtn: { width: '100%' },
  friendCard: { gap: Spacing.sm },
  friendText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  friendDivider: { height: 1, backgroundColor: Colors.divider },
});
