import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

interface RetireModalProps {
  visible: boolean;
  isActiveSession: boolean;
  /** True solo, or a duo race where your teammate has already left — there's
   * no one left to hand the race to, so leaving just finishes your own lap. */
  racingAlone: boolean;
  /** Solo practice with stakes switched off — nothing to win or lose. */
  stakesOff: boolean;
  penaltyPoints: number;
  onStay: () => void;
  /** Permanent leave (DNF). For a duo race this costs `penaltyPoints` and hands
   *  the race to your teammate; racing alone it just finishes your lap. */
  onLeave: () => void;
}

export function RetireModal({
  visible,
  isActiveSession,
  racingAlone,
  stakesOff,
  penaltyPoints,
  onStay,
  onLeave,
}: RetireModalProps) {
  // Body copy + button label adapt to the situation, but there's only ever
  // ONE leave action — no hidden second path.
  let body: React.ReactNode;
  let leaveLabel: string;

  if (!isActiveSession) {
    body = 'Leave this session? Nothing has started yet, so there\'s no penalty.';
    leaveLabel = 'LEAVE';
  } else if (stakesOff) {
    body = 'Practice mode keeps no score — leaving costs you nothing.';
    leaveLabel = 'LEAVE';
  } else if (racingAlone) {
    body = 'End your lap and bank the points you\'ve earned so far?';
    leaveLabel = 'FINISH';
  } else {
    body = (
      <>
        Leaving now means you <Text style={styles.bold}>DNF</Text> and lose{' '}
        <Text style={styles.bold}>{Math.abs(penaltyPoints)} pts</Text>. Your
        teammate keeps racing without you — and you can&apos;t rejoin.
      </>
    );
    leaveLabel = 'LEAVE RACE';
  }

  const danger = isActiveSession && !stakesOff && !racingAlone;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStay}
    >
      <Pressable style={styles.backdrop} onPress={onStay}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>
            {racingAlone && isActiveSession ? 'FINISH RACE?' : 'LEAVE THE RACE?'}
          </Text>

          <Text style={styles.body}>{body}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.stayBtn} onPress={onStay}>
              <Text style={styles.stayText}>STAY IN RACE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retireBtn, danger && styles.retireBtnRed]}
              onPress={onLeave}
            >
              <Text style={styles.retireText}>{leaveLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  bold: { color: Colors.primary, fontWeight: FontWeight.bold },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  stayBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  stayText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  retireBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  retireBtnRed: { backgroundColor: Colors.primary },
  retireText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
});
