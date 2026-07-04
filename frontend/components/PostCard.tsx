import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Post } from '../types';

function statusStyle(status: string, c: any) {
  switch (status) {
    case 'draft': return { bg: c.surfaceSecondary, fg: c.textMuted };
    case 'scheduled': return { bg: '#1E3A5F', fg: '#60A5FA' };
    case 'published': return { bg: '#14532D', fg: '#4ADE80' };
    case 'failed': return { bg: '#450A0A', fg: '#F87171' };
    case 'partial': return { bg: '#451A03', fg: '#FBBF24' };
    default: return { bg: c.surfaceSecondary, fg: c.textMuted };
  }
}

interface Props {
  post: Post;
  onTap?: () => void;
}

export default function PostCard({ post, onTap }: Props) {
  const { colors } = useTheme();
  const s = statusStyle(post.status, colors);

  return (
    <TouchableOpacity onPress={onTap} style={[cardStyles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} activeOpacity={0.7}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.badge, { backgroundColor: s.bg }]}>
          <Text style={[cardStyles.badgeText, { color: s.fg }]}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </Text>
        </View>
        {post.scheduled_at && (
          <Text style={[cardStyles.date, { color: colors.textMuted }]}>
            {new Date(post.scheduled_at).toLocaleString()}
          </Text>
        )}
      </View>
      {post.caption ? (
        <Text style={[cardStyles.caption, { color: colors.text }]} numberOfLines={3}>
          {post.caption}
        </Text>
      ) : null}
      {post.hashtags.length > 0 && (
        <View style={cardStyles.hashtags}>
          {post.hashtags.map((tag, i) => (
            <Text key={i} style={[cardStyles.hashtag, { color: colors.accent }]}>#{tag}</Text>
          ))}
        </View>
      )}
      <View style={cardStyles.platforms}>
        {post.platforms.map((p) => {
          const icon = p.platform === 'twitter' ? '@' : p.platform === 'reddit' ? 'r/' : 'T';
          const pColor = p.status === 'published' ? colors.success : p.status === 'failed' ? colors.error : colors.textMuted;
          return <Text key={p.id} style={{ fontSize: 18, fontWeight: '700', color: pColor }}>{icon}</Text>;
        })}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12 },
  caption: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  hashtags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  hashtag: { fontWeight: '500', fontSize: 13 },
  platforms: { flexDirection: 'row', gap: 12 },
});
