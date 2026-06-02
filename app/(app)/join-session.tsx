import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { joinSessionByCode } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

export default function JoinSessionScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [joinCode, setJoinCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });

      return () => sub.remove();
    }, [router])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) {
      setError('Enter a valid 6-character session code.');
      return;
    }
    if (!user || !profile) return;

    setError('');
    setLoading(true);
    try {
      const result = await joinSessionByCode(code, user.uid, profile.displayName);
      if (result.success && result.sessionId) {
        router.replace(`/(app)/session/${result.sessionId}`);
      } else {
        setError(result.error ?? 'Could not join session.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.icon}>
            <Text style={styles.iconText}>🔑</Text>
          </View>

          <Text style={styles.title}>Join a Session</Text>
          <Text style={styles.subtitle}>
            Enter the 6-character code your study partner shared with you.
          </Text>

          <Input
            label="Session Code"
            value={joinCode}
            onChangeText={(t) => {
              setJoinCode(t.toUpperCase());
              setError('');
            }}
            placeholder="XXXXXX"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            error={error}
            style={styles.codeInput}
          />

          <Button
            label="Join Session"
            onPress={handleJoin}
            loading={loading}
            size="lg"
            disabled={joinCode.length < 6}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  backBtn: {},
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  icon: { alignItems: 'center', marginTop: Spacing.xl },
  iconText: { fontSize: 64 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
});
