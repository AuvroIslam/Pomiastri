import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { updateAvatar, updateDisplayName, addPoints } from '@/services/users';
import { logoutUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/session/ConfirmModal';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets, DRIVERS, DEFAULT_DRIVER, DriverId, DriverState } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';

const SHOWCASE_STATES: DriverState[] = ['idle', 'focus', 'happy', 'sad', 'car', 'helmet'];
const AVATAR_SWITCH_COST = 50;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [previewAvatarId, setPreviewAvatarId] = useState<DriverId | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [copied, setCopied] = useState(false);

  // Cycle through avatar states on the showcase card
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setShowcaseIndex((i) => (i + 1) % SHOWCASE_STATES.length);
    }, 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const showcaseState = SHOWCASE_STATES[showcaseIndex];
  const displayedAvatarId = previewAvatarId ?? profile?.avatarId ?? DEFAULT_DRIVER;
  const isPreviewingDifferent = previewAvatarId !== null && previewAvatarId !== profile?.avatarId;

  async function handleSaveName() {
    if (!user || !newName.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(user.uid, newName.trim());
      await refreshProfile();
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'Could not update name.');
    } finally {
      setSavingName(false);
    }
  }

  function confirmLogout() {
    setShowLogoutModal(true);
  }

  function handleRequestSwitch() {
    if (!previewAvatarId) return;
    if ((profile?.points ?? 0) < AVATAR_SWITCH_COST) {
      Alert.alert(
        'Not Enough Points',
        `Switching drivers costs ${AVATAR_SWITCH_COST} points. Keep racing to earn more.`
      );
      return;
    }
    setShowSwitchModal(true);
  }

  async function handleConfirmSwitchAvatar() {
    if (!user || !previewAvatarId) return;
    setSavingAvatar(true);
    try {
      await updateAvatar(user.uid, previewAvatarId);
      await addPoints(user.uid, -AVATAR_SWITCH_COST);
      await refreshProfile();
      setShowSwitchModal(false);
      setPreviewAvatarId(null);
    } catch {
      Alert.alert('Error', 'Could not update avatar.');
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleCopyFriendCode() {
    const code = profile?.friendCode;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <>
      {/* Sign Out Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="PIT OUT?"
        message="Sign out of your account?"
        cancelLabel="Cancel"
        confirmLabel="Sign Out"
        confirmVariant="danger"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => logoutUser()}
      />

      {/* Switch Driver Modal */}
      <ConfirmModal
        visible={showSwitchModal}
        title="SWITCH DRIVER?"
        message={
          previewAvatarId
            ? `Switching to ${DRIVERS[previewAvatarId].name} costs ${AVATAR_SWITCH_COST} points.`
            : ''
        }
        cancelLabel="Cancel"
        confirmLabel="Switch"
        loading={savingAvatar}
        onCancel={() => setShowSwitchModal(false)}
        onConfirm={handleConfirmSwitchAvatar}
      />

      <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBar}>
          <AppLogo size={40} />
          <Text style={styles.title}>GARAGE</Text>
        </View>

        {/* Driver showcase — auto-cycles through all moods */}
        <Card elevated style={styles.showcaseCard}>
          <AvatarDisplay
            key={displayedAvatarId}
            avatarId={displayedAvatarId}
            state={showcaseState}
            size={150}
            style={showcaseState === 'car' ? { width: 260 } : undefined}
          />
          {!editingName ? (
            <View style={styles.nameRow}>
              <View style={styles.nameInner}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {profile?.displayName ?? 'DRIVER'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setEditingName(true); setNewName(profile?.displayName ?? ''); }}
                style={styles.editIconBtn}
                hitSlop={8}
              >
                <Feather name="edit-2" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameEditRow}>
              <Input
                value={newName}
                onChangeText={setNewName}
                placeholder="Driver name"
                containerStyle={styles.nameInput}
                autoCapitalize="words"
              />
              <Button label="Save" onPress={handleSaveName} loading={savingName} size="sm" style={styles.saveBtn} />
            </View>
          )}
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>FRIEND CODE</Text>
            <View style={styles.codeInline}>
              <Text style={styles.codeValue}>{profile?.friendCode ?? '------'}</Text>
              <TouchableOpacity onPress={handleCopyFriendCode} style={styles.copyBtn}>
                <Text style={styles.copyIcon}>{copied ? '✅' : '📋'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>CAREER STATS</Text>
          <View style={styles.statsGrid}>
            <StatItem value={String(profile?.points ?? 0)} label="POINTS" accent={Colors.gold} />
            <StatItem value={String(profile?.totalSessions ?? 0)} label="RACES" accent={Colors.primary} />
            <StatItem value={String(profile?.totalFocusMinutes ?? 0)} label="FOCUS MIN" accent={Colors.shortBreakAccent} />
            <StatItem value={String(profile?.currentStreak ?? 0)} label="STREAK" accent={Colors.warning} />
          </View>
          <Button
            label="VIEW RACE HISTORY"
            onPress={() => router.push('/(app)/stats')}
            variant="secondary"
            size="md"
          />
        </Card>

        {/* Avatar selection — browsing is free, switching costs points */}
        <View>
          <Text style={styles.sectionTitle}>CHOOSE YOUR DRIVER</Text>
          <AvatarSelector
            selected={displayedAvatarId}
            onSelect={setPreviewAvatarId}
          />
          {isPreviewingDifferent && (
            <View style={styles.switchBanner}>
              <Text style={styles.switchBannerText} numberOfLines={2}>
                Switch to {DRIVERS[previewAvatarId!].name}? Costs {AVATAR_SWITCH_COST} pts
              </Text>
              <Button
                label="SWITCH"
                onPress={handleRequestSwitch}
                loading={savingAvatar}
                size="sm"
              />
            </View>
          )}
        </View>

        <Button label="PIT OUT (SIGN OUT)" onPress={confirmLogout} variant="danger" size="lg" />
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

function StatItem({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  f1Logo: { width: 60, height: 22 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 3 },
  showcaseCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  nameRow: { alignItems: 'center', justifyContent: 'center', width: '100%', gap: Spacing.sm, flexDirection: 'row' },
  nameInner: { maxWidth: '75%' },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  driverName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: '100%' },
  nameInput: { flex: 1 },
  saveBtn: { minWidth: 64 },
  codeRow: { alignItems: 'center', gap: 4 },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  codeValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 4 },
  codeInline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  copyBtn: { padding: 6, marginLeft: Spacing.sm },
  copyIcon: { fontSize: FontSize.lg },
  statsCard: { gap: Spacing.md },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  switchBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
});
