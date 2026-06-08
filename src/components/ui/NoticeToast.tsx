import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface NoticeToastProps {
  message: string;
  tone?: 'neutral' | 'warning' | 'success';
  onDone: () => void;
}

const TONE_COLORS: Record<NonNullable<NoticeToastProps['tone']>, string> = {
  neutral: Colors.textPrimary,
  warning: Colors.primary,
  success: Colors.success,
};

/** Short-lived banner for session-level events (partner left / rejoined, etc). */
export function NoticeToast({ message, tone = 'neutral', onDone }: NoticeToastProps) {
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in + fade in
    translateY.value = withSpring(0, { damping: 12 });
    opacity.value = withTiming(1, { duration: 200 });

    // After 3500ms, slide out + fade out. Using setTimeout so the hide
    // animations don't cancel the show animations (Reanimated 3 cancels any
    // running animation when you reassign a shared value).
    const hideTimer = setTimeout(() => {
      translateY.value = withTiming(-40, { duration: 400 });
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }, 3500);

    return () => clearTimeout(hideTimer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, animStyle]}>
      <Text style={[styles.text, { color: TONE_COLORS[tone] }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    top: 16,
    maxWidth: '88%',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 60,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
