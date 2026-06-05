import React, { useState, useEffect, useRef } from 'react';
import { Image, View, ViewStyle, ImageSourcePropType, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';

interface SplashAnimationProps {
  frames: ImageSourcePropType[];
  fps?: number;
  loop?: boolean;
  style?: ViewStyle;
  onComplete?: () => void;
}

/**
 * Smooth frame-by-frame splash animation.
 *
 * Two things make it smooth even during the busy app-launch moment:
 * 1. Every frame is rendered stacked (opacity toggle) so there is no
 *    image-source swap / re-decode mid-animation.
 * 2. We preload (decode) all frames with expo-asset BEFORE starting the
 *    interval, so the first playthrough never stutters on lazy decode.
 */
export function SplashAnimation({ frames, fps = 12, loop = false, style, onComplete }: SplashAnimationProps) {
  const [ready, setReady] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Preload/decode all frames first
  useEffect(() => {
    let active = true;
    Asset.loadAsync(frames as number[])
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Start the loop only once frames are warm
  useEffect(() => {
    if (!ready || frames.length === 0) return;

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (loop) return 0;
          // Play once: stop at last frame and hold
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!completedRef.current) {
            completedRef.current = true;
            setTimeout(() => onComplete?.(), 0);
          }
          return prev;
        }
        return next;
      });
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ready, frames, fps, loop]);

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
