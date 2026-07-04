import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    avatarText: { fontSize: 26, fontWeight: '800', color: colors.accent },
    name: { fontSize: 19, fontWeight: '700', color: colors.text, marginBottom: 2 },
    email: { fontSize: 14, color: colors.textMuted },
    menuItem: { backgroundColor: colors.cardBackground, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    menuIcon: { fontSize: 20, marginRight: 12 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
    chevron: { fontSize: 20, color: colors.textMuted },
    divider: { height: 10 },
    logoutBtn: { marginTop: 24, borderWidth: 1, borderColor: colors.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    logoutText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  });

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.full_name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{user?.full_name || 'User'}</Text>
        <Text style={s.email}>{user?.email || ''}</Text>
      </View>

      <Link href="/connect-accounts" asChild>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>🔗</Text><Text style={s.menuText}>Connected Accounts</Text><Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </Link>
      <View style={s.divider} />
      <TouchableOpacity style={s.menuItem} onPress={toggleTheme}>
        <Text style={s.menuIcon}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
        <Text style={s.menuText}>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>
      <View style={s.divider} />
      <TouchableOpacity style={s.menuItem}>
        <Text style={s.menuIcon}>⚙️</Text><Text style={s.menuText}>Settings</Text><Text style={s.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.logoutBtn} onPress={() => {
        Alert.alert('Sign Out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
        ]);
      }}>
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
