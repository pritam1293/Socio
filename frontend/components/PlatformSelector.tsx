import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const PLATFORMS = [
  { key: 'twitter', name: 'X (Twitter)', color: '#1DA1F2' },
  { key: 'reddit', name: 'Reddit', color: '#FF4500' },
  { key: 'threads', name: 'Threads', color: '#000' },
];

interface Props {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export default function PlatformSelector({ selected, onChange }: Props) {
  const { colors } = useTheme();

  function toggle(key: string) {
    selected.includes(key) ? onChange(selected.filter(s => s !== key)) : onChange([...selected, key]);
  }

  return (
    <View style={st.row}>
      {PLATFORMS.map(p => {
        const is = selected.includes(p.key);
        return (
          <TouchableOpacity key={p.key} onPress={() => toggle(p.key)}
            style={[st.chip, { borderColor: is ? p.color : colors.border, backgroundColor: is ? p.color : colors.inputBackground }]}>
            <Text style={[st.label, { color: is ? '#FFF' : colors.textSecondary }]}>{p.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  label: { fontWeight: '600', fontSize: 14 },
});
