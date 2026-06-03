import React, { useEffect } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DriverId, DriverState, DRIVERS, DEFAULT_DRIVER } from '@/constants/drivers';

interface AvatarDisplayProps {
  avatarId?: DriverId | null;
  state?: DriverState;
  size?: number;
  style?: ViewStyle;
  animate?: boolean;
}

export function AvatarDisplay({
  avatarId,
  state = 'idle',
  size = 80,
  style,
  animate = true,
}: AvatarDisplayProps) {
  const driver = DRIVERS[avatarId ?? DEFAULT_DRIVER] ?? DRIVERS[DEFAULT_DRIVER];
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;
    scale.value = withSequence(
      withTiming(1.15, { duration: 120 }),
      withSpring(1, { damping: 8 })
    );
  }, [state, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image
          source={driver.assets[state]}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
