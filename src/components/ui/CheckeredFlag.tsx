import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { Button } from './Button';
import { AnimatedFrames } from './AnimatedFrames';

interface CheckeredFlagProps {
  pointsEarned: number;
  onDismiss: () => void;
}

export function CheckeredFlag({ pointsEarned, onDismiss }: CheckeredFlagProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
        {/* Animated checkered flag waving — 16 frames at 12fps */}
        <AnimatedFrames
          frames={F1Assets.checkerFlagFrames}
          fps={12}
          loop
          style={styles.flagAnim}
        />
        <Text style={styles.title}>RACE COMPLETE</Text>
        <Text style={styles.subtitle}>You crossed the chequered flag!</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{pointsEarned} PTS</Text>
        </View>
        <Button label="Continue" onPress={onDismiss} size="lg" style={styles.btn} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  flagAnim: {
    width: 140,
    height: 100,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  pointsBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  pointsText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.textOnPrimary,
    letterSpacing: 1,
  },
  btn: { width: '100%', marginTop: Spacing.sm },
});
