import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAudioPlayer } from 'expo-audio';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { SplashAnimation } from '@/components/ui/SplashAnimation';
import { AppLogo } from '@/components/ui/AppLogo';
import { F1Assets } from '@/constants/drivers';

const engineSound = require('../assets/sfx/charlesEngineSound.mp3');

// DO NOT call SplashScreen.preventAutoHideAsync() here — it blocks the
// Expo Dev Client launcher in dev builds. Native splash auto-hides on first render.

const MIN_SPLASH_MS = 2200;

/** Indeterminate sliding loading bar */
function LoadingBar() {
  const translateX = useRef(new Animated.Value(-70)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: 210,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { transform: [{ translateX }] }]} />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const [showOverlay, setShowOverlay] = useState(true);
  const [carDone, setCarDone] = useState(false);
  const [readyToReveal, setReadyToReveal] = useState(false);
  const [logoShowing, setLogoShowing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const carOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoTriggeredRef = useRef(false);

  const enginePlayer = useAudioPlayer(engineSound);

  // Rev the engine when the splash appears (once)
  useEffect(() => {
    try {
      enginePlayer.seekTo(0);
      enginePlayer.play();
    } catch {
      // audio is best-effort — never block startup
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Gate: auth done + minimum time elapsed
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setReadyToReveal(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [loading]);

  // Car animation finished → fade it out
  const handleCarComplete = useCallback(() => {
    setCarDone(true);
    Animated.timing(carOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Car done → show logo immediately (loading bar still visible)
  useEffect(() => {
    if (!carDone || logoTriggeredRef.current) return;
    logoTriggeredRef.current = true;

    setLogoShowing(false); // keep loading bar visible
    Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 7,
        }),
      ]).start();
  }, [carDone]);

  // Both gates open → hide loading bar and fade out overlay
  useEffect(() => {
    if (!carDone || !readyToReveal || !logoTriggeredRef.current) return;

    setLogoShowing(true); // hides loading bar
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowOverlay(false));
    }, 700);
  }, [carDone, readyToReveal]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>

      {showOverlay && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          {/* Loading bar — hidden once logo appears */}
          {!logoShowing && <LoadingBar />}

          {/* Car animation — fades out when done */}
          <Animated.View style={{ opacity: carOpacity }}>
            <SplashAnimation
              frames={F1Assets.splashFrames}
              fps={12}
              style={styles.splashAnim}
              onComplete={handleCarComplete}
            />
          </Animated.View>

          {/* Logo — springs in after car fades and loading is done */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.logoWrap,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
            pointerEvents="none"
          >
            <AppLogo size={130} />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.xxl,
    zIndex: 999,
  },
  barTrack: {
    width: 200,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    width: 60,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  splashAnim: { width: 280, height: 280 },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
