import { Tabs } from 'expo-router';
import { ActivityIndicator, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { useAuth } from '@/hooks/useAuth';
import { useInviteNotifier } from '@/hooks/useInviteNotifier';

/** Single-color silhouette icon — tintColor colors it red/gray */
function TintIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <Image
      source={source}
      style={styles.icon}
      resizeMode="contain"
      tintColor={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

export default function AppLayout() {
  const { user, profile } = useAuth();
  useInviteNotifier(user?.uid);

  // Right after signup the auth account exists a beat before its Firestore
  // profile doc is written (AuthContext retries the read). Hold the tabs back
  // until the profile is in hand — otherwise the screens mount on default
  // values and briefly flash the wrong driver / "------" friend code.
  if (user && !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ focused }) => (
            <TintIcon source={F1Assets.iconHome} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'FRIENDS',
          tabBarIcon: ({ focused }) => (
            <TintIcon source={F1Assets.iconFriends} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'GRID',
          tabBarIcon: ({ focused }) => (
            <TintIcon source={F1Assets.iconGrid} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'GARAGE',
          tabBarIcon: ({ focused }) => (
            <TintIcon source={F1Assets.iconHelmet} focused={focused} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="create-session" options={{ href: null }} />
      <Tabs.Screen name="join-session" options={{ href: null }} />
      <Tabs.Screen name="session/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 22, height: 22 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
