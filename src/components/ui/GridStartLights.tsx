import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { F1Assets } from '@/constants/drivers';
import { Colors } from '@/constants/theme';

export type LightStage =
  | 'empty'      // lights off (frame 0)
  | 'building'   // lights animate on one by one: 0→1→2→3→4
  | 'ready'      // all 4 red lights on (frame 4) — static
  | 'go'         // green light (frame 5) then fade
  | 'racing';    // hidden

interface GridStartLightsProps {
  stage: LightStage;
  onGoComplete?: () => void;
}

const FRAMES = F1Assets.startLights; // [f0, f1, f2, f3, f4, f5]
const LIGHT_INTERVAL_MS = 800; // time per light (faster feel)

export function GridStartLights({ stage, onGoComplete }: GridStartLightsProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    switch (stage) {
      case 'empty':
        opacity.setValue(1);
        setVisible(true);
        setFrameIndex(0);
        break;

      case 'building': {
        opacity.setValue(1);
        setVisible(true);
        setFrameIndex(0);
        let current = 0;
        const interval = setInterval(() => {
          current += 1;
          if (current <= 4) {
            setFrameIndex(current);
          } else {
            clearInterval(interval);
          }
        }, LIGHT_INTERVAL_MS);
        return () => clearInterval(interval);
      }

      case 'ready':
        opacity.setValue(1);
        setVisible(true);
        setFrameIndex(4);
        break;

      case 'go': {
        opacity.setValue(1);
        setVisible(true);
        setFrameIndex(5);
        const timeout = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            onGoComplete?.();
          });
        }, 1000);
        return () => clearTimeout(timeout);
      }

      case 'racing':
        setVisible(false);
        break;
    }
  }, [stage]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      {/* Render ALL frames stacked — only the active one is opaque.
          This pre-loads every image so there is zero loading gap between
          frames (no blank flash — smooth video-like transition). */}
      {FRAMES.map((src, i) => (
        <Image
          key={i}
          source={src}
          style={[
            StyleSheet.absoluteFill,
            styles.image,
            // Only current frame visible; opacity switch is instant (no fade)
            { opacity: i === frameIndex ? 1 : 0 },
          ]}
          resizeMode="contain"
          fadeDuration={0}  // Android: disable the default image load fade-in
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
