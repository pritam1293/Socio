import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import PostCard from '../../components/PostCard';

const DESKTOP_MAX = 900;

export default function DashboardScreen() {
  const { data, isLoading, loadDashboard } = useDashboard();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const contentW = Math.min(width - 32, DESKTOP_MAX);

  useEffect(() => { loadDashboard(); }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, alignItems: 'center' }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboard} tintColor={colors.accent} />}
    >
      <View style={{ width: contentW }}>
        {!isDesktop && <Text style={[s.appName, { color: colors.accent }]}>Socio</Text>}
        {data && <>
          <View style={[s.statsRow, isDesktop && s.statsWide]}>
            <StatCard label="Drafts" value={data.overview?.drafts ?? 0} colors={colors} />
            <StatCard label="Scheduled" value={data.overview?.scheduled ?? 0} colors={colors} />
            <StatCard label="Published" value={data.overview?.published ?? 0} colors={colors} />
            <StatCard label="Failed" value={data.overview?.failed ?? 0} colors={colors} />
          </View>
          <View style={[s.sectionsWrap, isDesktop && s.sectionsHorizontal]}>
            <View style={isDesktop ? { flex: 1 } : undefined}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Upcoming Posts</Text>
              {!data.upcoming || data.upcoming.length === 0
                ? <EmptyCard icon="📅" text="No upcoming posts" subtitle="Schedule posts to publish later" colors={colors} />
                : data.upcoming.map((p) => <PostCard key={p.id} post={p} />)}
            </View>
            <View style={isDesktop ? { flex: 1 } : undefined}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Recent Published</Text>
              {!data.published || data.published.length === 0
                ? <EmptyCard icon="📄" text="No published posts yet" colors={colors} />
                : data.published.slice(0, 5).map((p) => <PostCard key={p.id} post={p} />)}
            </View>
          </View>
        </>}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, colors }: { label: string; value: number; colors: any }) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[s.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function EmptyCard({ icon, text, subtitle, colors }: { icon: string; text: string; subtitle?: string; colors: any }) {
  return (
    <View style={[s.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={[s.emptyText, { color: colors.textSecondary }]}>{text}</Text>
      {subtitle && <Text style={[s.emptySub, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  appName: { fontSize: 26, fontWeight: '800', marginBottom: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statsWide: { gap: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  sectionsWrap: { gap: 20 },
  sectionsHorizontal: { flexDirection: 'row', gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyCard: { borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptySub: { fontSize: 12, marginTop: 2 },
});
