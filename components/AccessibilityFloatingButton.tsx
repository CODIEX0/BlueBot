/**
 * Accessibility Floating Button
 * Provides language selection and voice interaction for BlueBot
 */

import React from 'react';
const { useState, useEffect, useRef } = React;
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { Dimensions } from 'react-native';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

interface VoiceSettings {
  enabled: boolean;
  voiceId: string;
  speed: number;
  pitch: number;
  language: string;
}

const AFRICAN_LANGUAGES: Language[] = [
  // South African Official Languages
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', region: 'South Africa' },
  { code: 'en-ZA', name: 'English (SA)', nativeName: 'English', flag: '🇿🇦', region: 'South Africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', region: 'South Africa' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', region: 'South Africa' },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho', flag: '🇿🇦', region: 'South Africa' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', flag: '🇿🇦', region: 'South Africa' },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati', flag: '🇿🇦', region: 'South Africa' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa', flag: '🇿🇦', region: 'South Africa' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', flag: '🇿🇦', region: 'South Africa' },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', flag: '🇿🇦', region: 'South Africa' },
  { code: 'nso', name: 'Northern Sotho', nativeName: 'Sesotho sa Leboa', flag: '🇿🇦', region: 'South Africa' },

  // Other Major African Languages
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', region: 'East Africa' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', region: 'Ethiopia' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', region: 'West Africa' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', region: 'Nigeria' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬', region: 'Nigeria' },
  { code: 'ar-MA', name: 'Arabic (Morocco)', nativeName: 'العربية', flag: '🇲🇦', region: 'North Africa' },
  { code: 'fr-SN', name: 'French (Senegal)', nativeName: 'Français', flag: '🇸🇳', region: 'West Africa' },
  { code: 'pt-AO', name: 'Portuguese (Angola)', nativeName: 'Português', flag: '🇦🇴', region: 'Southern Africa' },
];

const VOICE_PERSONALITIES = [
  { id: 'professional', name: 'Professional', description: 'Clear and formal financial advisor' },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable teacher' },
  { id: 'energetic', name: 'Energetic', description: 'Enthusiastic and motivating' },
  { id: 'calm', name: 'Calm', description: 'Soothing and reassuring' },
];

interface AccessibilityFloatingButtonProps {
  onLanguageChange: (language: Language) => void;
  onVoiceToggle: (enabled: boolean) => void;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  currentLanguage: Language;
  voiceSettings: VoiceSettings;
}

