import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  Image,
  TouchableOpacity,
  Switch,
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
import { AppLogo } from '@/components/ui/AppLogo';
import { Friend, SessionMode } from '@/types';

const FOCUS_OPTIONS = [15, 25, 30, 45, 50, 60];
const BREAK_OPTIONS = [5, 10, 15];
const LONG_BREAK_OPTIONS = [10, 15, 20, 30];

export default function CreateSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<SessionMode>(params.mode === 'solo' ? 'solo' : 'duo');
  const [focusMin, setFocusMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [stakesEnabled, setStakesEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const { friends } = useFriends(profile?.uid);

  useFocusEffect(
    useCallback(() => {
      // Reset stale session state every time this screen is focused.
      // Without this, re-entering from home keeps old createdSessionId and
      // hides the form + time pickers.
      setCreatedSessionId(null);
      setJoinCode(null);
      setSentInvites([]);
      setMode(params.mode === 'solo' ? 'solo' : 'duo');
      setStakesEnabled(true);

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });
      return () => sub.remove();
    }, [router, params.mode])
  );

  async function handleCreate() {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const settings = {
        focusDuration: focusMin * 60,
        shortBreakDuration: shortBreakMin * 60,
        longBreakDuration: longBreakMin * 60,
      };
      const result = await createSession(
        user.uid,
        profile.displayName,
        profile.avatarId,
        settings,
        mode,
        mode === 'solo' ? stakesEnabled : true
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

  const [copied, setCopied] = useState(false);
  async function handleCopyCode() {
    if (!joinCode) return;
    await Clipboard.setStringAsync(joinCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
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
          <AppLogo size={40} />
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

            {mode === 'solo' && (
              <Card style={styles.stakesCard}>
                <View style={styles.stakesRow}>
                  <View style={styles.stakesLabel}>
                    <Text style={styles.stakesTitle}>
                      {stakesEnabled ? 'RACE MODE — STAKES ON' : 'PRACTICE MODE — STAKES OFF'}
                    </Text>
                    <Text style={styles.stakesSub}>
                      {stakesEnabled
                        ? 'Earn points for laps completed. Leaving the app mid-race costs you points.'
                        : 'No points gained or lost. Leaving the app has no consequence — just the clock.'}
                    </Text>
                  </View>
                  <Switch
                    value={stakesEnabled}
                    onValueChange={setStakesEnabled}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.textOnPrimary}
                  />
                </View>
              </Card>
            )}

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>RACE SETTINGS</Text>
              <SettingPicker
                label="Race Lap"
                options={FOCUS_OPTIONS}
                value={focusMin}
                onChange={setFocusMin}
              />
              <View style={styles.divider} />
              <SettingPicker
                label="Pit Stop"
                options={BREAK_OPTIONS}
                value={shortBreakMin}
                onChange={setShortBreakMin}
              />
              <View style={styles.divider} />
              <SettingPicker
                label="Safety Car"
                options={LONG_BREAK_OPTIONS}
                value={longBreakMin}
                onChange={setLongBreakMin}
              />
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
              <View style={styles.codeRow}>
                <Text style={styles.codeValue}>{joinCode}</Text>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                  <Text style={styles.copyIcon}>{copied ? '✅' : '📋'}</Text>
                </TouchableOpacity>
              </View>
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

function SettingPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const idx = options.indexOf(value);
  const prev = () => onChange(options[Math.max(0, idx - 1)]);
  const next = () => onChange(options[Math.min(options.length - 1, idx + 1)]);

  return (
    <View style={settingStyles.row}>
      <Text style={settingStyles.label}>{label}</Text>
      <View style={settingStyles.picker}>
        <TouchableOpacity onPress={prev} style={settingStyles.arrow} disabled={idx === 0}>
          <Text style={[settingStyles.arrowText, idx === 0 && settingStyles.arrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={settingStyles.value}>{value} min</Text>
        <TouchableOpacity onPress={next} style={settingStyles.arrow} disabled={idx === options.length - 1}>
          <Text style={[settingStyles.arrowText, idx === options.length - 1 && settingStyles.arrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  label: { fontSize: FontSize.md, color: Colors.textSecondary },
  picker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  arrow: { padding: 4 },
  arrowText: { fontSize: 22, color: Colors.primary, fontWeight: FontWeight.bold },
  arrowDisabled: { color: Colors.border },
  value: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, minWidth: 60, textAlign: 'center' },
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
  stakesCard: { paddingVertical: Spacing.md },
  stakesRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stakesLabel: { flex: 1, gap: 4 },
  stakesTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 1 },
  stakesSub: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  settingsCard: { gap: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.divider },
  infoCard: { backgroundColor: Colors.surfaceElevated },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  codeCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  codeValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  copyBtn: { padding: 6, marginLeft: Spacing.sm },
  copyIcon: { fontSize: FontSize.lg },
  invitedBadge: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold, letterSpacing: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.xs },
});
