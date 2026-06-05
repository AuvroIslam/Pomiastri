import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { loginUser } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { AppLogo } from '@/components/ui/AppLogo';
import { F1Assets } from '@/constants/drivers';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert('Exit App', 'Do you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
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
        {/* F1 Logo */}
        <View style={styles.header}>
          <AppLogo size={72} />
          <Text style={styles.appName}>POMIASTRI</Text>
          <Text style={styles.tagline}>Study. Race. Dominate.</Text>
        </View>

        {/* Checkered divider */}
        <Image source={F1Assets.checkerBox} style={styles.divider} resizeMode="repeat" />

        <View style={styles.form}>
          <Input
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="driver@team.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureToggle
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="START ENGINE"
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
            New driver?{' '}
            <Text style={styles.switchBold}>Join the Grid</Text>
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
    gap: Spacing.lg,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logo: { width: 120, height: 40 },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  divider: {
    width: '100%',
    height: 8,
    opacity: 0.3,
  },
  form: { gap: Spacing.md },
  error: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  submitBtn: { marginTop: Spacing.sm },
  switchLink: { alignItems: 'center' },
  switchText: { fontSize: FontSize.md, color: Colors.textSecondary },
  switchBold: { fontWeight: FontWeight.bold, color: Colors.primary },
});
