import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { PomodoroPhase } from '@/types';
import { PHASE_LABELS } from '@/constants/pomodoro';
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
  const { height } = useWindowDimensions();
  const color = PHASE_COLOR[phase];
  const pulse = useRef(new Animated.Value(1)).current;

  // Responsive ring: smaller on compact phones
  const ringSize = height < 680 ? 180 : height < 760 ? 210 : 240;
  const fontSize = height < 680 ? 52 : height < 760 ? 60 : FontSize.timer;

  useEffect(() => {
    if (!isRunning) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isRunning]);

  return (
    <View style={styles.container}>
      <Text style={[styles.phaseLabel, { color }]}>{PHASE_LABELS[phase]}</Text>
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <Text style={[styles.timerText, { color, fontSize }]}>
          {formatSeconds(seconds)}
        </Text>
      </Animated.View>
      {isRunning && <View style={[styles.runningDot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm },
  phaseLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    letterSpacing: 3,
  },
  ring: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  timerText: {
    fontWeight: FontWeight.black,
    letterSpacing: -2,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
