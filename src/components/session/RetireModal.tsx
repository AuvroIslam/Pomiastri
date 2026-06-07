import React, { useState } from 'react';
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
   * no one left to hand the race to, so quitting now ends it for everyone. */
  racingAlone: boolean;
  /** Solo practice with stakes switched off — nothing to win or lose, so the
   * "quit now and take the hit" choice doesn't apply. */
  stakesOff: boolean;
  penaltyPoints: number;
  onStay: () => void;
  /** normalRetire = go home, session stays alive (can rejoin via banner, no penalty) */
  onNormalRetire: () => void;
  /** permanentRetire = leaveSession() called now → penalty applied → recorded as left */
  onPermanentRetire: () => void;
}

export function RetireModal({
  visible,
  isActiveSession,
  racingAlone,
  stakesOff,
  penaltyPoints,
  onStay,
  onNormalRetire,
  onPermanentRetire,
}: RetireModalProps) {
  const [permanent, setPermanent] = useState(false);

  function handleRetire() {
    const wasPermanent = permanent;
    setPermanent(false); // reset for next open
    if (wasPermanent) {
      onPermanentRetire();
    } else {
      onNormalRetire();
    }
  }

  function handleStay() {
    setPermanent(false);
    onStay();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleStay}
    >
      <Pressable style={styles.backdrop} onPress={handleStay}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Title */}
          <Text style={styles.title}>RETIRE FROM RACE?</Text>

          {isActiveSession ? (
            <Text style={styles.body}>
              {stakesOff
                ? 'Practice mode keeps no score — step away and pick the lap back up anytime from the SESSION IN PROGRESS banner.'
                : (
                  <>
                    You can go home and rejoin this race from the{' '}
                    <Text style={styles.bold}>SESSION IN PROGRESS</Text> banner on the home screen.
                  </>
                )}
            </Text>
          ) : (
            <Text style={styles.body}>
              Are you sure you want to leave this session?
            </Text>
          )}

          {/* Quit-now checkbox: only meaningful when there's something at stake */}
          {isActiveSession && !stakesOff && (
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setPermanent((p) => !p)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, permanent && styles.checkboxChecked]}>
                {permanent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkLabel}>
                <Text style={styles.checkTitle}>Quit now ({penaltyPoints} pts)</Text>
                <Text style={styles.checkSub}>
                  {racingAlone
                    ? 'This ends the race for good — there\'s no rejoining after this.'
                    : 'Your teammate keeps racing without you. You can still climb back in later, but it costs you now.'}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.stayBtn} onPress={handleStay}>
              <Text style={styles.stayText}>STAY IN RACE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retireBtn, permanent && styles.retireBtnRed]}
              onPress={handleRetire}
            >
              <Text style={styles.retireText}>
                {permanent ? `ABANDON RACE` : 'RETIRE'}
              </Text>
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold },
  checkLabel: { flex: 1, gap: 2 },
  checkTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  checkSub: { fontSize: FontSize.xs, color: Colors.textMuted },
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
