import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const greeting = getGreeting();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Exit App',
          'Do you want to exit the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      });

      return () => sub.remove();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{profile?.displayName ?? user?.displayName ?? 'Friend'}</Text>
          </View>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Friend Code Card */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Friend Code</Text>
          <Text style={styles.friendCode}>{profile?.friendCode ?? '------'}</Text>
          <Text style={styles.codeHint}>Share this with friends to connect</Text>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatPill
            emoji="🔥"
            value={String(profile?.currentStreak ?? 0)}
            label="day streak"
          />
          <StatPill
            emoji="⏱️"
            value={String(profile?.totalFocusMinutes ?? 0)}
            label="focus min"
          />
          <StatPill
            emoji="✅"
            value={String(profile?.totalSessions ?? 0)}
            label="sessions"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            label="Start a Session"
            onPress={() => router.push('/(app)/create-session')}
            size="lg"
          />
          <Button
            label="Join a Session"
            onPress={() => router.push('/(app)/join-session')}
            variant="secondary"
            size="lg"
          />
        </View>

        <Text style={styles.tagline}>
          🌿 Stay focused. Stay together.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string;
  label: string;
}) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

const statStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  emoji: { fontSize: FontSize.xl },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  label: { fontSize: FontSize.xs, color: Colors.textMuted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  logoutBtn: { paddingTop: Spacing.xs },
  logoutText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  codeCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primaryDark,
    borderColor: 'transparent',
  },
  codeLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  friendCode: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    letterSpacing: 6,
  },
  codeHint: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  actions: { gap: Spacing.sm },
  tagline: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
