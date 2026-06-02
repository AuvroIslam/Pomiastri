import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  // By the time this renders, RootLayout has already resolved `loading`,
  // so `user` is definitively known here.
  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