export default function AccessibilityFloatingButton({
  onLanguageChange,
  onVoiceToggle,
  onVoiceSettingsChange,
  currentLanguage,
  voiceSettings
}: AccessibilityFloatingButtonProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  
  const buttonPosition = React.useRef(new Animated.ValueXY({ x: 20, y: 100 })).current;
  const menuAnimation = React.useRef(new Animated.Value(0)).current;
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Pan responder for draggable button
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        buttonPosition.setOffset({
          x: (buttonPosition.x as any)._value,
          y: (buttonPosition.y as any)._value,
        });
        Vibration.vibrate(50);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: buttonPosition.x, dy: buttonPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        buttonPosition.flattenOffset();
        
        // Snap to edges
        const finalX = gestureState.moveX < screenWidth / 2 ? 20 : screenWidth - 80;
        const finalY = Math.max(100, Math.min(screenHeight - 200, gestureState.moveY));
        
        Animated.spring(buttonPosition, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      },
    })
  ).current;

  // Pulse animation for listening state
  React.useEffect(() => {
    if (isListening || isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isListening, isSpeaking]);

  // Menu animation
  const toggleMenu = () => {
    const toValue = showMenu ? 0 : 1;
    setShowMenu(!showMenu);
    
    Animated.spring(menuAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // Voice interaction functions
  const startListening = async () => {
    try {
      setIsListening(true);
      // Here you would integrate with Expo Speech or react-native-voice
      // For now, we'll simulate the functionality
      
      setTimeout(() => {
        setIsListening(false);
        Alert.alert('Voice Input', 'Voice recognition would be implemented here');
      }, 3000);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Could not start voice recognition');
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      // Here you would integrate with ElevenLabs API or Expo Speech
      // For now, we'll simulate the functionality
      
      setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  };

  // Group languages by region
  const groupedLanguages = AFRICAN_LANGUAGES.reduce((groups, language) => {
    const region = language.region;
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(language);
    return groups;
  }, {} as Record<string, Language[]>);

  return (
    <>
      {/* Main Floating Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { translateX: buttonPosition.x },
              { translateY: buttonPosition.y },
              { scale: pulseAnimation },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.mainButton,
            isListening && styles.listeningButton,
            isSpeaking && styles.speakingButton,
          ]}
          onPress={toggleMenu}
          onLongPress={startListening}
          delayLongPress={500}
        >
          <Text style={styles.buttonEmoji}>
            {isListening ? '🎤' : isSpeaking ? '🔊' : '🌍'}
          </Text>
        </TouchableOpacity>

        {/* Action Menu */}
        {showMenu && (
          <Animated.View
            style={[
              styles.actionMenu,
              {
                transform: [
                  {
                    scale: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
                opacity: menuAnimation,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowLanguageModal(true);
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuEmoji}>🌐</Text>
              <Text style={styles.menuText}>Language</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowVoiceModal(true);
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuEmoji}>🎙️</Text>
              <Text style={styles.menuText}>Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                startListening();
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuEmoji}>🎤</Text>
              <Text style={styles.menuText}>Listen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                speakText('Hello! I am BlueBot, your financial assistant. How can I help you today?');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuEmoji}>🔊</Text>
              <Text style={styles.menuText}>Speak</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Language</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.currentLanguageSection}>
              <Text style={styles.sectionTitle}>Current Language</Text>
              <View style={styles.languageItem}>
                <Text style={styles.languageFlag}>{currentLanguage.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{currentLanguage.name}</Text>
                  <Text style={styles.languageNative}>{currentLanguage.nativeName}</Text>
                </View>
                <Text style={styles.activeIndicator}>✓</Text>
              </View>
            </View>

            {Object.entries(groupedLanguages).map(([region, languages]) => (
              <View key={region} style={styles.regionSection}>
                <Text style={styles.sectionTitle}>{region}</Text>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageItem,
                      currentLanguage.code === language.code && styles.activeLanguageItem,
                    ]}
                    onPress={() => {
                      onLanguageChange(language);
                      setShowLanguageModal(false);
                    }}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{language.name}</Text>
                      <Text style={styles.languageNative}>{language.nativeName}</Text>
                    </View>
                    {currentLanguage.code === language.code && (
                      <Text style={styles.activeIndicator}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Voice Settings Modal */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowVoiceModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Voice Settings</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Voice Toggle */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Voice Interaction</Text>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => {
                  const newEnabled = !voiceSettings.enabled;
                  onVoiceToggle(newEnabled);
                  onVoiceSettingsChange({
                    ...voiceSettings,
                    enabled: newEnabled,
                  });
                }}
              >
                <Text style={styles.toggleLabel}>Enable Voice</Text>
                <View style={[
                  styles.toggleSwitch,
                  voiceSettings.enabled && styles.toggleSwitchActive,
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    voiceSettings.enabled && styles.toggleThumbActive,
                  ]} />
                </View>
              </TouchableOpacity>
              <Text style={styles.settingsDescription}>
                Allow BlueBot to speak responses and listen to your voice commands
              </Text>
            </View>

            {voiceSettings.enabled && (
              <>
                {/* Voice Personality */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Voice Personality</Text>
                  {VOICE_PERSONALITIES.map((personality) => (
                    <TouchableOpacity
                      key={personality.id}
                      style={[
                        styles.personalityItem,
                        voiceSettings.voiceId === personality.id && styles.activePersonalityItem,
                      ]}
                      onPress={() => {
                        onVoiceSettingsChange({
                          ...voiceSettings,
                          voiceId: personality.id,
                        });
                      }}
                    >
                      <View style={styles.personalityInfo}>
                        <Text style={styles.personalityName}>{personality.name}</Text>
                        <Text style={styles.personalityDescription}>
                          {personality.description}
                        </Text>
                      </View>
                      {voiceSettings.voiceId === personality.id && (
                        <Text style={styles.activeIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Speed Control */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Speech Speed</Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Slow</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[
                        styles.sliderThumb,
                        { left: `${voiceSettings.speed * 100}%` }
                      ]} />
                    </View>
                    <Text style={styles.sliderLabel}>Fast</Text>
                  </View>
                </View>

                {/* Test Voice */}
                <View style={styles.settingsSection}>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => speakText('Hello! This is how my voice sounds with the current settings.')}
                  >
                    <Text style={styles.testButtonText}>🔊 Test Voice</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Instructions */}
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>How to Use</Text>
              <Text style={styles.instructionText}>
                • <Text style={styles.bold}>Tap</Text> the floating button to open menu
              </Text>
              <Text style={styles.instructionText}>
                • <Text style={styles.bold}>Long press</Text> the button to start voice input
              </Text>
              <Text style={styles.instructionText}>
                • <Text style={styles.bold}>Drag</Text> the button to move it around
              </Text>
              <Text style={styles.instructionText}>
                • BlueBot will speak in your chosen language
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  listeningButton: {
    backgroundColor: '#DC2626',
  },
  speakingButton: {
    backgroundColor: '#2563EB',
  },
  buttonEmoji: {
    fontSize: 24,
  },
  actionMenu: {
    position: 'absolute',
    top: -200,
    left: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentLanguageSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  regionSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeLanguageItem: {
    backgroundColor: '#ECFDF5',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  languageNative: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  activeIndicator: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  settingsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#059669',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  settingsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  personalityItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePersonalityItem: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  personalityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    position: 'absolute',
    top: -6,
    marginLeft: -8,
  },
  testButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsSection: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#374151',
  },
});