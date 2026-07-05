import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Alert, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { requestLogin, resendVerification } from '../services/auth';

const CARD_MAX_WIDTH = 440;

export default function LoginScreen() {
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { width: screenW } = useWindowDimensions();
  const cardW = Math.min(screenW - 48, CARD_MAX_WIDTH);
  const toggleW = (cardW - 40 - 6) / 2;

  const [tab, setTab] = useState<'signin' | 'signup'>(params.tab === 'signup' ? 'signup' : 'signin');
  const slideAnim = useRef(new Animated.Value(params.tab === 'signup' ? 1 : 0)).current;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [sentMode, setSentMode] = useState<'signin' | 'signup'>('signin');

  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function switchTab(to: 'signin' | 'signup') {
    if (to === tab) return;
    Animated.spring(slideAnim, { toValue: to === 'signup' ? 1 : 0, useNativeDriver: false, friction: 9, tension: 120 }).start();
    setTab(to);
  }

  const sliderX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, toggleW] });

  async function handleSignIn() {
    if (!email.trim()) { Alert.alert('', 'Enter your email'); return; }
    setSubmitting(true);
    try {
      await requestLogin(email.trim());
      setSentEmail(email.trim());
      setSentMode('signin');
      setSent(true);
    } catch (e: any) { Alert.alert('', e.message); }
    finally { setSubmitting(false); }
  }

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim()) { Alert.alert('', 'Fill in all fields'); return; }
    setSubmitting(true);
    try {
      await register(email.trim(), fullName.trim());
      setSentEmail(email.trim());
      setSentMode('signup');
      setSent(true);
    } catch (e: any) { Alert.alert('', e.message); }
    finally { setSubmitting(false); }
  }

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(45);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (sent) startCooldown();
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [sent]);

  async function handleResend() {
    setResending(true); setResendMsg(null);
    try {
      await resendVerification(sentEmail);
      setResendMsg({ text: 'Email sent successfully.', ok: true });
      startCooldown();
    } catch (e: any) { setResendMsg({ text: e.message || 'Failed', ok: false }); }
    finally { setResending(false); }
  }

  if (sent) {
    return (
      <View style={[vrf.full, { backgroundColor: colors.background }]}>
        <ThemeToggle mode={mode} onPress={toggleTheme} colors={colors} />
        <View style={[vrf.centered, vrf.verifyScreen, { width: cardW }]}>
          <View style={[vrf.verifyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={vrf.verifyIcon}>📧</Text>
            <Text style={[vrf.verifyTitle, { color: colors.text }]}>Check Your Email</Text>
            <Text style={[vrf.verifyBody, { color: colors.textSecondary }]}>
              {sentMode === 'signup' ? 'A verification link was sent to' : 'A magic link was sent to'}{' '}
              <Text style={{ fontWeight: '700', color: colors.accent }}>{sentEmail}</Text>
            </Text>
            <Text style={[vrf.verifyHint, { color: colors.textMuted }]}>
              Click the link in the email to {sentMode === 'signup' ? 'activate your account' : 'sign in'}.
            </Text>

            <View style={[vrf.divider, { backgroundColor: colors.border }]} />
            <Text style={[vrf.resendTitle, { color: colors.text }]}>Didn't receive the email?</Text>

            {resendMsg && (
              <Text style={[vrf.resendMsg, { color: resendMsg.ok ? colors.success : colors.error }]}>{resendMsg.text}</Text>
            )}

            {resendCooldown > 0 ? (
              <View style={[vrf.cooldownBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>Resend in {resendCooldown}s</Text>
              </View>
            ) : (
              <TouchableOpacity style={[vrf.resendBtn, { backgroundColor: colors.accent }, resending && { opacity: 0.5 }]} onPress={handleResend} disabled={resending}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{resending ? 'Sending…' : 'Resend'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[vrf.outlineBtn, { borderColor: colors.border, marginTop: 12 }]} onPress={() => { setSent(false); setResendMsg(null); }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const inputColor = { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border };

  return (
    <KeyboardAvoidingView style={[vrf.full, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemeToggle mode={mode} onPress={toggleTheme} colors={colors} />
      <ScrollView contentContainerStyle={vrf.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[vrf.centered, { width: cardW }]}>
          <View style={vrf.header}>
            <View style={[vrf.logo, { backgroundColor: colors.accent }]}>
              <Text style={vrf.logoText}>S</Text>
            </View>
            <Text style={[vrf.brand, { color: colors.text }]}>Socio</Text>
            <Text style={[vrf.tagline, { color: colors.textMuted }]}>One post. Every platform.</Text>
          </View>

          <View style={[vrf.card, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: '#000' }]}>
            <View style={[vrf.toggleBg, { backgroundColor: colors.surfaceSecondary }]}>
              <Animated.View style={[vrf.toggleSlider, { left: sliderX, width: toggleW, backgroundColor: colors.accent }]} />
              <TouchableOpacity style={vrf.toggleBtn} onPress={() => switchTab('signin')} activeOpacity={1}>
                <Text style={[vrf.toggleLabel, tab === 'signin' && vrf.toggleLabelActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={vrf.toggleBtn} onPress={() => switchTab('signup')} activeOpacity={1}>
                <Text style={[vrf.toggleLabel, tab === 'signup' && vrf.toggleLabelActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {tab === 'signin' ? (
              <View style={vrf.formPanel}>
                <Text style={[vrf.hint, { color: colors.textMuted }]}>Enter your email and we'll send you a magic link.</Text>
                <TextInput style={[vrf.input, inputColor]} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
                <View style={vrf.gap} />
                <TouchableOpacity style={[vrf.submit, { backgroundColor: colors.accent }, submitting && { opacity: 0.5 }]} onPress={handleSignIn} disabled={submitting}>
                  <Text style={vrf.submitText}>{submitting ? 'Sending…' : 'Continue with Email'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={vrf.formPanel}>
                <Text style={[vrf.hint, { color: colors.textMuted }]}>Create your account. No password needed.</Text>
                <TextInput style={[vrf.input, inputColor]} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.textMuted} autoCapitalize="words" />
                <View style={vrf.gap} />
                <TextInput style={[vrf.input, inputColor]} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
                <View style={vrf.gap} />
                <TouchableOpacity style={[vrf.submit, { backgroundColor: colors.accent }, submitting && { opacity: 0.5 }]} onPress={handleSignUp} disabled={submitting}>
                  <Text style={vrf.submitText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={[vrf.footer, { color: colors.textMuted }]}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: colors.accent, fontWeight: '700' }} onPress={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}>
              {tab === 'signin' ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ThemeToggle({ mode, onPress, colors }: { mode: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[vrf.themeBtn, { backgroundColor: colors.surfaceSecondary + '99' }]}>
      <Text style={{ fontSize: 16 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

const vrf = StyleSheet.create({
  full: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  centered: { alignSelf: 'center' },
  themeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 100, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: '#4F46E5' },
  logoText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  brand: { fontSize: 22, fontWeight: '800' },
  tagline: { fontSize: 12, marginTop: 2 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  toggleBg: { flexDirection: 'row', borderRadius: 10, padding: 3, height: 40, marginBottom: 18, overflow: 'hidden' },
  toggleSlider: { position: 'absolute', top: 3, bottom: 3, borderRadius: 9 },
  toggleBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#999' },
  toggleLabelActive: { color: '#FFF' },
  formPanel: { width: '100%' },
  hint: { fontSize: 13, marginBottom: 14, textAlign: 'center' },
  gap: { height: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, height: 50 },
  submit: { height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  submitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 16, fontSize: 13 },
  verifyScreen: { flex: 1, justifyContent: 'center' },
  verifyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', width: '100%' },
  verifyIcon: { fontSize: 44, marginBottom: 12 },
  verifyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  verifyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  verifyHint: { fontSize: 12, marginBottom: 18 },
  divider: { width: '100%', height: 1, marginBottom: 16 },
  resendTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  resendMsg: { fontSize: 13, textAlign: 'center', marginBottom: 10 },
  cooldownBtn: { borderWidth: 1, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 10, alignItems: 'center', width: '50%' },
  resendBtn: { paddingVertical: 13, paddingHorizontal: 24, borderRadius: 10, alignItems: 'center', width: '50%' },
  outlineBtn: { borderWidth: 1, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8 },
});
