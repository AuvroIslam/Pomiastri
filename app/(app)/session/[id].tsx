import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useTimer } from '@/hooks/useTimer';
import { useAppState } from '@/hooks/useAppState';
import {
  startSession,
  pauseSession,
  resumeSession,
  advancePhase,
  endSession,
  markSessionBroken,
  cancelSession,
  saveSessionHistory,
} from '@/services/sessions';
import { recordSessionCompletion } from '@/services/users';
import { TimerDisplay } from '@/components/ui/TimerDisplay';
import { Button } from '@/components/ui/Button';
import { PartnerStatus } from '@/components/session/PartnerStatus';
import { PhaseIndicator } from '@/components/session/PhaseIndicator';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { getNextPhase, getPhaseDuration } from '@/constants/pomodoro';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, loading } = useSession(id ?? null);
  const displaySeconds = useTimer(session);
  const phaseAdvancedRef = useRef(false);

  const isHost = session?.hostId === user?.uid;
  const isParticipant = session?.participantId === user?.uid;
  const partnerName = isHost ? session?.participantDisplayName : session?.hostDisplayName;
  const partnerConnected = isHost ? !!session?.participantId : !!session?.hostId;
  const myFocusBroken = isHost ? session?.hostFocusBroken : session?.participantFocusBroken;
  const partnerFocusBroken = isHost ? session?.participantFocusBroken : session?.hostFocusBroken;

  // ─── Auto-advance phase when timer hits 0 ─────────────────���──────────────────
  useEffect(() => {
    if (!session || !isHost) return;
    if (session.status !== 'active') return;
    if (displaySeconds > 0) {
      phaseAdvancedRef.current = false;
      return;
    }
    if (phaseAdvancedRef.current) return;

    phaseAdvancedRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { timerState, settings } = session;
    const newPhaseCount =
      timerState.phase === 'focus'
        ? timerState.phaseCount + 1
        : timerState.phaseCount;
    const nextPhase = getNextPhase(timerState.phase, newPhaseCount);
    const nextDuration = getPhaseDuration(nextPhase, settings);

    advancePhase(session.id, nextPhase, nextDuration, newPhaseCount);
  }, [displaySeconds, session?.status, session?.timerState.phase, isHost]);

  // ─── BackHandler — warn user for any ongoing session state ───────────────
  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'cancelled') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      showLeaveAlert();
      return true;
    });
    return () => sub.remove();
  }, [session?.status]);

  // ─── AppState — detect background ────────────────────────────��───────────────
  const handleBackground = useCallback(() => {
    if (!session || !user) return;
    if (session.status !== 'active') return;
    markSessionBroken(session.id, isHost);
  }, [session?.id, session?.status, isHost, user?.uid]);

  useAppState(handleBackground);

  // ─── Session complete/cancelled routing ───────────────────────────��───────────
  useEffect(() => {
    if (!session || !user) return;
    if (session.status === 'completed') {
      handleSessionEnd(false);
    } else if (session.status === 'cancelled') {
      router.replace('/(app)');
    }
  }, [session?.status]);

  async function handleSessionEnd(broken: boolean) {
    if (!session || !user) return;
    try {
      await saveSessionHistory(session, user.uid);
      if (session.timerState.phaseCount > 0) {
        const focusMin = Math.round(
          (session.timerState.phaseCount * session.settings.focusDuration) / 60
        );
        await recordSessionCompletion(user.uid, focusMin);
      }
    } finally {
      router.replace('/(app)');
    }
  }

  function showLeaveAlert() {
    Alert.alert(
      'Leave Session?',
      session?.status === 'active'
        ? 'Leaving will mark your focus as broken for both you and your partner.'
        : 'Are you sure you want to leave this session?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!session || !user) return;
            if (session.status === 'active') {
              await markSessionBroken(session.id, isHost);
            } else if (session.status === 'waiting' && isHost) {
              await cancelSession(session.id);
            }
            router.replace('/(app)');
          },
        },
      ]
    );
  }

  // ─── Control handlers ─────────────────────────────���───────────────────────────

  async function handleStart() {
    if (!session || !isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startSession(session.id, session.settings);
  }

  async function handlePause() {
    if (!session || !isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pauseSession(session.id, displaySeconds);
  }

  async function handleResume() {
    if (!session || !isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await resumeSession(session.id, displaySeconds);
  }

  async function handleEnd() {
    if (!session || !isHost) return;
    Alert.alert(
      'End Session',
      'Mark this session as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          onPress: () => endSession(session.id),
        },
      ]
    );
  }

  async function handleCopyCode() {
    if (!session?.joinCode) return;
    await Clipboard.setStringAsync(session.joinCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ─── Loading / not found ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Session not found.</Text>
          <Button label="Go Home" onPress={() => router.replace('/(app)')} />
        </View>
      </SafeAreaView>
    );
  }

  const { timerState, status, joinCode } = session;
  const isActive = status === 'active';
  const isPaused = status === 'paused';
  const isWaiting = status === 'waiting';

  // ─── Broken state overlay ─────────────────��──────────────────────────────���────

  if (session.isBroken) {
    return (
      <SafeAreaView style={[styles.safe, styles.brokenBg]}>
        <View style={styles.brokenContainer}>
          <Text style={styles.brokenEmoji}>💔</Text>
          <Text style={styles.brokenTitle}>Focus Broken</Text>
          <Text style={styles.brokenSub}>
            {myFocusBroken
              ? 'You left the app during the session.'
              : `${partnerName ?? 'Your partner'} left the session.`}
          </Text>
          <View style={styles.brokenMeta}>
            <Text style={styles.brokenMetaText}>
              {timerState.phaseCount} phase{timerState.phaseCount !== 1 ? 's' : ''} completed
            </Text>
          </View>
          <Button
            label="Go Home"
            onPress={() => handleSessionEnd(true)}
            style={styles.brokenBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main session UI ─────────────────────────────��────────────────────────���───

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={showLeaveAlert}>
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
          <PhaseIndicator phaseCount={timerState.phaseCount} />
        </View>

        {/* Join code (while waiting) */}
        {isWaiting && (
          <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeLabel}>Join Code</Text>
              <Text style={styles.codeValue}>{joinCode}</Text>
              <Text style={styles.codeTap}>Tap to copy</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Partner status */}
        <PartnerStatus
          displayName={partnerName ?? null}
          isConnected={partnerConnected}
          focusBroken={!!partnerFocusBroken}
        />

        {/* Timer */}
        <View style={styles.timerWrapper}>
          {isWaiting ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingEmoji}>⏳</Text>
              <Text style={styles.waitingText}>
                {partnerConnected
                  ? 'Partner joined! Ready to start.'
                  : 'Waiting for partner to join...'}
              </Text>
            </View>
          ) : (
            <TimerDisplay
              seconds={displaySeconds}
              phase={timerState.phase}
              isRunning={timerState.isRunning}
            />
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {isHost ? (
            <>
              {isWaiting && partnerConnected && (
                <Button label="Start Session" onPress={handleStart} size="lg" />
              )}
              {isWaiting && !partnerConnected && (
                <Button
                  label="Waiting for partner..."
                  onPress={() => {}}
                  size="lg"
                  disabled
                />
              )}
              {isActive && (
                <View style={styles.controlRow}>
                  <Button
                    label="Pause"
                    onPress={handlePause}
                    variant="secondary"
                    size="md"
                    style={styles.controlBtn}
                  />
                  <Button
                    label="End Session"
                    onPress={handleEnd}
                    variant="ghost"
                    size="md"
                    style={styles.controlBtn}
                  />
                </View>
              )}
              {isPaused && (
                <View style={styles.controlRow}>
                  <Button
                    label="Resume"
                    onPress={handleResume}
                    size="md"
                    style={styles.controlBtn}
                  />
                  <Button
                    label="End Session"
                    onPress={handleEnd}
                    variant="ghost"
                    size="md"
                    style={styles.controlBtn}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.guestInfo}>
              <Text style={styles.guestText}>
                {isWaiting
                  ? 'Waiting for the host to start...'
                  : isActive
                  ? 'Session in progress'
                  : isPaused
                  ? 'Session paused by host'
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  loadingText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },

  // Join code
  codeRow: { alignItems: 'center' },
  codeBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 2,
  },
  codeLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    letterSpacing: 8,
  },
  codeTap: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)' },

  // Timer
  timerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingContainer: { alignItems: 'center', gap: Spacing.md },
  waitingEmoji: { fontSize: 64 },
  waitingText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Controls
  controls: { gap: Spacing.sm },
  controlRow: { flexDirection: 'row', gap: Spacing.sm },
  controlBtn: { flex: 1 },
  guestInfo: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  guestText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Broken state
  brokenBg: { backgroundColor: Colors.brokenBg },
  brokenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  brokenEmoji: { fontSize: 72 },
  brokenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.brokenAccent,
  },
  brokenSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  brokenMeta: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  brokenMetaText: { fontSize: FontSize.md, color: Colors.textSecondary },
  brokenBtn: { marginTop: Spacing.md, width: '100%' },
});
