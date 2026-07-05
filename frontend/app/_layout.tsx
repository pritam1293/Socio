import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PostProvider } from '../contexts/PostContext';
import { DashboardProvider } from '../contexts/DashboardContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
          <DashboardProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="verify-email" />
              <Stack.Screen name="activity" options={{ headerShown: false }} />
              <Stack.Screen name="connect-accounts" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </DashboardProvider>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
