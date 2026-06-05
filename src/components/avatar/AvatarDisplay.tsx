import React, { useEffect } from 'react';
import { Image, View, ViewStyle } from 'react-native';
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
// We upscale by 1.4× — flex centering + overflow:hidden creates the zoom/crop effect.
// Car/helmet images are full-bleed so no upscale needed.
const CHARACTER_ZOOM = 1.4;

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
      withTiming(1.1, { duration: 120 }),
      withSpring(1, { damping: 8 })
    );
  }, [state, animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFullBleed = state === 'car' || state === 'helmet';
  const imgSize = isFullBleed ? size : size * CHARACTER_ZOOM;

  return (
    // flex centering keeps the image centred regardless of container width/height.
    // overflow:hidden clips the zoomed character portraits naturally.
    <View
      style={[
        {
          width: size,
          height: size,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={driver.assets[state]}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
