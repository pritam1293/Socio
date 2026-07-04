import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MediaPicker({ mediaUrls, onChange, maxFiles = 4 }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: 12 }}>
      {mediaUrls.length === 0 ? (
        <TouchableOpacity style={[st.add, { borderColor: colors.border }]}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>+ Add Media</Text>
        </TouchableOpacity>
      ) : (
        <View style={st.row}>
          {mediaUrls.map((_, i) => (
            <View key={i} style={[st.thumb, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={st.thumbIcon}>📷</Text>
              <TouchableOpacity style={st.remove} onPress={() => {
                const u = [...mediaUrls]; u.splice(i, 1); onChange(u);
              }}>
                <Text style={st.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {mediaUrls.length < maxFiles && (
            <TouchableOpacity style={[st.thumb, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={st.thumbIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  add: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 80, height: 80, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  thumbIcon: { fontSize: 24 },
  remove: { position: 'absolute', top: -4, right: -4, backgroundColor: '#333', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#fff', fontSize: 10 },
});
