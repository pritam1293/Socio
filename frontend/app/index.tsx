import { Redirect, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const FEATURES = [
  { icon: '📱', title: 'One Composer, All Platforms', desc: 'Write once, publish to X, Reddit, Threads and more.' },
  { icon: '⏰', title: 'Smart Scheduling', desc: 'Schedule posts for any time. Queue them up and let Socio handle the rest.' },
  { icon: '📊', title: 'Unified Dashboard', desc: 'Track drafts, scheduled, published, and failed posts in one view.' },
  { icon: '🔗', title: 'Easy Account Linking', desc: 'Connect your social accounts with OAuth. Secure token storage, no passwords.' },
  { icon: '🔄', title: 'Cross-Platform Status', desc: 'See which platforms succeeded or failed for every post at a glance.' },
  { icon: '🎨', title: 'Dark & Light Mode', desc: 'Beautiful Material 3 design with full dark mode support.' },
];

const CARD_MAX = 1100;

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const contentW = Math.min(width - 48, CARD_MAX);

  if (isLoading) {
    return (
      <View style={[st.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[st.full, { backgroundColor: colors.background }]}>
      {/* Theme toggle */}
      <TouchableOpacity onPress={toggleTheme} style={[st.themeBtn, { backgroundColor: colors.surfaceSecondary + '99' }]}>
        <Text style={{ fontSize: 16 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* ---------- NAV ---------- */}
        <View style={[st.nav, { width: contentW }]}>
          <View style={st.navLeft}>
            <View style={[st.navLogo, { backgroundColor: colors.accent }]}>
              <Text style={st.navLogoText}>S</Text>
            </View>
            <Text style={[st.navBrand, { color: colors.text }]}>Socio</Text>
          </View>
          <View style={st.navRight}>
            <TouchableOpacity onPress={() => router.replace('/login?tab=signin')} style={[st.navBtn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/login?tab=signup')} style={[st.navBtnPrimary, { backgroundColor: colors.accent }]}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------- HERO ---------- */}
        <View style={[st.hero, { width: contentW }]}>
          <Text style={[st.heroBadge, { color: colors.accent, backgroundColor: colors.accent + '14', borderColor: colors.accent + '30' }]}>
            Now with multi-platform scheduling
          </Text>
          <Text style={[st.heroTitle, { color: colors.text }]}>
            Publish everywhere.{'\n'}From one place.
          </Text>
          <Text style={[st.heroSub, { color: colors.textSecondary }]}>
            Socio lets you create a post once and publish it to X, Reddit, Threads, and more —
            instantly or scheduled for later. No more jumping between apps.
          </Text>
          <View style={st.heroBtns}>
            <TouchableOpacity onPress={() => router.replace('/login?tab=signup')} style={[st.heroPrimary, { backgroundColor: colors.accent }]}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Start Publishing Free</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/login?tab=signin')} style={[st.heroSecondary, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>View Demo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ---------- FEATURES ---------- */}
        <View style={[st.featuresWrap, { width: contentW }]}>
          <Text style={[st.sectionTitle, { color: colors.text }]}>Everything you need</Text>
          <Text style={[st.sectionSub, { color: colors.textMuted }]}>
            One dashboard to manage all your social media content.
          </Text>
          <View style={[st.grid, isWide ? st.gridWide : undefined]}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[st.featCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={st.featIcon}>{f.icon}</Text>
                <Text style={[st.featTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[st.featDesc, { color: colors.textMuted }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---------- CTA ---------- */}
        <View style={[st.cta, { width: contentW, backgroundColor: colors.accent }]}>
          <Text style={st.ctaTitle}>Ready to simplify your social media?</Text>
          <Text style={st.ctaSub}>
            Join thousands managing their posts from one dashboard.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/login?tab=signup')} style={st.ctaBtn}>
            <Text style={st.ctaBtnText}>Get Started — It's Free</Text>
          </TouchableOpacity>
        </View>

        {/* ---------- FOOTER ---------- */}
        <View style={[st.footer, { borderTopColor: colors.border }]}>
          <Text style={[st.footerText, { color: colors.textMuted }]}>© 2025 Socio. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  full: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { alignItems: 'center', paddingBottom: 40 },
  themeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 100,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Nav */
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 4 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  navLogoText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  navBrand: { fontSize: 18, fontWeight: '800' },
  navRight: { flexDirection: 'row', gap: 10 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  navBtnPrimary: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },

  /* Hero */
  hero: { alignItems: 'center', paddingVertical: 60 },
  heroBadge: {
    fontSize: 12, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginBottom: 20, overflow: 'hidden',
  },
  heroTitle: { fontSize: 48, fontWeight: '900', textAlign: 'center', lineHeight: 56, letterSpacing: -1 },
  heroSub: { fontSize: 16, textAlign: 'center', lineHeight: 26, maxWidth: 600, marginTop: 16 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  heroPrimary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  heroSecondary: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10, borderWidth: 1 },

  /* Features */
  featuresWrap: { paddingVertical: 60 },
  sectionTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sectionSub: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 32 },
  grid: { gap: 16 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' } as any,
  featCard: {
    flex: 1, minWidth: 280,
    borderRadius: 14, borderWidth: 1,
    padding: 24,
  },
  featIcon: { fontSize: 28, marginBottom: 12 },
  featTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  featDesc: { fontSize: 13, lineHeight: 20 },

  /* CTA */
  cta: { borderRadius: 20, padding: 40, alignItems: 'center', marginTop: 40 },
  ctaTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  ctaBtn: { backgroundColor: '#FFF', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  ctaBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 15 },

  /* Footer */
  footer: { width: '100%', paddingVertical: 24, borderTopWidth: 1, alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 12 },
});
