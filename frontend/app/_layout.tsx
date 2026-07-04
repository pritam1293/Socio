import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PostProvider } from '../contexts/PostContext';
import { DashboardProvider } from '../contexts/DashboardContext';

function AppLayout() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style={colors.statusBar === 'dark' ? 'dark' : 'light'} />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-email" options={{ headerShown: true, title: 'Verify Email', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
        <Stack.Screen name="connect-accounts" options={{ headerShown: true, title: 'Connected Accounts', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
          <DashboardProvider>
            <AppLayout />
          </DashboardProvider>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
