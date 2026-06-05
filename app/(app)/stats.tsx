import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { getUserHistory } from '@/services/stats';
import { Card } from '@/components/ui/Card';
import { SessionHistoryEntry } from '@/types';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { F1Assets } from '@/constants/drivers';
import { AppLogo } from '@/components/ui/AppLogo';

export default function StatsScreen() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getUserHistory(profile.uid).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerBar}>
          <AppLogo size={40} />
          <Text style={styles.title}>RACE HISTORY</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard value={String(profile?.currentStreak ?? 0)} label="DAY STREAK" accent={Colors.warning} />
          <StatCard value={String(profile?.totalFocusMinutes ?? 0)} label="FOCUS MIN" accent={Colors.primary} />
          <StatCard value={String(profile?.totalSessions ?? 0)} label="RACES" accent={Colors.success} />
          <StatCard value={String(profile?.points ?? 0)} label="TOTAL PTS" accent={Colors.gold} />
        </View>

        <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : history.length === 0 ? (
          <Text style={styles.empty}>No sessions yet. Start racing!</Text>
        ) : (
          history.map((entry) => <HistoryItem key={entry.id} entry={entry} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={[statStyles.card, { borderTopColor: accent }]}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function HistoryItem({ entry }: { entry: SessionHistoryEntry }) {
  const date = entry.createdAt?.toDate
    ? entry.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
  const dotColor = entry.wasCompleted ? Colors.success : Colors.primary;

  return (
    <View style={histStyles.row}>
      <View style={[histStyles.dot, { backgroundColor: dotColor }]} />
      <View style={histStyles.info}>
        <Text style={histStyles.label}>
          {entry.wasCompleted ? 'Completed' : entry.wasBroken ? 'Broken' : 'Partial'}
          {entry.partnerDisplayName ? ` · with ${entry.partnerDisplayName}` : ' · Solo'}
        </Text>
        <Text style={histStyles.meta}>
          {entry.focusMinutes} min · {entry.phasesCompleted} laps
        </Text>
      </View>
      <View style={histStyles.pts}>
        {entry.pointsEarned > 0 && (
          <Text style={histStyles.ptsEarned}>+{entry.pointsEarned}</Text>
        )}
        {entry.pointsLost > 0 && (
          <Text style={histStyles.ptsLost}>−{entry.pointsLost}</Text>
        )}
      </View>
      <Text style={histStyles.date}>{date}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    minWidth: '45%',
    gap: 4,
  },
  value: { fontSize: FontSize.xxl, fontWeight: FontWeight.black },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1 },
});

const histStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  pts: { alignItems: 'flex-end' },
  ptsEarned: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.success },
  ptsLost: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, minWidth: 40, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  f1Logo: { width: 60, height: 22 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.textMuted, letterSpacing: 2 },
  loader: { marginTop: Spacing.xl },
  empty: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
});
