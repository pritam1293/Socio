import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as SocialService from '../services/social';
import { SocialAccount } from '../types';

export default function ConnectAccountsScreen() {
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAccounts() {
    try { setAccounts(await SocialService.getConnectedAccounts()); } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAccounts(); }, []);

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

  const PLATFORMS = [
    { key: 'twitter', name: 'X (Twitter)', icon: '𝕏' },
    { key: 'reddit', name: 'Reddit', icon: '🔴' },
    { key: 'threads', name: 'Threads', icon: '🧵' },
  ];

  const s = StyleSheet.create({
    list: { padding: 16, backgroundColor: colors.background, flexGrow: 1 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    info: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    picon: { fontSize: 24 },
    pname: { fontSize: 15, fontWeight: '600', color: colors.text },
    pstatus: { fontSize: 12, marginTop: 2 },
    connected: { color: colors.success },
    disconnected: { color: colors.textMuted },
    cbtn: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    ctext: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    dbtn: { color: colors.error, fontWeight: '600', fontSize: 13, paddingVertical: 8 },
  });

  return (
    <FlatList
      data={PLATFORMS}
      keyExtractor={item => item.key}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAccounts} tintColor={colors.accent} />}
      renderItem={({ item }) => {
        const acc = accounts.find(a => a.platform === item.key && a.is_active);
        return (
          <View style={s.card}>
            <View style={s.info}>
              <Text style={s.picon}>{item.icon}</Text>
              <View>
                <Text style={s.pname}>{item.name}</Text>
                <Text style={[s.pstatus, acc ? s.connected : s.disconnected]}>{acc ? 'Connected' : 'Not connected'}</Text>
              </View>
            </View>
            {acc
              ? <TouchableOpacity onPress={() => disconnect(acc)}><Text style={s.dbtn}>Disconnect</Text></TouchableOpacity>
              : <TouchableOpacity style={s.cbtn} onPress={() => connect(item.key)}><Text style={s.ctext}>Connect</Text></TouchableOpacity>
            }
          </View>
        );
      }}
    />
  );
}
