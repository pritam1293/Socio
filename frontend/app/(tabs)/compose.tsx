import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { usePosts } from '../../contexts/PostContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import PlatformSelector from '../../components/PlatformSelector';
import MediaPicker from '../../components/MediaPicker';

export default function ComposeScreen() {
  const { createPost, publishNow, isLoading } = usePosts();
  const { loadDashboard } = useDashboard();
  const { colors } = useTheme();
  const router = useRouter();
  const s = createStyles(colors);

  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) { setHashtags([...hashtags, tag]); setHashtagInput(''); }
  }

  async function handleSubmit() {
    if (platforms.length === 0) { Alert.alert('Error', 'Select at least one platform'); return; }
    const post = await createPost({
      caption: caption.trim() || undefined,
      hashtags, platforms,
      scheduled_at: publishImmediately ? undefined : scheduleDate || undefined,
    });
    if (post) {
      if (publishImmediately) await publishNow(post.id);
      await loadDashboard();
      Alert.alert('Success', publishImmediately ? 'Post published!' : 'Post scheduled!');
      router.back();
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.inputLabel}>Caption</Text>
      <TextInput style={[s.input, s.captionInput]} value={caption} onChangeText={setCaption} placeholder="What's on your mind?" placeholderTextColor={colors.textMuted} multiline maxLength={280} />
      <Text style={s.chars}>{caption.length}/280</Text>
      <View style={s.hashtagsRow}>
        {hashtags.map((tag, i) => (
          <TouchableOpacity key={i} style={s.tagChip} onPress={() => setHashtags(hashtags.filter(t => t !== tag))}>
            <Text style={s.tagText}>#{tag} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.hashtagInputRow}>
        <TextInput style={[s.input, { flex: 1 }]} value={hashtagInput} onChangeText={setHashtagInput} placeholder="Add hashtag" placeholderTextColor={colors.textMuted} onSubmitEditing={addHashtag} />
        <TouchableOpacity onPress={addHashtag} style={s.addTagBtn}><Text style={s.addTagText}>Add</Text></TouchableOpacity>
      </View>
      <Text style={[s.inputLabel, { marginTop: 16 }]}>Publish to</Text>
      <PlatformSelector selected={platforms} onChange={setPlatforms} />
      <View style={s.switchRow}>
        <Text style={[s.inputLabel, { marginTop: 0 }]}>Publish immediately</Text>
        <Switch value={publishImmediately} onValueChange={setPublishImmediately} trackColor={{ true: colors.accent }} />
      </View>
      {!publishImmediately && <TextInput style={s.input} value={scheduleDate} onChangeText={setScheduleDate} placeholder="YYYY-MM-DDTHH:MM:00Z (ISO)" placeholderTextColor={colors.textMuted} />}
      <MediaPicker mediaUrls={mediaUrls} onChange={setMediaUrls} />
      <TouchableOpacity style={[s.submitBtn, isLoading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={isLoading}>
        <Text style={s.submitText}>{isLoading ? 'Posting...' : publishImmediately ? 'Publish Now' : 'Schedule Post'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(c: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: c.inputBackground, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text },
    captionInput: { minHeight: 100, textAlignVertical: 'top' },
    chars: { fontSize: 12, color: c.textMuted, textAlign: 'right', marginTop: 2 },
    hashtagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tagChip: { backgroundColor: c.accent + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    tagText: { color: c.accent, fontSize: 13, fontWeight: '500' },
    hashtagInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    addTagBtn: { backgroundColor: c.accent, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
    addTagText: { color: '#FFF', fontWeight: '600' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    submitBtn: { backgroundColor: c.accent, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  });
}
