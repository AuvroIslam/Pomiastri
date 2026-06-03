import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { createSession, sendSessionInvite } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FriendItem } from '@/components/friends/FriendItem';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { DEFAULT_SESSION_SETTINGS } from '@/constants/pomodoro';
import { F1Assets } from '@/constants/drivers';
import { Friend, SessionMode } from '@/types';

export default function CreateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<SessionMode>(params.mode === 'solo' ? 'solo' : 'duo');
  const [loading, setLoading] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const { friends } = useFriends(profile?.uid);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  async function handleCreate() {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const result = await createSession(
        user.uid,
        profile.displayName,
        profile.avatarId,
        DEFAULT_SESSION_SETTINGS,
        mode
      );
      // Solo: skip the invite step, go straight to the track.
      if (mode === 'solo') {
        router.replace(`/(app)/session/${result.sessionId}`);
        return;
      }
      setCreatedSessionId(result.sessionId);
      setJoinCode(result.joinCode);
    } catch {
      Alert.alert('Error', 'Could not create session.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!joinCode) return;
    await Clipboard.setStringAsync(joinCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Join code copied to clipboard.');
  }

  async function handleInviteFriend(friend: Friend) {
    if (!createdSessionId || !joinCode || !user || !profile) return;
    try {
      await sendSessionInvite(
        createdSessionId,
        joinCode,
        user.uid,
        profile.displayName,
        profile.avatarId,
        friend.uid
      );
      setSentInvites((prev) => [...prev, friend.uid]);
      Alert.alert('Invite Sent', `${friend.displayName} has been invited to race!`);
    } catch {
      Alert.alert('Error', 'Could not send invite.');
    }
  }

  function handleEnterSession() {
    if (!createdSessionId) return;
    router.replace(`/(app)/session/${createdSessionId}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBar}>
          <Image source={F1Assets.logo} style={styles.f1Logo} resizeMode="contain" />
          <Text style={styles.title}>{mode === 'solo' ? 'SOLO PRACTICE' : 'CREATE GRAND PRIX'}</Text>
        </View>

        {!createdSessionId ? (
          <>
            {/* Mode toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.segment, mode === 'duo' && styles.segmentActive]}
                onPress={() => setMode('duo')}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, mode === 'duo' && styles.segmentTextActive]}>
                  DUO RACE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, mode === 'solo' && styles.segmentActive]}
                onPress={() => setMode('solo')}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, mode === 'solo' && styles.segmentTextActive]}>
                  SOLO PRACTICE
                </Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>RACE SETTINGS</Text>
              <SettingRow label="Race Lap" value="25 min" />
              <View style={styles.divider} />
              <SettingRow label="Pit Stop" value="5 min" />
              <View style={styles.divider} />
              <SettingRow label="Safety Car" value="15 min" />
            </Card>

            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                {mode === 'solo'
                  ? 'Practice focus on your own. Solo laps earn half points — perfect when no teammate is around.'
                  : 'Create a Grand Prix to get a Pit Pass code. Share it with your co-driver or invite them directly from your team list.'}
              </Text>
            </Card>

            <Button
              label={mode === 'solo' ? 'START SOLO RACE' : 'BUILD THE GRID'}
              onPress={handleCreate}
              loading={loading}
              size="lg"
            />
          </>
        ) : (
          <>
            {/* Join code */}
            <Card elevated style={styles.codeCard}>
              <Text style={styles.codeLabel}>YOUR PIT PASS CODE</Text>
              <Text style={styles.codeValue}>{joinCode}</Text>
              <Button label="COPY CODE" onPress={handleCopyCode} variant="secondary" size="sm" />
            </Card>

            {/* Invite friends */}
            {friends.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>INVITE TEAMMATES</Text>
                <Card>
                  {friends.map((friend, index) => (
                    <View key={friend.uid}>
                      {index > 0 && <View style={styles.divider} />}
                      <FriendItem
                        friend={friend}
                        onInvite={sentInvites.includes(friend.uid) ? undefined : handleInviteFriend}
                      />
                      {sentInvites.includes(friend.uid) && (
                        <Text style={styles.invitedBadge}>Invited</Text>
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            )}

            <Button label="ENTER THE GRID" onPress={handleEnterSession} size="lg" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={settingStyles.row}>
      <Text style={settingStyles.label}>{label}</Text>
      <Text style={settingStyles.value}>{value}</Text>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  label: { fontSize: FontSize.md, color: Colors.textSecondary },
  value: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  f1Logo: { width: 60, height: 22 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 3 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 1 },
  segmentTextActive: { color: Colors.textOnPrimary },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  settingsCard: { gap: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.divider },
  infoCard: { backgroundColor: Colors.surfaceElevated },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  codeCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  codeValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 8 },
  invitedBadge: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold, letterSpacing: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.xs },
});
