import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { getUserHistory } from '@/services/stats';
import { Card } from '@/components/ui/Card';
import { SessionHistoryEntry } from '@/types';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

export default function StatsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)');
        return true;
      });

      return () => sub.remove();
    }, [router])
  );

  useEffect(() => {
    if (!profile) return;
    getUserHistory(profile.uid).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Stats</Text>

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            emoji="🔥"
            value={String(profile?.currentStreak ?? 0)}
            label="Day Streak"
            accent={Colors.warning}
          />
          <StatCard
            emoji="⏱️"
            value={String(profile?.totalFocusMinutes ?? 0)}
            label="Focus Minutes"
            accent={Colors.primary}
          />
          <StatCard
            emoji="✅"
            value={String(profile?.totalSessions ?? 0)}
            label="Sessions Done"
            accent={Colors.success}
          />
          <StatCard
            emoji="🤝"
            value={String(history.filter((h) => h.partnerId).length)}
            label="Partner Sessions"
            accent={Colors.longBreakAccent}
          />
        </View>

        {/* Session History */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : history.length === 0 ? (
          <Text style={styles.empty}>
            No sessions yet. Start studying to see your history here.
          </Text>
        ) : (
          <View style={styles.historyList}>
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  emoji,
  value,
  label,
  accent,
}: {
  emoji: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={[statStyles.card, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function HistoryItem({ entry }: { entry: SessionHistoryEntry }) {
  const date = entry.createdAt?.toDate
    ? entry.createdAt.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <View style={historyStyles.row}>
      <View style={[historyStyles.dot, entry.wasCompleted ? historyStyles.dotGreen : historyStyles.dotRed]} />
      <View style={historyStyles.info}>
        <Text style={historyStyles.label}>
          {entry.wasCompleted ? 'Completed' : entry.wasBroken ? 'Broken' : 'Partial'}
          {entry.partnerDisplayName ? ` · with ${entry.partnerDisplayName}` : ''}
        </Text>
        <Text style={historyStyles.meta}>
          {entry.focusMinutes} min · {entry.phasesCompleted} phase{entry.phasesCompleted !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={historyStyles.date}>{date}</Text>
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
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '45%',
  },
  emoji: { fontSize: FontSize.xxl },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

const historyStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotGreen: { backgroundColor: Colors.success },
  dotRed: { backgroundColor: Colors.error },
  info: { flex: 1 },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  loader: { marginTop: Spacing.xl },
  empty: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  historyList: { gap: 0 },
});
