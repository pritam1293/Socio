import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as SocialService from '../services/social';
import { SocialAccount } from '../types';

const PLATFORMS = [
  { key: 'twitter', name: 'X', fullName: 'X (Twitter)', color: '#1DA1F2', bg: '#1DA1F2', icon: 'logo-twitter', iconSet: 'ion' as const },
  { key: 'reddit', name: 'Reddit', fullName: 'Reddit', color: '#FF4500', bg: '#FF4500', icon: 'logo-reddit', iconSet: 'ion' as const },
  { key: 'threads', name: 'Threads', fullName: 'Threads', color: '#000', bg: '#000', icon: 'chatbubbles', iconSet: 'ion' as const },
];

export default function ConnectAccountsScreen() {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  async function load() {
    try { setAccounts(await SocialService.getConnectedAccounts()); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function connect(platform: string) {
    try {
      const url = await SocialService.getConnectUrl(platform);
      Alert.alert('Connect', `Open in browser:\n\n${url}`);
    } catch (e: any) { Alert.alert('Error', e.message); }
  }

  async function disconnect(account: SocialAccount) {
    Alert.alert('Disconnect', `Disconnect ${account.platform}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: async () => {
        try { await SocialService.disconnectAccount(account.id); setAccounts(prev => prev.filter(a => a.id !== account.id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  }

  return (
    <View style={[cs.container, { backgroundColor: colors.background }]}>
      <View style={isDesktop ? { maxWidth: 700, alignSelf: 'center', width: '100%' } : undefined}>
        <Text style={[cs.title, { color: colors.text }]}>Connected Accounts</Text>
        <Text style={[cs.sub, { color: colors.textMuted }]}>
          Connect your social media accounts to start publishing from one place.
        </Text>

        <View style={[cs.grid, isDesktop && cs.gridWide]}>
          {PLATFORMS.map(p => {
            const acc = accounts.find(a => a.platform === p.key && a.is_active);
            const connected = !!acc;

            return (
              <View key={p.key} style={[cs.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={[cs.platformBadge, { backgroundColor: p.bg + '18' }]}>
                  <Ionicons name={p.icon as any} size={28} color={p.color} />
                </View>

                <Text style={[cs.platformName, { color: colors.text }]}>{p.fullName}</Text>

                <View style={[cs.statusDot, { backgroundColor: connected ? '#22C55E' : '#666' }]} />
                <Text style={[cs.statusText, { color: connected ? '#22C55E' : colors.textMuted }]}>
                  {connected ? 'Connected' : 'Not connected'}
                </Text>

                {connected ? (
                  <TouchableOpacity style={cs.disconnectBtn} onPress={() => disconnect(acc)}>
                    <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[cs.connectBtn, { backgroundColor: colors.accent }]} onPress={() => connect(p.key)}>
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 24, lineHeight: 20 },
  grid: { gap: 16 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    flex: 1, minWidth: 200, maxWidth: 320,
    borderRadius: 14, borderWidth: 1,
    padding: 24, alignItems: 'center',
  },
  platformBadge: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  platformName: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '500', marginBottom: 16 },
  connectBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  disconnectBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
});
