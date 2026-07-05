import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { usePosts } from '../contexts/PostContext';
import PostCard from '../components/PostCard';

type Filter = 'all' | 'published' | 'scheduled' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'failed', label: 'Failed' },
];

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { posts, isLoading, loadPosts } = usePosts();
  const [filter, setFilter] = useState<Filter>('all');
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  useEffect(() => { loadPosts(); }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  return (
    <ScrollView style={[act.container, { backgroundColor: colors.background }]}>
      <View style={isDesktop ? { maxWidth: 700, alignSelf: 'center', width: '100%' } : undefined}>
        <Text style={[act.title, { color: colors.text }]}>Activity</Text>
        <Text style={[act.sub, { color: colors.textMuted }]}>Track all your posts across every platform.</Text>

        <View style={act.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[act.filterBtn, { backgroundColor: filter === f.key ? colors.accent : colors.surfaceSecondary }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[act.filterLabel, { color: filter === f.key ? '#FFF' : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={[act.empty, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>No activity yet</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Posts will appear here once published or scheduled.</Text>
          </View>
        ) : (
          filtered.map(p => <PostCard key={p.id} post={p} />)
        )}
      </View>
    </ScrollView>
  );
}

const act = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', marginTop: 20 },
});
