import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      // AuthContext + Stack.Protected handle navigation automatically
    } catch (e: any) {
      setError(friendlyAuthError(e.code));
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
        <View style={styles.header}>
          <Text style={styles.logo}>🌿</Text>
          <Text style={styles.title}>Pomiastri</Text>
          <Text style={styles.subtitle}>Study together, stay focused.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureToggle
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={styles.switchLink}
        >
          <Text style={styles.switchText}>
            New here?{' '}
            <Text style={styles.switchBold}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { fontSize: 56 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  form: { gap: Spacing.md },
  error: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  submitBtn: { marginTop: Spacing.sm },
  switchLink: { alignItems: 'center' },
  switchText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  switchBold: {
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});
