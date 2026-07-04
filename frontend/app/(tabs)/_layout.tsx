import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.tabBar,
        borderTopColor: colors.tabBarBorder,
      },
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tabs.Screen name="scheduled" options={{ title: 'Scheduled', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }} />
      <Tabs.Screen name="compose" options={{ title: 'New Post', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>➕</Text> }} />
      <Tabs.Screen name="profile" options={{ headerShown: false, title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </Tabs>
  );
}
