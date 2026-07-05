import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { usePosts } from '../../contexts/PostContext';
import { useTheme } from '../../contexts/ThemeContext';
import PostCard from '../../components/PostCard';

export default function ScheduledScreen() {
  const { posts, isLoading, loadPosts } = usePosts();
  const { colors } = useTheme();

  useEffect(() => { loadPosts('scheduled'); }, []);

  if (!isLoading && (!posts || posts.length === 0)) {
    return (
      <View style={[st.empty, { backgroundColor: colors.background }]}>
        <Text style={st.emptyIcon}>📅</Text>
        <Text style={[st.emptyTitle, { color: colors.text }]}>No scheduled posts</Text>
        <Text style={[st.emptySub, { color: colors.textMuted }]}>Schedule posts to publish later</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={[st.list, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => loadPosts('scheduled')} tintColor={colors.accent} />}
    />
  );
}

const st = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 4 },
});
