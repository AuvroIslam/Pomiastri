import { Tabs } from 'expo-router';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';
import { F1Assets, DRIVERS } from '@/constants/drivers';
import { useAuth } from '@/hooks/useAuth';
import { useInviteNotifier } from '@/hooks/useInviteNotifier';

function TabIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <Image
      source={source}
      style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
      resizeMode="contain"
      tintColor={focused ? Colors.primary : undefined}
    />
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  // Fire an in-app heads-up notification the moment a friend's invite arrives
  useInviteNotifier(user?.uid);

  const helmetIcon = DRIVERS.max.assets.helmet;

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
            <TabIcon source={F1Assets.checkerBox} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'FRIENDS',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={F1Assets.checkerBox} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'GRID',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={F1Assets.checkedFlag} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'GARAGE',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={helmetIcon} focused={focused} />
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
  icon: { width: 24, height: 24 },
});
