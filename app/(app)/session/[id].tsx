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
import { useAppSwitchPenalty } from '@/hooks/useAppSwitchPenalty';
import {
  startSession, pauseSession, resumeSession,
  advancePhase, endSession, leaveSession, recordAppSwitch,
  cancelSession, leaveWaitingSession, saveSessionHistory, phasePointsFor,
  POINTS_FULL_COMPLETE, POINTS_PARTNER_LEFT_BONUS,
  POINTS_SOLO_BONUS, POINTS_LEAVE_PENALTY, POINTS_SWITCH_PENALTY, MAX_SWITCHES,
} from '@/services/sessions';
import { recordSessionCompletion } from '@/services/users';
import { TimerDisplay } from '@/components/ui/TimerDisplay';
import { Button } from '@/components/ui/Button';
import { PhaseIndicator } from '@/components/session/PhaseIndicator';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { GridStartLights, LightStage } from '@/components/ui/GridStartLights';
import { CheckeredFlag } from '@/components/ui/CheckeredFlag';
import { PointsToast } from '@/components/ui/PointsToast';
import { NoticeToast } from '@/components/ui/NoticeToast';
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
  const [sessionNotice, setSessionNotice] = useState<{ message: string; tone: 'neutral' | 'warning' | 'success' } | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const prevPhaseCountRef = useRef<number>(0);
  const prevPartnerLeftRef = useRef<boolean | null>(null);
  const prevPartnerSwitchRef = useRef<number | null>(null);
  const exitedRef = useRef(false);

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
  const partnerSwitchCount = isHost ? (session?.participantSwitchCount ?? 0) : (session?.hostSwitchCount ?? 0);
  const partnerHasLeft = session
    ? (session.leftParticipants ?? []).includes(isHost ? (session.participantId ?? '') : session.hostId)
    : false;
  const iHaveLeft = session ? (session.leftParticipants ?? []).includes(user?.uid ?? '') : false;
  const hostHasLeft = session ? (session.leftParticipants ?? []).includes(session.hostId) : false;
  // Race controls (start/pause/resume/finish) normally belong to the host. But
  // if the host abandons a duo race, the remaining driver inherits them — they
  // would otherwise be stuck staring at a frozen timer with no way to finish.
  const amInControl = !iHaveLeft && (isHost || hostHasLeft);
  // True solo practice, or a duo race your partner has abandoned — either way
  // you're the only one left, so "RETIRE" doesn't fit; it's just "FINISH".
  const racingAlone = isSolo || session?.status === 'solo';

  // Solo practice can opt out of stakes entirely — no gain, no loss.
  const stakesOff = isSolo && session?.stakesEnabled === false;

  // Points derived from Firestore — same value for both users. Solo earns less.
  const phasePts = stakesOff ? 0 : phasePointsFor(session?.mode ?? 'duo');
  const sessionPhasePoints = (session?.timerState.phaseCount ?? 0) * phasePts;

  function completionBonus(): number {
    if (!session || session.status !== 'completed') return 0;
    if (isSolo) return stakesOff ? 0 : POINTS_SOLO_BONUS;
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
    // 'solo' inherits whatever run state the race was in when the other driver
    // left — if they bailed mid-pause, the timer is frozen, not focusing.
    if (session.status === 'paused' || (session.status === 'solo' && !session.timerState.isRunning)) return 'idle';
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
    if (session.status === 'paused' || (session.status === 'solo' && !session.timerState.isRunning)) return 'idle';
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
        // Practice mode (stakes off) still gets the completion feel — just no "+0 PTS" toast.
        if (phasePts > 0) setPointsToast(phasePts);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [session?.timerState.phaseCount, session?.timerState.phase]);

  // ─── Auto-advance phase when timer hits 0 ─────────────────────────────────────
  // Normally the host drives this. But once a duo session goes 'solo' (partner
  // left), whoever is STILL HERE has to drive it — which might be the guest, not
  // the host. Without this, a session abandoned by the host would freeze at 0:00
  // forever for the remaining driver.
  const amTimerDriver = (isSolo || session?.status === 'solo') ? !iHaveLeft : isHost;

  useEffect(() => {
    if (!session || !amTimerDriver) return;
    if (session.status !== 'active' && session.status !== 'solo') return;
    if (displaySeconds > 0) { phaseAdvancedRef.current = false; return; }
    if (phaseAdvancedRef.current) return;
    phaseAdvancedRef.current = true;

    const { timerState, settings } = session;
    const newCount = timerState.phase === 'focus' ? timerState.phaseCount + 1 : timerState.phaseCount;
    const nextPhase = getNextPhase(timerState.phase, newCount);
    advancePhase(session.id, nextPhase, getPhaseDuration(nextPhase, settings), newCount);
  }, [displaySeconds, session?.status, session?.timerState.phase, amTimerDriver]);

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

  // ─── App-switch strikes: every background during a focus phase costs points;
  // the 3rd is an automatic DNF. Practice mode (stakes off) is exempt. ──────────
  const handleAppSwitch = useCallback(async () => {
    if (!session || !user) return;
    const { count, dnf } = await recordAppSwitch(session.id, user.uid, isHost);
    if (dnf) {
      setPointsToast(POINTS_LEAVE_PENALTY);      // -20, auto-DNF
    } else if (count > 0) {
      setPointsToast(POINTS_SWITCH_PENALTY);     // -5 strike
    }
  }, [session?.id, user?.uid, isHost]);

  useAppSwitchPenalty(
    session?.status === 'active' &&
      session?.timerState.phase === 'focus' &&
      !stakesOff,
    handleAppSwitch
  );

  // ─── Feedback when your teammate leaves or comes back ───────────────────────
  // Skip the very first observation (it's just establishing a baseline on
  // mount/load) — only react to actual transitions from here on.
  useEffect(() => {
    if (!session || isSolo) { prevPartnerLeftRef.current = partnerHasLeft; return; }
    const was = prevPartnerLeftRef.current;
    if (was !== null && was !== partnerHasLeft) {
      if (partnerHasLeft) {
        setSessionNotice({ message: `${partnerName ?? 'Your teammate'} LEFT THE RACE — you can finish solo`, tone: 'warning' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setSessionNotice({ message: `${partnerName ?? 'Your teammate'} IS BACK ON TRACK!`, tone: 'success' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    prevPartnerLeftRef.current = partnerHasLeft;
  }, [session?.id, partnerHasLeft, isSolo, partnerName]);

  // ─── Feedback when your teammate switches away (app-switch strike) ───────────
  // Watches the partner's switch counter; each increment is a fresh strike.
  useEffect(() => {
    if (!session || isSolo) { prevPartnerSwitchRef.current = partnerSwitchCount; return; }
    const was = prevPartnerSwitchRef.current;
    // The 3rd strike is a DNF — let the "LEFT THE RACE" toast carry that one so
    // the two don't clobber each other. Only warn on the non-fatal strikes.
    if (was !== null && partnerSwitchCount > was && partnerSwitchCount < MAX_SWITCHES) {
      setSessionNotice({
        message: `${partnerName ?? 'Your teammate'} SWITCHED AWAY — STRIKE ${partnerSwitchCount}/${MAX_SWITCHES}`,
        tone: 'warning',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevPartnerSwitchRef.current = partnerSwitchCount;
  }, [session?.id, partnerSwitchCount, isSolo, partnerName]);

  // ─── Auto-exit on DNF: leaving is permanent now. The moment I'm marked as
  // having left — whether by tapping LEAVE or by a 3rd app-switch strike fired
  // while I was backgrounded — send me home. ───────────────────────────────────
  useEffect(() => {
    if (!session || !user || !iHaveLeft || exitedRef.current) return;
    exitedRef.current = true;
    router.replace('/(app)');
  }, [session?.id, user?.uid, iHaveLeft]);

  // ─── Controls ────────────────────────────────────────────────────────────────
  async function handleStart() {
    if (!session || !amInControl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLightStage('go');
    const sessionId = session.id;
    const settings = session.settings;
    // Delay startSession so the green light (1200ms hold) can show fully
    // before Firestore status change causes a re-render
    setTimeout(() => startSession(sessionId, settings), 1400);
  }

  async function handlePause() {
    if (!session || !amInControl) return;
    await pauseSession(session.id, displaySeconds);
  }

  async function handleResume() {
    if (!session || !amInControl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resumeSession(session.id, displaySeconds);
  }

  async function handleEnd() {
    if (!session || !amInControl) return;
    Alert.alert(
      'Finish Race?',
      racingAlone ? 'End your lap and bank your points?' : 'This will end the session for both drivers.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Finish', onPress: () => endSession(session.id) },
      ]
    );
  }

  // A race that hasn't started yet has nothing at stake — just unwind cleanly:
  // the host scraps it, a guest frees up their seat. No penalty either way.
  async function leaveBeforeStart() {
    if (!session || !user) return;
    if (isHost) {
      await cancelSession(session.id);
    } else {
      await leaveWaitingSession(session.id, user.uid);
    }
  }

  // Single leave action. Leaving is permanent now (DNF):
  //  • Not started yet → just unwind cleanly, no penalty.
  //  • Only driver left (solo / partner already gone) → "leaving" == finishing,
  //    so bank the lap via endSession (checkered-flag flow routes home).
  //  • Racing with a partner → DNF: take the -20, teammate continues solo. The
  //    auto-exit effect sends me home once the leave is recorded.
  async function handleLeaveRace() {
    if (!session || !user) return;
    setShowRetireModal(false);
    if (session.status === 'waiting') {
      await leaveBeforeStart();
      router.replace('/(app)');
      return;
    }
    if (racingAlone) {
      await endSession(session.id);
      return;
    }
    const { penaltyApplied } = await leaveSession(session.id, user.uid, isHost);
    if (penaltyApplied) setPointsToast(POINTS_LEAVE_PENALTY);
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
  // 'solo' just means "down to one driver" — it inherits whatever run state the
  // race was in when the other person left. If they bailed mid-pause, the timer
  // is still frozen and the remaining driver needs the Resume control, not Pause.
  const isActive = status === 'active' || (status === 'solo' && timerState.isRunning);
  const isPaused = status === 'paused' || (status === 'solo' && !timerState.isRunning);
  const isWaiting = status === 'waiting';
  const myState = getMyState();
  const partnerState = getPartnerState();

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Retire modal ── */}
      <RetireModal
        visible={showRetireModal}
        isActiveSession={['active', 'paused', 'solo'].includes(session?.status ?? '')}
        racingAlone={racingAlone}
        stakesOff={stakesOff}
        penaltyPoints={POINTS_LEAVE_PENALTY}
        onStay={() => setShowRetireModal(false)}
        onLeave={handleLeaveRace}
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
      {sessionNotice && (
        <NoticeToast
          message={sessionNotice.message}
          tone={sessionNotice.tone}
          onDone={() => setSessionNotice(null)}
        />
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
              {stakesOff
                ? 'PRACTICE LAP — NO POINTS AT STAKE'
                : `+${sessionPhasePoints} ${isSolo ? 'PRACTICE' : 'CHAMPIONSHIP'} PTS THIS RACE`}
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
          {amInControl ? (
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
                  <Button label={racingAlone ? 'FINISH' : 'RETIRE'} onPress={handleEnd} variant="ghost" size="md" style={styles.halfBtn} />
                </View>
              )}
              {isPaused && (
                <View style={styles.controlRow}>
                  <Button label="GREEN FLAG" onPress={handleResume} size="md" style={styles.halfBtn} />
                  <Button label={racingAlone ? 'FINISH' : 'RETIRE'} onPress={handleEnd} variant="ghost" size="md" style={styles.halfBtn} />
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
