import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { createSession } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { DEFAULT_SESSION_SETTINGS } from '@/constants/pomodoro';
import { SessionSettings } from '@/types';

export default function CreateSessionScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Simple settings — MVP uses defaults
  const settings: SessionSettings = DEFAULT_SESSION_SETTINGS;

  async function handleCreate() {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const sessionId = await createSession(user.uid, profile.displayName, settings);
      if (sessionId) {
        router.replace(`/(app)/session/${sessionId}`);
      } else {
        throw new Error('Session creation failed.');
      }
    } catch {
      Alert.alert('Error', 'Could not create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>New Study Session</Text>
        <Text style={styles.subtitle}>
          Create a room and share the code with a friend.
        </Text>

        {/* Session Settings Preview */}
        <Card style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Session Settings</Text>
          <SettingRow
            label="Focus"
            value={`${settings.focusDuration / 60} min`}
            emoji="🎯"
          />
          <View style={styles.divider} />
          <SettingRow
            label="Short Break"
            value={`${settings.shortBreakDuration / 60} min`}
            emoji="☕"
          />
          <View style={styles.divider} />
          <SettingRow
            label="Long Break"
            value={`${settings.longBreakDuration / 60} min`}
            emoji="🌿"
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            After creating, you'll get a join code. Share it with your study partner.
            The session starts when they join and you press Start.
          </Text>
        </Card>

        <Button
          label="Create Session"
          onPress={handleCreate}
          loading={loading}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <View style={settingStyles.row}>
      <Text style={settingStyles.emoji}>{emoji}</Text>
      <Text style={settingStyles.label}>{label}</Text>
      <Text style={settingStyles.value}>{value}</Text>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emoji: { fontSize: FontSize.lg },
  label: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  value: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  backBtn: { marginBottom: Spacing.xs },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  settingsCard: { gap: Spacing.sm },
  settingsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  infoCard: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
