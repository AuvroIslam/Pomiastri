import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { RetireModal } from '@/components/session/RetireModal';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useTimer } from '@/hooks/useTimer';
import { useGracePeriod } from '@/hooks/useGracePeriod';
import {
  startSession, pauseSession, resumeSession,
  advancePhase, endSession, leaveSession,
  cancelSession, saveSessionHistory, phasePointsFor,
  POINTS_FULL_COMPLETE, POINTS_PARTNER_LEFT_BONUS,
  POINTS_SOLO_BONUS, POINTS_LEAVE_PENALTY,
} from '@/services/sessions';
import { recordSessionCompletion } from '@/services/users';
import { TimerDisplay } from '@/components/ui/TimerDisplay';
import { Button } from '@/components/ui/Button';
import { PhaseIndicator } from '@/components/session/PhaseIndicator';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { GridStartLights, LightStage } from '@/components/ui/GridStartLights';
import { CheckeredFlag } from '@/components/ui/CheckeredFlag';
import { PointsToast } from '@/components/ui/PointsToast';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets, DriverState } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';
import { getNextPhase, getPhaseDuration, PHASE_LABELS } from '@/constants/pomodoro';
import { PomodoroPhase } from '@/types';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { session, loading } = useSession(id ?? null);
  const displaySeconds = useTimer(session);
  const phaseAdvancedRef = useRef(false);

  const [lightStage, setLightStage] = useState<LightStage>('empty');
  const [showCheckeredFlag, setShowCheckeredFlag] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [pointsToast, setPointsToast] = useState<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevPhaseCountRef = useRef<number>(0);

  // Primary check: mode field. Fallback: if no participant slot and we're the
  // only one here (mode was not saved on very old sessions), treat as solo.
  const isSolo =
    session?.mode === 'solo' ||
    (session?.mode == null && !session?.participantId && session?.hostId === user?.uid);
  const isHost = session?.hostId === user?.uid;
  const partnerName = isHost ? session?.participantDisplayName : session?.hostDisplayName;
  const partnerAvatarId = isHost ? session?.participantAvatarId : session?.hostAvatarId;
  const partnerConnected = isHost ? !!session?.participantId : !!session?.hostId;
  const myFocusBroken = isHost ? session?.hostFocusBroken : session?.participantFocusBroken;
  const partnerFocusBroken = isHost ? session?.participantFocusBroken : session?.hostFocusBroken;
  const partnerHasLeft = session
    ? (session.leftParticipants ?? []).includes(isHost ? (session.participantId ?? '') : session.hostId)
    : false;
  const iHaveLeft = session ? (session.leftParticipants ?? []).includes(user?.uid ?? '') : false;

  // Points derived from Firestore — same value for both users. Solo earns less.
  const phasePts = phasePointsFor(session?.mode ?? 'duo');
  const sessionPhasePoints = (session?.timerState.phaseCount ?? 0) * phasePts;

  function completionBonus(): number {
    if (!session || session.status !== 'completed') return 0;
    if (isSolo) return POINTS_SOLO_BONUS;
    return (session.leftParticipants?.length ?? 0) > 0
      ? POINTS_PARTNER_LEFT_BONUS
      : POINTS_FULL_COMPLETE;
  }

  // ─── My avatar state — changes based on what I'm doing ──────────────────────
  function getMyState(): DriverState {
    if (iHaveLeft || myFocusBroken) return 'sad';
    if (!session) return 'idle';
    if (session.status === 'completed') return 'happy';
    if (session.status === 'waiting') return 'idle';
    if (session.timerState.phase === 'focus' && session.timerState.isRunning) return 'focus';
    if (session.timerState.phase !== 'focus') return 'happy'; // break time
    if (session.status === 'paused') return 'idle';
    return 'focus';
  }

  // ─── Partner avatar state — mirrors their situation ─────────────────────────
  function getPartnerState(): DriverState {
    if (partnerHasLeft || partnerFocusBroken) return 'sad';
    if (!session || !partnerConnected) return 'idle';
    if (session.status === 'completed') return 'happy';
    if (session.status === 'waiting') return 'idle';
    if (session.timerState.phase === 'focus' && session.timerState.isRunning) return 'focus';
    if (session.timerState.phase !== 'focus') return 'happy';
    if (session.status === 'paused') return 'idle';
    return 'focus';
  }

  // ─── Start lights stage driven by session state ──────────────────────────────
  useEffect(() => {
    if (!session) return;
    const prev = prevStatusRef.current;
    const curr = session.status;

    if (curr === 'waiting') {
      // Solo: animate lights 0→4 just like duo (gives user time to see them build up)
      setLightStage(isSolo ? 'building' : session.participantId ? 'building' : 'empty');
    } else if (prev === 'waiting' && (curr === 'active' || curr === 'solo')) {
      setLightStage('go');
    } else if (curr === 'active' || curr === 'solo' || curr === 'paused') {
      setLightStage('racing');
    }

    prevStatusRef.current = curr;
  }, [session?.status, session?.participantId]);

  // Partner joined — advance lights to "building" (lights 1→4)
  useEffect(() => {
    if (!session) return;
    if (session.status === 'waiting' && session.participantId) {
      setLightStage('building');
    }
  }, [session?.participantId]);

  // ─── Session complete / cancelled routing ────────────────────────────────────
  useEffect(() => {
    if (!session || !user) return;
    if (session.status === 'completed' && prevStatusRef.current !== 'completed') {
      setShowCheckeredFlag(true);
    } else if (session.status === 'cancelled') {
      router.replace('/(app)');
    }
  }, [session?.status]);

  // ─── Haptic + toast for BOTH users when a focus phase completes ──────────────
  useEffect(() => {
    if (!session) return;
    const count = session.timerState.phaseCount;
    if (count > prevPhaseCountRef.current) {
      prevPhaseCountRef.current = count;
      if (session.timerState.phase !== 'focus') {
        setPointsToast(phasePts);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [session?.timerState.phaseCount, session?.timerState.phase]);

  // ─── Host: auto-advance phase when timer hits 0 ───────────────────────────────
  useEffect(() => {
    if (!session || !isHost) return;
    if (session.status !== 'active') return;
    if (displaySeconds > 0) { phaseAdvancedRef.current = false; return; }
    if (phaseAdvancedRef.current) return;
    phaseAdvancedRef.current = true;

    const { timerState, settings } = session;
    const newCount = timerState.phase === 'focus' ? timerState.phaseCount + 1 : timerState.phaseCount;
    const nextPhase = getNextPhase(timerState.phase, newCount);
    advancePhase(session.id, nextPhase, getPhaseDuration(nextPhase, settings), newCount);
  }, [displaySeconds, session?.status, session?.timerState.phase, isHost]);

  // ─── Session end handler ─────────────────────────────────────────────────────
  async function handleSessionEnd() {
    if (!session || !user) return;
    const total = sessionPhasePoints + completionBonus();
    try {
      await saveSessionHistory(session, user.uid, total);
      if (session.timerState.phaseCount > 0) {
        const focusMin = Math.round((session.timerState.phaseCount * session.settings.focusDuration) / 60);
        await recordSessionCompletion(user.uid, focusMin, total);
      }
    } finally {
      router.replace('/(app)');
    }
  }

  // ─── Back handler ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'cancelled') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setShowRetireModal(true); return true; });
    return () => sub.remove();
  }, [session?.status]);

  // ─── Grace period: 10s background → leave ────────────────────────────────────
  const handleGraceExpired = useCallback(() => {
    if (!session || !user) return;
    if (session.status !== 'active') return;
    leaveSession(session.id, user.uid, isHost);
    setPointsToast(POINTS_LEAVE_PENALTY);
  }, [session?.id, session?.status, isHost, user?.uid]);

  useGracePeriod(session?.status === 'active', handleGraceExpired);

  // ─── Controls ────────────────────────────────────────────────────────────────
  async function handleStart() {
    if (!session || !isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLightStage('go');
    const sessionId = session.id;
    const settings = session.settings;
    // Delay startSession so the green light (1200ms hold) can show fully
    // before Firestore status change causes a re-render
    setTimeout(() => startSession(sessionId, settings), 1400);
  }

  async function handlePause() {
    if (!session || !isHost) return;
    await pauseSession(session.id, displaySeconds);
  }

  async function handleResume() {
    if (!session || !isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resumeSession(session.id, displaySeconds);
  }

  async function handleEnd() {
    if (!session || !isHost) return;
    Alert.alert(
      'Finish Race?',
      isSolo ? 'End your solo practice and bank your points?' : 'This will end the session for both drivers.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Finish', onPress: () => endSession(session.id) },
      ]
    );
  }

  // Normal retire: just go home. Session stays alive — rejoin banner appears.
  async function handleNormalRetire() {
    if (!session || !user) return;
    if (session.status === 'waiting' && isHost) {
      await cancelSession(session.id);
    }
    router.replace('/(app)');
  }

  // Permanent retire: penalise points, added to leftParticipants, no rejoin.
  async function handlePermanentRetire() {
    if (!session || !user) return;
    if (session.status === 'waiting' && isHost) {
      await cancelSession(session.id);
    } else {
      await leaveSession(session.id, user.uid, isHost);
      setPointsToast(POINTS_LEAVE_PENALTY);
    }
    router.replace('/(app)');
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
          <Text style={styles.infoText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.infoText}>Session not found.</Text>
          <Button label="Return to Paddock" onPress={() => router.replace('/(app)')} />
        </View>
      </SafeAreaView>
    );
  }

  const { timerState, status, joinCode } = session;
  const isActive = status === 'active' || status === 'solo';
  const isPaused = status === 'paused';
  const isWaiting = status === 'waiting';
  const myState = getMyState();
  const partnerState = getPartnerState();

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Retire modal ── */}
      <RetireModal
        visible={showRetireModal}
        isActiveSession={['active', 'paused', 'solo'].includes(session?.status ?? '')}
        penaltyPoints={POINTS_LEAVE_PENALTY}
        onStay={() => setShowRetireModal(false)}
        onNormalRetire={handleNormalRetire}
        onPermanentRetire={handlePermanentRetire}
      />

      {/* Overlays */}
      {showCheckeredFlag && (
        <CheckeredFlag
          pointsEarned={sessionPhasePoints + completionBonus()}
          onDismiss={handleSessionEnd}
        />
      )}
      {pointsToast !== null && (
        <PointsToast delta={pointsToast} onDone={() => setPointsToast(null)} />
      )}

      <View style={styles.container}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <AppLogo size={40} />
          {(isActive || isPaused) && <PhaseIndicator phaseCount={timerState.phaseCount} />}
          <TouchableOpacity onPress={() => setShowRetireModal(true)} style={styles.retireBtn}>
            <Text style={styles.retireText}>RETIRE</Text>
          </TouchableOpacity>
        </View>

        {/* ── Start Lights: show during waiting AND during 'go' flash so green
             light isn't cut off when status flips to active ── */}
        {(isWaiting || lightStage === 'go') && (
          <View style={styles.lightsWrapper}>
            <GridStartLights
              stage={lightStage}
              onGoComplete={() => setLightStage('racing')}
            />
            <Text style={styles.lightsStatus}>
              {isSolo
                ? 'SOLO LAP — START WHEN READY'
                : !partnerConnected
                ? 'DRIVERS FORMING UP ON THE GRID...'
                : 'ALL DRIVERS READY — LIGHTS OUT!'}
            </Text>
          </View>
        )}

        {/* ── Points strip (active/paused) ── */}
        {(isActive || isPaused) && (
          <View style={styles.pointsStrip}>
            <Text style={styles.pointsStripText}>
              +{sessionPhasePoints} {isSolo ? 'PRACTICE' : 'CHAMPIONSHIP'} PTS THIS RACE
            </Text>
            <Text style={[styles.phaseTag, { color: timerState.phase === 'focus' ? Colors.focusAccent : Colors.shortBreakAccent }]}>
              {PHASE_LABELS[timerState.phase]}
            </Text>
          </View>
        )}

        {/* ── Driver avatars — the main visual ── */}
        {isSolo ? (
          <View style={styles.soloRow}>
            <AvatarDisplay
              avatarId={profile?.avatarId}
              state={myState}
              size={isWaiting ? 120 : 80}
              animate
            />
            <Text style={styles.driverLabel}>{profile?.displayName?.toUpperCase() ?? 'YOU'}</Text>
            <Text style={[styles.driverStatus, { color: myStateColor(myState) }]}>
              {myStateLabel(myState, iHaveLeft)}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.driversRow}>
              {/* My driver */}
              <View style={styles.driverCard}>
                <AvatarDisplay avatarId={profile?.avatarId} state={myState} size={isWaiting ? 90 : 72} animate />
                <Text style={styles.driverLabel}>YOU</Text>
                <Text style={[styles.driverStatus, { color: myStateColor(myState) }]}>
                  {myStateLabel(myState, iHaveLeft)}
                </Text>
              </View>

              {/* Teammate divider — partnership, not rivalry */}
              <View style={styles.vsDivider}>
                {isActive ? (
                  <Image source={F1Assets.checkedFlag} style={styles.vsFlag} resizeMode="contain" />
                ) : null}
                <Text style={styles.vsText}>&amp;</Text>
              </View>

              {/* Teammate */}
              <View style={styles.driverCard}>
                {partnerConnected ? (
                  <AvatarDisplay avatarId={partnerAvatarId} state={partnerState} size={isWaiting ? 90 : 72} animate />
                ) : (
                  <View style={[styles.emptySlot, { width: isWaiting ? 90 : 72, height: isWaiting ? 90 : 72 }]}>
                    <Text style={styles.emptySlotText}>?</Text>
                  </View>
                )}
                <Text style={styles.driverLabel}>{partnerName?.toUpperCase() ?? 'WAITING'}</Text>
                <Text style={[styles.driverStatus, { color: partnerStateColor(partnerState, partnerConnected) }]}>
                  {partnerConnected ? partnerStateLabel(partnerState, partnerHasLeft) : 'NOT ON GRID'}
                </Text>
              </View>
            </View>
            {(isActive || isPaused) && (
              <Text style={styles.teammateCaption}>RACING TOGETHER</Text>
            )}
          </>
        )}

        {/* ── Join code (duo, waiting, no partner yet) ── */}
        {isWaiting && !partnerConnected && !isSolo && (
          <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} activeOpacity={0.7}>
            <Text style={styles.codeHint}>YOUR PIT PASS — TAP TO COPY</Text>
            <Text style={styles.codeValue}>{joinCode}</Text>
          </TouchableOpacity>
        )}

        {/* ── Timer (active / paused) ── */}
        {(isActive || isPaused) && (
          <View style={styles.timerWrapper}>
            <TimerDisplay
              seconds={displaySeconds}
              phase={timerState.phase}
              isRunning={timerState.isRunning}
            />
          </View>
        )}

        {/* ── Controls ── */}
        <View style={styles.controls}>
          {isHost ? (
            <>
              {isWaiting && (isSolo || partnerConnected) && (
                <Button
                  label={isSolo ? 'LIGHTS OUT — START SOLO LAP' : 'LIGHTS OUT — START RACE'}
                  onPress={handleStart}
                  size="lg"
                />
              )}
              {isWaiting && !isSolo && !partnerConnected && (
                <Button label="WAITING FOR DRIVER..." onPress={() => {}} size="lg" disabled />
              )}
              {isActive && (
                <View style={styles.controlRow}>
                  <Button label="YELLOW FLAG" onPress={handlePause} variant="secondary" size="md" style={styles.halfBtn} />
                  <Button label={isSolo ? 'FINISH' : 'RETIRE'} onPress={handleEnd} variant="ghost" size="md" style={styles.halfBtn} />
                </View>
              )}
              {isPaused && (
                <View style={styles.controlRow}>
                  <Button label="GREEN FLAG" onPress={handleResume} size="md" style={styles.halfBtn} />
                  <Button label={isSolo ? 'FINISH' : 'RETIRE'} onPress={handleEnd} variant="ghost" size="md" style={styles.halfBtn} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.guestBanner}>
              <Text style={styles.guestText}>
                {isWaiting && !partnerConnected ? 'Waiting for the host...'
                  : isWaiting ? 'Host will start the race'
                  : isActive ? 'Race in progress — stay focused!'
                  : isPaused ? 'YELLOW FLAG — Race paused by host'
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Avatar status helpers ───────────────────────────────────────────────────

function myStateColor(state: DriverState): string {
  if (state === 'focus') return Colors.focusAccent;
  if (state === 'happy') return Colors.success;
  if (state === 'sad') return Colors.error;
  return Colors.textMuted;
}

function partnerStateColor(state: DriverState, connected: boolean): string {
  if (!connected) return Colors.textMuted;
  return myStateColor(state);
}

function myStateLabel(state: DriverState, hasLeft: boolean): string {
  if (hasLeft) return 'RETIRED';
  if (state === 'focus') return 'ON RACE LAP';
  if (state === 'happy') return 'IN PIT STOP';
  if (state === 'sad') return 'FOCUS BROKEN';
  return 'ON GRID';
}

function partnerStateLabel(state: DriverState, hasLeft: boolean): string {
  if (hasLeft) return 'RETIRED';
  if (state === 'focus') return 'ON RACE LAP';
  if (state === 'happy') return 'IN PIT STOP';
  if (state === 'sad') return 'FOCUS BROKEN';
  return 'READY';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  infoText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  f1Logo: { width: 60, height: 22 },
  retireBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  retireText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  // Start lights section
  lightsWrapper: { alignItems: 'center', gap: Spacing.sm },
  lightsStatus: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
    textAlign: 'center',
  },

  // Points strip
  pointsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pointsStripText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  phaseTag: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  // Drivers row — main visual
  driversRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  soloRow: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  teammateCaption: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginTop: -Spacing.xs,
  },
  driverCard: { alignItems: 'center', gap: Spacing.xs, flex: 1 },
  driverLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
  },
  driverStatus: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  emptySlot: {
    borderRadius: 999,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: { fontSize: FontSize.xxl, color: Colors.textMuted },

  // VS divider
  vsDivider: { alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm },
  vsFlag: { width: 20, height: 14 },
  vsText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 3,
  },

  // Join code
  codeBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 4,
  },
  codeHint: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
  codeValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 8,
  },

  // Timer
  timerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Controls
  controls: { gap: Spacing.sm },
  controlRow: { flexDirection: 'row', gap: Spacing.sm },
  halfBtn: { flex: 1 },
  guestBanner: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  guestText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
