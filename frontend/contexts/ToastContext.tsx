import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ---- Toast Component ----
function ToastCard({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const slide = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, { toValue: 0, duration: 5000, useNativeDriver: false }).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide, { toValue: 120, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const isSuccess = item.type === 'success';
  const bg = isSuccess ? '#14532D' : '#450A0A';
  const fg = isSuccess ? '#4ADE80' : '#F87171';
  const bar = isSuccess ? '#22C55E' : '#EF4444';
  const icon = isSuccess ? 'checkmark-circle' : 'alert-circle';

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const maxW = Math.min(width - 32, 420);

  const progressW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View
      style={[
        st.card,
        { backgroundColor: bg, width: maxW, transform: [{ translateX: isDesktop ? slide : 0 }, { translateY: isDesktop ? 0 : slide }], opacity },
      ]}
    >
      <View style={st.row}>
        <Ionicons name={icon as any} size={18} color={fg} />
        <Text style={[st.msg, { color: fg }]} numberOfLines={2}>{item.message}</Text>
        <TouchableOpacity onPress={onDone} hitSlop={8}>
          <Ionicons name="close" size={16} color={fg + '99'} />
        </TouchableOpacity>
      </View>
      <View style={[st.progressBg, { backgroundColor: bar + '30' }]}>
        <Animated.View style={[st.progressBar, { width: progressW, backgroundColor: bar }]} />
      </View>
    </Animated.View>
  );
}

// ---- Provider ----
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: 'success' | 'error') => {
    const id = String(++idRef.current);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const success = useCallback((msg: string) => add(msg, 'success'), [add]);
  const error = useCallback((msg: string) => add(msg, 'error'), [add]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <View style={st.container} pointerEvents="box-none">
        {toasts.map(item => (
          <ToastCard key={item.id} item={item} onDone={() => remove(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const st = StyleSheet.create({
  container: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 16, gap: 10, pointerEvents: 'none' as any,
  },
  card: {
    borderRadius: 10, overflow: 'hidden',
    pointerEvents: 'auto' as any,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, paddingBottom: 12 },
  msg: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  progressBg: { height: 3, width: '100%', backgroundColor: 'transparent' },
  progressBar: { height: 3, borderRadius: 2 },
});
