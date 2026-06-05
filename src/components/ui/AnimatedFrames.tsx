import React, { useState, useEffect, useRef } from 'react';
import { Image, View, ViewStyle, ImageSourcePropType, StyleSheet } from 'react-native';

interface AnimatedFramesProps {
  frames: ImageSourcePropType[];
  fps?: number;
  loop?: boolean;
  style?: ViewStyle;
  onComplete?: () => void;
}

/**
 * Frame-by-frame animation using stacked Images.
 * ALL frames are rendered simultaneously (pre-loaded) — only the active frame
 * has opacity 1. This eliminates the blank flash caused by swapping Image sources.
 */
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
    setFrameIndex(0);

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
    <View style={[styles.container, style]}>
      {frames.map((src, i) => (
        <Image
          key={i}
          source={src}
          style={[StyleSheet.absoluteFill, { opacity: i === frameIndex ? 1 : 0 }]}
          resizeMode="contain"
          fadeDuration={0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%' },
});
