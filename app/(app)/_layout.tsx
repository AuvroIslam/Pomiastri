import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Friends: '👥',
    Stats: '📊',
  };
  return (
    <Text style={{ fontSize: FontSize.xl, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '●'}
    </Text>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused }) => <TabIcon label="Friends" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon label="Stats" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar — navigated to programmatically */}
      <Tabs.Screen
        name="create-session"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="join-session"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}
