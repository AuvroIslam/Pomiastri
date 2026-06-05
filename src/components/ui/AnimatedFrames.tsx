import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageSourcePropType } from 'react-native';

interface AnimatedFramesProps {
  frames: ImageSourcePropType[];
  fps?: number;
  loop?: boolean;
  style?: ViewStyle;
  onComplete?: () => void;
}

export function AnimatedFrames({
  frames,
  fps = 8,
  loop = false,
  style,
  onComplete,
}: AnimatedFramesProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (frames.length === 0) return;

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) {
            clearInterval(intervalRef.current!);
            onComplete?.();
            return prev;
          }
          return 0;
        }
        return next;
      });
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [frames, fps, loop, onComplete]);

  if (frames.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={frames[frameIndex]}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
    </View>
  );
}
