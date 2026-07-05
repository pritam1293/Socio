import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verifyEmail } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('No token provided'); return; }
    (async () => {
      try { await verifyEmail(token); setState('success'); }
      catch (e: any) { setState('error'); setErrorMsg(e.message); }
    })();
  }, [token]);

  useEffect(() => {
    if (state !== 'success') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); router.replace('/login'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  function goToSignIn() {
    router.replace('/login');
  }

  const s = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
    icon: { fontSize: 60, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
    sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
    text: { marginTop: 12, fontSize: 14, color: colors.textMuted },
    countdown: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
    btn: { backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, minWidth: 200, alignItems: 'center' },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    outlineBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
    outlineText: { color: colors.textSecondary, fontWeight: '600' },
  });

  return (
    <View style={s.container}>
      {state === 'verifying' && (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={s.text}>Verifying your email...</Text>
        </>
      )}
      {state === 'success' && (
        <>
          <Text style={s.icon}>✅</Text>
          <Text style={s.title}>Email Verified!</Text>
          <Text style={s.sub}>Your account has been verified successfully.</Text>
          {countdown > 0 && (
            <Text style={s.countdown}>Redirecting in {countdown}s</Text>
          )}
          <TouchableOpacity style={s.btn} onPress={goToSignIn}>
            <Text style={s.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </>
      )}
      {state === 'error' && (
        <>
          <Text style={s.icon}>❌</Text>
          <Text style={s.title}>Verification Failed</Text>
          <Text style={s.sub}>{errorMsg}</Text>
          <TouchableOpacity style={s.outlineBtn} onPress={goToSignIn}>
            <Text style={s.outlineText}>Back to Sign In</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
