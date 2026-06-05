import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useFriendsLeaderboard } from '@/hooks/useFriendsLeaderboard';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';

type LbTab = 'global' | 'friends';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [view, setView] = useState<LbTab>('friends');

  const global = useLeaderboard(50);
  const friends = useFriendsLeaderboard(user?.uid);

  const data = view === 'global' ? global.leaderboard : friends.leaderboard;
  const loading = view === 'global' ? global.loading : friends.loading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <AppLogo size={40} />
          <Text style={styles.title}>STANDINGS</Text>
          <Image source={F1Assets.checkedFlag} style={styles.flagIcon} resizeMode="contain" />
        </View>

        {/* Segmented toggle */}
        <View style={styles.toggle}>
          <Segment label="MY GRID" active={view === 'friends'} onPress={() => setView('friends')} />
          <Segment label="GLOBAL" active={view === 'global'} onPress={() => setView('global')} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <LeaderboardRow entry={item} isCurrentUser={item.uid === user?.uid} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {view === 'friends'
                  ? 'Add teammates on the Friends tab to build your grid.'
                  : 'No drivers ranked yet. Start racing!'}
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.segment, active && styles.segmentActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  f1Logo: { width: 60, height: 22 },
  title: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  flagIcon: { width: 28, height: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  segmentTextActive: { color: Colors.textOnPrimary },
  loader: { marginTop: Spacing.xxl },
  list: { paddingBottom: Spacing.xxl },
  empty: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
});
