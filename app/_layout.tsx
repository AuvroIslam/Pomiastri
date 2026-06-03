import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { AnimatedFrames } from '@/components/ui/AnimatedFrames';
import { F1Assets } from '@/constants/drivers';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={F1Assets.logo} style={styles.logo} resizeMode="contain" />
        {/* Charles Leclerc 18-frame animation while Firebase auth resolves */}
        <AnimatedFrames
          frames={F1Assets.splashFrames}
          fps={14}
          loop
          style={styles.splashAnim}
        />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  logo: {
    width: 100,
    height: 34,
  },
  splashAnim: {
    width: 260,
    height: 260,
  },
  loadingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
});
