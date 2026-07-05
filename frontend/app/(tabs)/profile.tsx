import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as SocialService from '../../services/social';
import { SocialAccount } from '../../types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => { SocialService.getConnectedAccounts().then(setAccounts).catch(() => {}); }, []);

  return (
    <ScrollView style={[ps.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 20, alignItems: isDesktop ? 'center' : undefined }}>
      <View style={isDesktop ? { maxWidth: 600, width: '100%' } : undefined}>
        <Text style={[ps.pageTitle, { color: colors.text }]}>My Profile</Text>

        {/* Avatar card */}
        <View style={[ps.avatarCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[ps.avatar, { backgroundColor: colors.accent }]}>
            <Text style={ps.avatarText}>{(user?.full_name || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={[ps.name, { color: colors.text }]}>{user?.full_name || 'User'}</Text>
          <Text style={[ps.email, { color: colors.textMuted }]}>{user?.email || ''}</Text>
          <View style={[ps.verifiedBadge, { backgroundColor: user?.email_verified ? '#14532D' : '#451A03' }]}>
            <Ionicons name={user?.email_verified ? 'checkmark-circle' : 'time'} size={14} color={user?.email_verified ? '#4ADE80' : '#FBBF24'} />
            <Text style={{ color: user?.email_verified ? '#4ADE80' : '#FBBF24', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
              {user?.email_verified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>

        {/* Connected accounts summary */}
        <View style={[ps.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[ps.sectionTitle, { color: colors.text }]}>Connected Accounts</Text>
          {accounts.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No accounts connected yet.</Text>
          ) : (
            <View style={{ gap: 10, marginTop: 12 }}>
              {accounts.filter(a => a.is_active).map(a => (
                <View key={a.id} style={ps.accountRow}>
                  <Ionicons name={a.platform === 'twitter' ? 'logo-twitter' : a.platform === 'reddit' ? 'logo-reddit' : 'chatbubbles'} size={18} color={a.platform === 'twitter' ? '#1DA1F2' : a.platform === 'reddit' ? '#FF4500' : '#000'} />
                  <Text style={[ps.accountLabel, { color: colors.text }]}>{a.platform}</Text>
                  <Text style={[ps.accountUser, { color: colors.textMuted }]}>@{a.platform_username || 'unknown'}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity onPress={() => router.push('/connect-accounts')} style={{ marginTop: 14 }}>
            <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>Manage accounts →</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={[ps.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[ps.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <TouchableOpacity style={ps.settingRow} onPress={toggleTheme}>
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.textSecondary} />
            <Text style={[ps.settingLabel, { color: colors.text }]}>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
            <Text style={[ps.settingHint, { color: colors.textMuted }]}>{mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[ps.logoutBtn, { borderColor: colors.error }]} onPress={() => {
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
          ]);
        }}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '700', fontSize: 14 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const ps = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 18 },
  avatarCard: {
    borderRadius: 14, borderWidth: 1,
    padding: 28, alignItems: 'center', marginBottom: 16,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 19, fontWeight: '700', marginBottom: 2 },
  email: { fontSize: 14, marginBottom: 10 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  section: {
    borderRadius: 14, borderWidth: 1,
    padding: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountLabel: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  accountUser: { fontSize: 13 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 4 },
  settingLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  settingHint: { fontSize: 12 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, paddingVertical: 14,
  },
});
