import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import PostCard from '../../components/PostCard';

export default function DashboardScreen() {
  const { data, isLoading, loadDashboard } = useDashboard();
  const { colors } = useTheme();
  const s = createStyles(colors);

  useEffect(() => { loadDashboard(); }, []);

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboard} tintColor={colors.accent} />}
    >
      <Text style={s.appName}>Socio</Text>
      {data && <>
        <View style={s.statsRow}>
          <StatCard label="Drafts" value={data.overview.drafts} colors={colors} />
          <StatCard label="Scheduled" value={data.overview.scheduled} colors={colors} />
          <StatCard label="Published" value={data.overview.published} colors={colors} />
          <StatCard label="Failed" value={data.overview.failed} colors={colors} />
        </View>
        <Section title="Upcoming Posts" colors={colors}>
          {data.upcoming.length === 0
            ? <EmptyCard icon="📅" text="No upcoming posts" subtitle="Schedule posts to publish later" colors={colors} />
            : data.upcoming.map((p) => <PostCard key={p.id} post={p} />)}
        </Section>
        <Section title="Recent Published" colors={colors}>
          {data.published.length === 0
            ? <EmptyCard icon="📄" text="No published posts yet" colors={colors} />
            : data.published.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
        </Section>
      </>}
    </ScrollView>
  );
}

function StatCard({ label, value, colors }: { label: string; value: number; colors: any }) {
  return (
    <View style={[st.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[st.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[st.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={st.section}>
      <Text style={[st.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyCard({ icon, text, subtitle, colors }: { icon: string; text: string; subtitle?: string; colors: any }) {
  return (
    <View style={[st.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={st.emptyIcon}>{icon}</Text>
      <Text style={[st.emptyText, { color: colors.textSecondary }]}>{text}</Text>
      {subtitle && <Text style={[st.emptySub, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  emptyCard: { borderRadius: 12, padding: 28, alignItems: 'center', borderWidth: 1 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptySub: { fontSize: 12, marginTop: 2 },
});

function createStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 16 },
    appName: { fontSize: 26, fontWeight: '800', color: c.accent, marginBottom: 18 },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  });
}
