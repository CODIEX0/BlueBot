import React from 'react';
const { useState, useCallback, useEffect, useRef, useContext, createContext } = React;
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { MobileAuthProvider } from '@/contexts/MobileAuthContext';
import { MobileDatabaseProvider } from '@/contexts/MobileDatabaseContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { CryptoWalletProvider } from '@/contexts/SimpleCryptoWalletContext';
import SimpleAccessibilityButton from '@/components/SimpleAccessibilityButton';

export default function RootLayout() {
  useFrameworkReady();

  // Default accessibility settings
  const [currentLanguage, setCurrentLanguage] = useState({
    code: 'en-ZA',
    name: 'English (SA)',
    nativeName: 'English',
    flag: '🇿🇦',
    region: 'South Africa'
  });

  const [voiceSettings, setVoiceSettings] = useState({
    enabled: false,
    voiceId: 'professional',
    speed: 1.0,
    pitch: 1.0,
    language: 'en-ZA'
  });

  const handleLanguageChange = (language: any) => {
    setCurrentLanguage(language);
    setVoiceSettings(prev => ({ ...prev, language: language.code }));
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceSettings(prev => ({ ...prev, enabled }));
  };

  const handleVoiceSettingsChange = (settings: any) => {
    setVoiceSettings(settings);
  };

  return (
    <MobileAuthProvider>
      <MobileDatabaseProvider>
        <WalletProvider>
          <CryptoWalletProvider>
            <GamificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <SimpleAccessibilityButton
              onLanguageChange={handleLanguageChange}
              onVoiceToggle={handleVoiceToggle}
              currentLanguage={currentLanguage}
            />
            <StatusBar style="auto" />
          </GamificationProvider>
        </CryptoWalletProvider>
      </WalletProvider>
    </MobileDatabaseProvider>
  </MobileAuthProvider>
  );
}

