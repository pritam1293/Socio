import { Stack, Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PostProvider } from '../contexts/PostContext';
import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import { ToastProvider } from '../contexts/ToastContext';

const SB_W = 244;
const RP_W = 300;
const BP = 1024;

function useIsDesktop() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= BP;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
      <DashboardProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <AppShell />
        </ToastProvider>
      </DashboardProvider>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const isDesktop = useIsDesktop();

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-email" />
      </Stack>
    );
  }

  if (isDesktop) {
    return <DesktopRoot />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="connect-accounts" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

// ---- DESKTOP 3-COLUMN SHELL ----
function DesktopRoot() {
  const { colors, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data, loadDashboard } = useDashboard();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const contentW = width - SB_W - RP_W;

  useEffect(() => { loadDashboard(); }, []);

  return (
    <View style={[dr.shell, { backgroundColor: colors.background }]}>
      {/* LEFT SIDEBAR */}
      <View style={[dr.sb, { width: SB_W, backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <View style={dr.sbInner}>
          <View style={dr.sbHdr}>
            <View style={[dr.sbLogo, { backgroundColor: colors.accent }]}>
              <Text style={dr.sbLogoText}>S</Text>
            </View>
            <Text style={[dr.sbBrand, { color: colors.text }]}>Socio</Text>
          </View>
          <ScrollView style={dr.sbNav} showsVerticalScrollIndicator={false}>
            {NAV.map(item => {
              const active = item.match(pathname);
              return (
                <TouchableOpacity key={item.href} style={[dr.navItem, active && { backgroundColor: colors.accent + '18' }]}
                  onPress={() => router.replace(item.href as any)}>
                  <Ionicons name={active ? item.icon as any : item.iconOutline as any} size={20} color={active ? colors.accent : colors.textMuted} />
                  <Text style={[dr.navLabel, { color: active ? colors.accent : colors.textSecondary }, active && dr.navLabelOn]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[dr.sbFt, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={dr.navItem} onPress={() => { logout(); router.replace('/login'); }}>
              <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
              <Text style={[dr.navLabel, { color: colors.textSecondary }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CENTER */}
      <View style={[dr.ctr, { width: contentW }]}>
        <View style={[dr.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ width: 32 }} />
          <Text style={[dr.topTitle, { color: colors.text }]}>{getTitle(pathname)}</Text>
          <View style={dr.topRight}>
            <TouchableOpacity onPress={toggleTheme} style={[dr.iconBtn, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 15 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={[dr.avatar, { backgroundColor: colors.accent }]}>
              <Text style={dr.avatarText}>{(user?.full_name || 'S')[0].toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={dr.contentWrap}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="activity" />
            <Stack.Screen name="connect-accounts" />
            <Stack.Screen name="verify-email" />
            <Stack.Screen name="index" />
            </Stack>
        </View>
      </View>

      {/* RIGHT PANEL */}
      <View style={[dr.rp, { width: RP_W, backgroundColor: colors.surface, borderLeftColor: colors.border }]}>
        <ScrollView style={dr.rpInner} showsVerticalScrollIndicator={false}>
          <Text style={[dr.rpTitle, { color: colors.text }]}>Overview</Text>
          <View style={dr.pillRow}>
            <Pill label="Drafts" n={data?.overview?.drafts ?? 0} c="#60A5FA" />
            <Pill label="Scheduled" n={data?.overview?.scheduled ?? 0} c="#FBBF24" />
            <Pill label="Published" n={data?.overview?.published ?? 0} c="#4ADE80" />
            <Pill label="Failed" n={data?.overview?.failed ?? 0} c="#F87171" />
          </View>
          <Text style={[dr.rpTitle, { color: colors.text, marginTop: 24 }]}>Upcoming</Text>
          {(!data?.upcoming || data.upcoming.length === 0) ? (
            <View style={[dr.empty, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 18 }}>📅</Text><Text style={{ fontSize: 12, color: colors.textMuted }}>No upcoming</Text>
            </View>
          ) : data.upcoming.slice(0, 3).map((p: any) => (
            <View key={p.id} style={[dr.mini, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }} numberOfLines={1}>{p.caption || 'Untitled'}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString() : ''}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Pill({ label, n, c }: { label: string; n: number; c: string }) {
  return (
    <View style={[dr.pill, { borderColor: '#262626' }]}>
      <Text style={[dr.pillN, { color: c }]}>{n}</Text>
      <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const NAV = [
  { href: '/(tabs)', label: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline', match: (p: string) => p === '/' || p === '/(tabs)' || p === '/(tabs)/' },
  { href: '/(tabs)/compose', label: 'Create Post', icon: 'create', iconOutline: 'create-outline', match: (p: string) => p.includes('/compose') },
  { href: '/(tabs)/scheduled', label: 'Scheduled', icon: 'calendar', iconOutline: 'calendar-outline', match: (p: string) => p.includes('/scheduled') },
  { href: '/activity', label: 'Activity', icon: 'time', iconOutline: 'time-outline', match: (p: string) => p.startsWith('/activity') },
  { href: '/connect-accounts', label: 'Accounts', icon: 'link', iconOutline: 'link-outline', match: (p: string) => p.startsWith('/connect-accounts') },
  { href: '/(tabs)/profile', label: 'My Profile', icon: 'person-circle', iconOutline: 'person-circle-outline', match: (p: string) => p.includes('/profile') },
];

function getTitle(p: string) {
  if (p.includes('/compose')) return 'Create Post';
  if (p.includes('/scheduled')) return 'Scheduled Posts';
  if (p.startsWith('/activity')) return 'Activity';
  if (p.startsWith('/connect-accounts')) return 'Connected Accounts';
  if (p.includes('/profile')) return 'My Profile';
  return 'Dashboard';
}

const dr = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  sb: { height: '100%' as any, borderRightWidth: 1 },
  sbInner: { flex: 1, paddingTop: 16 },
  sbHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 24 },
  sbLogo: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sbLogoText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  sbBrand: { fontSize: 18, fontWeight: '800' },
  sbNav: { flex: 1, paddingHorizontal: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  navLabel: { fontSize: 14, fontWeight: '500' },
  navLabelOn: { fontWeight: '700' },
  sbFt: { borderTopWidth: 1, paddingVertical: 12, paddingHorizontal: 8 },
  ctr: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 20, borderBottomWidth: 1 },
  topTitle: { fontSize: 16, fontWeight: '700' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  contentWrap: { flex: 1, overflow: 'auto' as any },
  rp: { height: '100%' as any, borderLeftWidth: 1, paddingHorizontal: 14 },
  rpInner: { flex: 1, paddingTop: 20 },
  rpTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { width: '47%', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  pillN: { fontSize: 22, fontWeight: '800' },
  empty: { borderRadius: 10, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 6 },
  mini: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
});
