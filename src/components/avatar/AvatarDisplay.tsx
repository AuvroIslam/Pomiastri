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

// Characters sit in the centre of their canvas with ~20% transparent padding.
// Upscale by 1.4× and clip so the character fills the frame properly.
const ZOOM = 1.4;

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
      withTiming(1.12, { duration: 120 }),
      withSpring(1, { damping: 8 })
    );
  }, [state, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imgSize = size * ZOOM;
  const offset = -(imgSize - size) / 2;

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Animated.View style={animatedStyle}>
        <Image
          source={driver.assets[state]}
          style={{ width: imgSize, height: imgSize, marginLeft: offset, marginTop: offset }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
