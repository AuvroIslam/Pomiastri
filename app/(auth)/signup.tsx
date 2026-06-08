import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvatarSelector } from '@/components/avatar/AvatarSelector';
import { AvatarDisplay } from '@/components/avatar/AvatarDisplay';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { AppLogo } from '@/components/ui/AppLogo';
import { DriverId, DRIVERS, DEFAULT_DRIVER } from '@/constants/drivers';

type Step = 'credentials' | 'avatar';

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState<DriverId>(DEFAULT_DRIVER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNextStep() {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setStep('avatar');
  }

  async function handleSignup() {
    setLoading(true);
    try {
      await registerUser(email.trim(), password, displayName.trim(), avatarId);
    } catch (e: any) {
      setError(friendlyAuthError(e.code));
      setStep('credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <AppLogo size={56} />
          <Text style={styles.title}>
            {step === 'credentials' ? 'JOIN THE GRID' : 'PICK YOUR DRIVER'}
          </Text>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 'credentials' && styles.stepActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'avatar' && styles.stepActive]} />
          </View>
        </View>

        {step === 'credentials' ? (
          <View style={styles.form}>
            <Input
              label="DRIVER NAME"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your racing name"
              autoCapitalize="words"
            />
            <Input
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="driver@team.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureToggle
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="NEXT: CHOOSE DRIVER"
              onPress={handleNextStep}
              size="lg"
              style={styles.submitBtn}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.avatarHint}>
              Your driver avatar will represent you in sessions and the leaderboard.
            </Text>
            <View style={styles.carPreview}>
              <Text style={styles.carPreviewLabel}>
                {DRIVERS[avatarId].name.toUpperCase()}'S CAR
              </Text>
              <AvatarDisplay
                key={avatarId}
                avatarId={avatarId}
                state="car"
                size={190}
              />
            </View>

            <AvatarSelector selected={avatarId} onSelect={setAvatarId} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Button
                label="Back"
                onPress={() => setStep('credentials')}
                variant="ghost"
                size="md"
                style={styles.backBtn}
              />
              <Button
                label="START RACING"
                onPress={handleSignup}
                loading={loading}
                size="md"
                style={styles.submitBtn}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.switchLink}
        >
          <Text style={styles.switchText}>
            Already racing?{' '}
            <Text style={styles.switchBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already in use.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { width: 100, height: 34 },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  stepActive: { backgroundColor: Colors.primary },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border },
  form: { gap: Spacing.md },
  avatarHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  carPreview: { alignItems: 'center', gap: Spacing.xs, marginBottom: -26 },
  carPreviewLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  backBtn: { flex: 1 },
  submitBtn: { flex: 1 },
  switchLink: { alignItems: 'center' },
  switchText: { fontSize: FontSize.md, color: Colors.textSecondary },
  switchBold: { fontWeight: FontWeight.bold, color: Colors.primary },
});
