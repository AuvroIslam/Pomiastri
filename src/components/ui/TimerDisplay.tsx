import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { PomodoroPhase } from '@/types';
import { PHASE_LABELS, PHASE_LABEL_SHORT } from '@/constants/pomodoro';
import { formatSeconds } from '@/utils/time';

const PHASE_COLOR: Record<PomodoroPhase, string> = {
  focus: Colors.focusAccent,
  shortBreak: Colors.shortBreakAccent,
  longBreak: Colors.longBreakAccent,
};

const PHASE_LABEL = PHASE_LABELS;

interface TimerDisplayProps {
  seconds: number;
  phase: PomodoroPhase;
  isRunning: boolean;
}

export function TimerDisplay({ seconds, phase, isRunning }: TimerDisplayProps) {
  const color = PHASE_COLOR[phase];
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRunning) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isRunning]);

  return (
    <View style={styles.container}>
      <Text style={[styles.phaseLabel, { color }]}>{PHASE_LABEL[phase]}</Text>
      <Animated.View
        style={[
          styles.ring,
          { borderColor: color },
          { transform: [{ scale: pulse }] },
        ]}
      >
        <Text style={[styles.timerText, { color }]}>{formatSeconds(seconds)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md },
  phaseLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    letterSpacing: 3,
  },
  ring: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  timerText: {
    fontSize: FontSize.timer,
    fontWeight: FontWeight.black,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
});
