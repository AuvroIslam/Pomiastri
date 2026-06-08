import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useNotifications } from '@/hooks/useNotifications';
import { logoutUser } from '@/services/auth';
import { getActiveSessionForUser, rejoinSession } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { ConfirmModal } from '@/components/session/ConfirmModal';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';

import { Session } from '@/types';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { leaderboard } = useLeaderboard(3);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useNotifications(user?.uid);

  useEffect(() => {
    if (!user) return;
    getActiveSessionForUser(user.uid).then(setActiveSession);
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (user) getActiveSessionForUser(user.uid).then(setActiveSession);
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowExitModal(true);
        return true;
      });
      return () => sub.remove();
    }, [user?.uid])
  );

  async function handleRejoinPress() {
    if (!activeSession || !user) return;
    // If you'd previously been knocked out (grace-period timeout / abandon),
    // clear that flag and restore the race before walking back in.
    if ((activeSession.leftParticipants ?? []).includes(user.uid)) {
      await rejoinSession(activeSession.id, user.uid);
    }
    router.push(`/(app)/session/${activeSession.id}`);
  }

  function confirmLogout() {
    setShowLogoutModal(true);
  }



  return (
    <>
      {/* Exit App Modal */}
      <ConfirmModal
        visible={showExitModal}
        title="LEAVE THE PIT LANE?"
        message="Are you sure you want to exit the app?"
        cancelLabel="Stay"
        confirmLabel="Exit"
        confirmVariant="danger"
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => BackHandler.exitApp()}
      />

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
          <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>PIT OUT</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.driverCard} elevated>
          <View style={styles.driverRow}>
            <AvatarDisplay
              avatarId={profile?.avatarId}
              state={activeSession?.status === 'active' ? 'focus' : 'idle'}
              size={130}
              animate
            />
            <View style={styles.driverInfo}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.driverName}>
                {profile?.displayName ?? user?.displayName ?? 'DRIVER'}
              </Text>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsValue}>{profile?.points ?? 0}</Text>
                <Text style={styles.pointsLabel}> PTS</Text>
              </View>
            </View>
          </View>
          <View style={styles.codeStrip}>
            <Text style={styles.codeLabel}>TEAM CODE</Text>
            <Text style={styles.codeValue}>{profile?.friendCode ?? '------'}</Text>
          </View>
        </Card>

        {activeSession && (
          <TouchableOpacity
            style={styles.rejoinBanner}
            onPress={handleRejoinPress}
            activeOpacity={0.8}
          >
            <Image source={F1Assets.checkedFlag} style={styles.rejoinFlag} resizeMode="contain" />
            <View>
              <Text style={styles.rejoinTitle}>SESSION IN PROGRESS</Text>
              <Text style={styles.rejoinSub}>
                {(activeSession.leftParticipants ?? []).includes(user?.uid ?? '')
                  ? 'Tap to rejoin — you left this race'
                  : 'Tap to rejoin the race'}
              </Text>
            </View>
            <Text style={styles.rejoinArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Hide session creation when one is already in progress */}
        {!activeSession && (
          <View style={styles.ctaRow}>
            <Button
              label="CREATE GRAND PRIX"
              onPress={() => router.push('/(app)/create-session')}
              size="lg"
            />
            <Button
              label="JOIN THE GRID"
              onPress={() => router.push('/(app)/join-session')}
              variant="secondary"
              size="lg"
            />
            <Button
              label="PRACTICE SOLO"
              onPress={() => router.push({ pathname: '/(app)/create-session', params: { mode: 'solo' } })}
              variant="ghost"
              size="md"
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SEASON</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/stats')}>
              <Text style={styles.seeAll}>Race History ›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.statsRow}
            activeOpacity={0.8}
            onPress={() => router.push('/(app)/stats')}
          >
            <StatPill value={String(profile?.currentStreak ?? 0)} label="STREAK" />
            <StatPill value={String(profile?.totalFocusMinutes ?? 0)} label="MIN" />
            <StatPill value={String(profile?.totalSessions ?? 0)} label="RACES" />
          </TouchableOpacity>
        </View>

        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOP DRIVERS</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/leaderboard')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.uid}
                entry={entry}
                isCurrentUser={entry.uid === user?.uid}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function OnboardStep({ n, text }: { n: string; text: string }) {
  return (
    <View style={onboardStyles.step}>
      <View style={onboardStyles.badge}>
        <Text style={onboardStyles.badgeText}>{n}</Text>
      </View>
      <Text style={onboardStyles.stepText}>{text}</Text>
    </View>
  );
}

const onboardStyles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Colors.textOnPrimary, fontWeight: FontWeight.black, fontSize: FontSize.sm },
  stepText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.md },
});

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING,';
  if (h < 17) return 'GOOD AFTERNOON,';
  return 'GOOD EVENING,';
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  f1Logo: { width: 80, height: 28 },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  logoutText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold, letterSpacing: 1 },
  onboardCard: { gap: 2, paddingVertical: Spacing.md },
  onboardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  driverCard: { padding: Spacing.md, gap: Spacing.md },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  driverInfo: { flex: 1, gap: 4 },
  greeting: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  driverName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 1 },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  pointsValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.gold },
  pointsLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },
  codeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  codeValue: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.primary, letterSpacing: 4 },
  rejoinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rejoinFlag: { width: 28, height: 28 },
  rejoinTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.textOnPrimary, letterSpacing: 1 },
  rejoinSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  rejoinArrow: { marginLeft: 'auto', fontSize: 24, color: Colors.textOnPrimary },
  ctaRow: { gap: Spacing.sm, marginTop: Spacing.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.textSecondary, letterSpacing: 2 },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
