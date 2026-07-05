import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verifyAndLogin } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function ResultView({
  icon, title, sub, countdown, countdownLabel, btnLabel, onPress,
  colors, isSuccess,
}: {
  icon: string; title: string; sub: string; countdown: number;
  countdownLabel: string; btnLabel: string; onPress: () => void;
  colors: any; isSuccess: boolean;
}) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 }}>
      <Animated.Text style={{ fontSize: 60, marginBottom: 16, transform: [{ scale }], opacity }}>{icon}</Animated.Text>
      <Animated.Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8, opacity }}>{title}</Animated.Text>
      <Animated.Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20, opacity }}>{sub}</Animated.Text>
      {countdown > 0 && <Animated.Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, opacity }}>{countdownLabel} in {countdown}s</Animated.Text>}
      <Animated.View style={{ opacity }}>
        <TouchableOpacity
          style={{
            backgroundColor: isSuccess ? colors.accent : 'transparent',
            paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, minWidth: 200, alignItems: 'center',
            borderWidth: isSuccess ? 0 : 1, borderColor: colors.border,
          }}
          onPress={onPress}
        >
          <Text style={{ color: isSuccess ? '#FFF' : colors.textSecondary, fontSize: 16, fontWeight: '700' }}>{btnLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { setUserDirectly } = useAuth();
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(7);
  const pendingUser = useRef<any>(null);

  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('No token provided'); return; }
    (async () => {
      try {
        const res = await verifyAndLogin(token);
        pendingUser.current = res.user;
        setState('success');
      } catch (e: any) { setState('error'); setErrorMsg(e.message); }
    })();
  }, [token]);

  function handleNavigate() {
    if (pendingUser.current) {
      setUserDirectly(pendingUser.current);
    }
    router.replace(state === 'success' ? '/(tabs)' : '/login');
  }

  useEffect(() => {
    if (state === 'verifying') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleNavigate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  if (state === 'verifying') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 12, fontSize: 14, color: colors.textMuted }}>Verifying...</Text>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <ResultView icon="🎉" title="You're in!" sub="Email verified. Redirecting to your dashboard."
        countdown={countdown} countdownLabel="Redirecting" btnLabel="Go to Dashboard"
        onPress={handleNavigate} colors={colors} isSuccess />
    );
  }

  return (
    <ResultView icon="❌" title="Verification Failed" sub={errorMsg}
      countdown={countdown} countdownLabel="Redirecting to Sign In" btnLabel="Back to Sign In"
      onPress={handleNavigate} colors={colors} isSuccess={false} />
  );
}
