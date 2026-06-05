import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { AnimatedFrames } from '@/components/ui/AnimatedFrames';
import { F1Assets } from '@/constants/drivers';

SplashScreen.preventAutoHideAsync();

// Minimum time (ms) to show our branded loading screen before navigating
const MIN_SPLASH_MS = 2200;

function RootNavigator() {
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Start the minimum-display timer as soon as the component mounts
  useEffect(() => {
    timerRef.current = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 2. When Firebase auth resolves, mark it done
  useEffect(() => {
    if (!loading) setAuthDone(true);
  }, [loading]);

  // 3. When BOTH are done → hide native splash, then fade out our screen
  useEffect(() => {
    if (!splashDone || !authDone) return;

    SplashScreen.hideAsync();
    setFadingOut(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [splashDone, authDone]);

  const showLoading = !splashDone || !authDone || fadingOut;

  return (
    <>
      {/* App content — mounts underneath the loading overlay */}
      {authDone && (
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
        </>
      )}

      {/* Loading overlay — fades out on top of the app */}
      {showLoading && (
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <Image source={F1Assets.logo} style={styles.logo} resizeMode="contain" />
          <AnimatedFrames
            frames={F1Assets.splashFrames}
            fps={14}
            loop
            style={styles.splashAnim}
          />
          <Text style={styles.loadingText}>LOADING...</Text>
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
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
    zIndex: 999,
  },
  logo: {
    width: 100,
    height: 34,
  },
  splashAnim: {
    width: 280,
    height: 280,
  },
  loadingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
});
