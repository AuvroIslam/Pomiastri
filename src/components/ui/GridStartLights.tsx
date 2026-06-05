import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AnimatedFrames } from './AnimatedFrames';
import { F1Assets } from '@/constants/drivers';
import { Colors, Spacing } from '@/constants/theme';

export type LightStage =
  | 'empty'           // no partner yet — lights 0
  | 'building'        // partner joined — lights 1→4 coming on
  | 'ready'           // all 4 red lights on — waiting for start
  | 'go'              // green light! host pressed start
  | 'racing';         // lights gone, race started

interface GridStartLightsProps {
  stage: LightStage;
  onGoComplete?: () => void;
}

// The 5 red→green frames: 0=empty, 1-4=red lights, 5=green
const FRAMES = F1Assets.startLights; // [f0, f1, f2, f3, f4, f5]

export function GridStartLights({ stage, onGoComplete }: GridStartLightsProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    switch (stage) {
      case 'empty':
        setFrameIndex(0);
        setVisible(true);
        break;

      case 'building': {
        // Animate lights coming on one by one: 0 → 1 → 2 → 3 → 4
        setVisible(true);
        let current = 0;
        setFrameIndex(0);
        const interval = setInterval(() => {
          current += 1;
          if (current <= 4) {
            setFrameIndex(current);
          } else {
            clearInterval(interval);
          }
        }, 600);
        return () => clearInterval(interval);
      }

      case 'ready':
        setFrameIndex(4);
        setVisible(true);
        break;

      case 'go': {
        // Flash to green then fade out
        setFrameIndex(5);
        setVisible(true);
        const timeout = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            onGoComplete?.();
          });
        }, 800);
        return () => clearTimeout(timeout);
      }

      case 'racing':
        setVisible(false);
        break;
    }
  }, [stage]);

  // Reset opacity when stage changes back
  useEffect(() => {
    if (stage !== 'go' && stage !== 'racing') {
      opacity.setValue(1);
      setVisible(true);
    }
  }, [stage]);

  if (!visible || frameIndex >= FRAMES.length) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.lightsFrame}>
        <AnimatedFrames
          frames={[FRAMES[frameIndex]]}
          fps={1}
          loop={false}
          style={styles.image}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  lightsFrame: {
    width: '100%',
    aspectRatio: 2.5,   // matches the landscape start-lights image proportion
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
});
