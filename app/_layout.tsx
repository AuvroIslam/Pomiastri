import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { AnimatedFrames } from '@/components/ui/AnimatedFrames';
import { F1Assets } from '@/constants/drivers';

// DO NOT call SplashScreen.preventAutoHideAsync() here.
// In a dev build it blocks the Expo Dev Client home screen (scan QR) from
// appearing. The native splash auto-hides when React first renders, and our
// React overlay (charles animation) takes over from there.

// How long to show our branded loading screen before revealing the app
const MIN_SPLASH_MS = 2000;

function RootNavigator() {
  const { user, loading } = useAuth();
  const [showOverlay, setShowOverlay] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash immediately after a short delay so the
    // app is never stuck if Firebase is slow. Our React overlay stays
    // on top until auth resolves AND MIN_SPLASH_MS has elapsed.
    const nativeTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);
    return () => clearTimeout(nativeTimer);
  }, []);

  useEffect(() => {
    if (loading) return;

    // Auth resolved — wait for minimum display time then fade out
    const delay = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowOverlay(false));
    }, MIN_SPLASH_MS);

    return () => clearTimeout(delay);
  }, [loading]);

  return (
    <>
      {/* App renders underneath the overlay */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>

      {/* Branded loading overlay — fades out once auth + timer done */}
      {showOverlay && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
    zIndex: 999,
  },
  logo: { width: 100, height: 34 },
  splashAnim: { width: 280, height: 280 },
  loadingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
});
