import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { F1Assets } from '@/constants/drivers';
import { Colors } from '@/constants/theme';

export type LightStage =
  | 'empty'      // no partner — lights off (frame 0)
  | 'building'   // partner joined — lights 1→4 animate on
  | 'ready'      // all 4 red lights on
  | 'go'         // frame 5 green = GO!
  | 'racing';    // hide entirely

interface GridStartLightsProps {
  stage: LightStage;
  onGoComplete?: () => void;
}

const FRAMES = F1Assets.startLights; // 6 frames: 0=off, 1-4=red, 5=green

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
        setFrameIndex(1);
        let current = 1;
        const interval = setInterval(() => {
          current += 1;
          if (current <= 4) {
            setFrameIndex(current);
          } else {
            clearInterval(interval);
          }
        }, 700);
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
        }, 900);
        return () => clearTimeout(timeout);
      }

      case 'racing':
        setVisible(false);
        break;
    }
  }, [stage]);

  if (!visible) return null;

  const src = FRAMES[frameIndex];
  if (!src) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <Image source={src} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    // Images are ~500×430px → ratio ~1.16. Use padding-based height trick.
    aspectRatio: 1.2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
