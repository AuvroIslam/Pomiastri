import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { updateAvatar, updateDisplayName } from '@/services/users';
import { logoutUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/session/ConfirmModal';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets, DriverId, DriverState } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';

const SHOWCASE_STATES: DriverState[] = ['idle', 'focus', 'happy', 'sad', 'car', 'helmet'];
const SHOWCASE_LABELS: Record<DriverState, string> = {
  idle: 'IDLE',
  focus: 'FOCUSED',
  happy: 'HAPPY',
  sad: 'SAD',
  car: 'CAR',
  helmet: 'HELMET',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function handleSelectAvatar(id: DriverId) {
    if (!user) return;
    setSavingAvatar(true);
    try {
      await updateAvatar(user.uid, id);
      await refreshProfile();
    } catch {
      Alert.alert('Error', 'Could not update avatar.');
    } finally {
      setSavingAvatar(false);
    }
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

      <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBar}>
          <AppLogo size={40} />
          <Text style={styles.title}>GARAGE</Text>
        </View>

        {/* Driver showcase — auto-cycles through all moods */}
        <Card elevated style={styles.showcaseCard}>
          <AvatarDisplay
            avatarId={profile?.avatarId}
            state={showcaseState}
            size={150}
            style={showcaseState === 'car' ? { width: 260 } : undefined}
          />
          <Text style={styles.stateLabel}>{SHOWCASE_LABELS[showcaseState]}</Text>
          {!editingName ? (
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{profile?.displayName ?? 'DRIVER'}</Text>
              <Button label="Edit" onPress={() => { setEditingName(true); setNewName(profile?.displayName ?? ''); }} variant="ghost" size="sm" />
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
            <Text style={styles.codeValue}>{profile?.friendCode ?? '------'}</Text>
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

        {/* Avatar selection */}
        <View>
          <Text style={styles.sectionTitle}>CHOOSE YOUR DRIVER</Text>
          {savingAvatar && <Text style={styles.savingText}>Saving...</Text>}
          <AvatarSelector
            selected={profile?.avatarId ?? 'charles'}
            onSelect={handleSelectAvatar}
          />
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
  stateLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  driverName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: '100%' },
  nameInput: { flex: 1 },
  saveBtn: { minWidth: 64 },
  codeRow: { alignItems: 'center', gap: 4 },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  codeValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 4 },
  statsCard: { gap: Spacing.md },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  savingText: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
});
