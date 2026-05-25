import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { PomodoroPhase } from '@/types';
import { PHASE_LABELS, PHASE_EMOJI } from '@/constants/pomodoro';
import { formatSeconds } from '@/utils/time';

const PHASE_COLOR: Record<PomodoroPhase, string> = {
  focus: Colors.focusAccent,
  shortBreak: Colors.shortBreakAccent,
  longBreak: Colors.longBreakAccent,
};

interface TimerDisplayProps {
  seconds: number;
  phase: PomodoroPhase;
  isRunning: boolean;
}

export function TimerDisplay({ seconds, phase, isRunning }: TimerDisplayProps) {
  const color = PHASE_COLOR[phase];

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.timerText, { color }]}>{formatSeconds(seconds)}</Text>
        <Text style={styles.phaseText}>
          {PHASE_EMOJI[phase]} {PHASE_LABELS[phase]}
        </Text>
      </View>
      {isRunning && (
        <View style={[styles.runningDot, { backgroundColor: color }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md },
  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  timerText: {
    fontSize: FontSize.timer,
    fontWeight: FontWeight.bold,
    letterSpacing: -2,
  },
  phaseText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
