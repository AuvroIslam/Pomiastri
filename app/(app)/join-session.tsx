import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { joinSessionByCode } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';

export default function JoinSessionScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) { setError('Enter a valid 6-character code.'); return; }
    if (!user || !profile) return;
    setError('');
    setLoading(true);
    try {
      const result = await joinSessionByCode(code, user.uid, profile.displayName, profile.avatarId);
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.headerBar}>
            <Image source={F1Assets.logo} style={styles.f1Logo} resizeMode="contain" />
            <Text style={styles.title}>JOIN THE GRID</Text>
          </View>

          <View style={styles.iconArea}>
            <Image source={F1Assets.checkedFlag} style={styles.bigFlag} resizeMode="contain" />
            <Text style={styles.subtitle}>Enter the Pit Pass code from your co-driver</Text>
          </View>

          <Input
            label="PIT PASS CODE"
            value={joinCode}
            onChangeText={(t) => { setJoinCode(t.toUpperCase()); setError(''); }}
            placeholder="XXXXXX"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            error={error}
          />

          <Button
            label="JOIN THE GRID"
            onPress={handleJoin}
            loading={loading}
            size="lg"
            disabled={joinCode.length < 6}
          />

          <Button
            label="Back"
            onPress={() => router.replace('/(app)')}
            variant="ghost"
            size="md"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  f1Logo: { width: 60, height: 22 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 3 },
  iconArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  bigFlag: { width: 100, height: 70 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
