import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem } from '../services/storage';

const THEME_KEY = 'app_theme';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
  cardBackground: string;
  inputBackground: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light' | 'dark';
}

export const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#0D0D0D',
  surfaceSecondary: '#141414',
  surfaceElevated: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#888888',
  accent: '#6366F1',
  accentLight: '#818CF8',
  border: '#262626',
  borderLight: '#1F1F1F',
  error: '#EF4444',
  success: '#22C55E',
  cardBackground: '#0D0D0D',
  inputBackground: '#141414',
  tabBar: '#0A0A0A',
  tabBarBorder: '#1F1F1F',
  statusBar: 'light',
};

export const lightTheme: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  surfaceElevated: '#FFFFFF',
  text: '#0A0A0A',
  textSecondary: '#525252',
  textMuted: '#999999',
  accent: '#4F46E5',
  accentLight: '#6366F1',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  error: '#EF4444',
  success: '#22C55E',
  cardBackground: '#FFFFFF',
  inputBackground: '#F5F5F5',
  tabBar: '#FFFFFF',
  tabBarBorder: '#EBEBEB',
  statusBar: 'dark',
};

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      const saved = await getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      } else if (systemScheme) {
        setMode(systemScheme);
      }
    })();
  }, [systemScheme]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
