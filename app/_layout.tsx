import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { GamificationProvider } from '@/contexts/GamificationContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <DatabaseProvider>
        <WalletProvider>
          <GamificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </GamificationProvider>
        </WalletProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}