import { Tabs } from 'expo-router';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
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
  const { user } = useAuth();
  useInviteNotifier(user?.uid);

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
});
