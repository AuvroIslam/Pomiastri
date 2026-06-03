import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface PointsToastProps {
  delta: number;
  onDone: () => void;
}

export function PointsToast({ delta, onDone }: PointsToastProps) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(-20, { damping: 10 });
    opacity.value = withTiming(1, { duration: 200 });

    // Fade out after 1.5s
    opacity.value = withDelay(1500, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) runOnJS(onDone)();
    }));
    translateY.value = withDelay(1500, withTiming(-60, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isPositive = delta > 0;

  return (
    <Animated.View style={[styles.toast, animStyle]}>
      <Text style={[styles.text, { color: isPositive ? Colors.success : Colors.primary }]}>
        {isPositive ? `+${delta}` : `${delta}`} PTS
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: 80,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 50,
  },
  text: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
});
