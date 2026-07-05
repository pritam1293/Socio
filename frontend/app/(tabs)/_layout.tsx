import { Tabs, Slot, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';

const SIDEBAR_W = 244;
const RIGHT_W = 300;
const BREAKPOINT = 1024;

export default function TabLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= BREAKPOINT;

  if (isDesktop) {
    return <DesktopTabLayout />;
  }

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tabs.Screen name="scheduled" options={{ title: 'Scheduled', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }} />
      <Tabs.Screen name="compose" options={{ title: 'New Post', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>➕</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </Tabs>
  );
}

function DesktopTabLayout() {
  const { colors, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const { loadDashboard, data } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const contentW = width - SIDEBAR_W - RIGHT_W;

  useEffect(() => { loadDashboard(); }, []);

  return (
    <View style={[ds.shell, { backgroundColor: colors.background }]}>
      {/* ---- LEFT SIDEBAR ---- */}
      <View style={[ds.sidebar, { width: SIDEBAR_W, backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <SidebarContent colors={colors} user={user} pathname={pathname} router={router} />
      </View>

      {/* ---- CENTER ---- */}
      <View style={[ds.center, { width: contentW }]}>
        <View style={[ds.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[ds.topTitle, { color: colors.text }]}>Socio</Text>
          <View style={ds.topRight}>
            <TouchableOpacity onPress={toggleTheme} style={[ds.iconBtn, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 15 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={[ds.avatar, { backgroundColor: colors.accent }]}>
              <Text style={ds.avatarText}>{(user?.full_name || 'S')[0].toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={ds.contentArea}>
          <Slot />
        </View>
      </View>

      {/* ---- RIGHT PANEL ---- */}
      <View style={[ds.right, { width: RIGHT_W, backgroundColor: colors.surface, borderLeftColor: colors.border }]}>
        <RightPanelContent colors={colors} data={data} />
      </View>
    </View>
  );
}

// ---- Sidebar ----
const navItems = [
  { href: '/(tabs)', label: 'Home', icon: 'home-outline' as const, iconFilled: 'home' as const },
  { href: '/(tabs)/compose', label: 'Create Post', icon: 'add-circle-outline' as const, iconFilled: 'add-circle' as const },
  { href: '/(tabs)/scheduled', label: 'Scheduled', icon: 'calendar-outline' as const, iconFilled: 'calendar' as const },
  { href: '/activity', label: 'Activity', icon: 'pulse-outline' as const, iconFilled: 'pulse' as const },
  { href: '/connect-accounts', label: 'Connected Accounts', icon: 'link-outline' as const, iconFilled: 'link' as const },
];

function SidebarContent({ colors, user, pathname, router }: any) {

  function isActive(href: string) {
    if (href === '/(tabs)') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
    return pathname.startsWith(href);
  }

  return (
    <View style={sb2.wrap}>
      <View style={sb2.header}>
        <View style={[sb2.logo, { backgroundColor: colors.accent }]}>
          <Text style={sb2.logoText}>S</Text>
        </View>
        <Text style={[sb2.brand, { color: colors.text }]}>Socio</Text>
      </View>

      <ScrollView style={sb2.nav} showsVerticalScrollIndicator={false}>
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <TouchableOpacity
              key={item.href}
              style={[sb2.item, active && { backgroundColor: colors.accent + '18' }]}
              onPress={() => router.replace(item.href as any)}
            >
              <Ionicons name={active ? item.iconFilled : item.icon} size={20} color={active ? colors.accent : colors.textMuted} />
              <Text style={[sb2.label, { color: active ? colors.accent : colors.textSecondary }, active && sb2.labelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---- Right Panel ----
function RightPanelContent({ colors, data }: any) {

  return (
    <ScrollView style={{ flex: 1, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={[ds.sectionTitle, { color: colors.text }]}>Overview</Text>
      <View style={ds.statsGrid}>
        <MiniStat label="Drafts" value={data?.overview?.drafts ?? 0} color="#60A5FA" />
        <MiniStat label="Scheduled" value={data?.overview?.scheduled ?? 0} color="#FBBF24" />
        <MiniStat label="Published" value={data?.overview?.published ?? 0} color="#4ADE80" />
        <MiniStat label="Failed" value={data?.overview?.failed ?? 0} color="#F87171" />
      </View>

      <Text style={[ds.sectionTitle, { color: colors.text, marginTop: 24 }]}>Upcoming</Text>
      {(!data?.upcoming || data.upcoming.length === 0) ? (
        <View style={[ds.emptyCard, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
          <Text style={{ fontSize: 20 }}>📅</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>No upcoming posts</Text>
        </View>
      ) : data.upcoming.slice(0, 3).map((p: any) => (
        <View key={p.id} style={[ds.miniCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }} numberOfLines={1}>{p.caption || 'Untitled'}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString() : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[ds.pill, { borderColor: '#262626' }]}>
      <Text style={[ds.pillValue, { color }]}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const ds = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  sidebar: { height: '100%', borderRightWidth: 1 },
  center: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 20, borderBottomWidth: 1 },
  topTitle: { fontSize: 16, fontWeight: '700' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  contentArea: { flex: 1, overflow: 'auto' as any },
  right: { height: '100%', borderLeftWidth: 1, paddingHorizontal: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { width: '47%', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  pillValue: { fontSize: 22, fontWeight: '800' },
  emptyCard: { borderRadius: 10, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 6 },
  miniCard: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
});

const sb2 = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 24 },
  logo: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  brand: { fontSize: 18, fontWeight: '800' },
  nav: { flex: 1, paddingHorizontal: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  label: { fontSize: 14, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
});
