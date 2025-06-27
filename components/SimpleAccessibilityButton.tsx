/**
 * Simple Accessibility Floating Button
 * Provides language selection and voice interaction for BlueBot
 */

import React from 'react';
const { useState } = React;
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleAccessibilityButtonProps {
  onLanguageChange?: (language: string) => void;
  onVoiceToggle?: (enabled: boolean) => void;
  currentLanguage?: string;
}

const SimpleAccessibilityButton = ({ 
  onLanguageChange,
  onVoiceToggle,
  currentLanguage = 'en'
}: SimpleAccessibilityButtonProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
    { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' },
  ];

  const handleLanguageChange = (language: string) => {
    onLanguageChange?.(language);
    setShowMenu(false);
  };

  const handleVoiceToggle = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    onVoiceToggle?.(newState);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowMenu(true)}
      >
        <Ionicons name="accessibility-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Accessibility Options</Text>
            <TouchableOpacity onPress={() => setShowMenu(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.optionButton,
                    currentLanguage === lang.code && styles.optionButtonActive
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[
                    styles.optionText,
                    currentLanguage === lang.code && styles.optionTextActive
                  ]}>
                    {lang.name}
                  </Text>
                  {currentLanguage === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Assistance</Text>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  voiceEnabled && styles.optionButtonActive
                ]}
                onPress={handleVoiceToggle}
              >
                <Ionicons 
                  name={voiceEnabled ? "volume-high-outline" : "volume-mute-outline"} 
                  size={24} 
                  color={voiceEnabled ? "#10B981" : "#64748B"} 
                />
                <Text style={[
                  styles.optionText,
                  voiceEnabled && styles.optionTextActive
                ]}>
                  Voice Feedback
                </Text>
                <View style={[
                  styles.toggle,
                  voiceEnabled && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    voiceEnabled && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>About Accessibility</Text>
              <Text style={styles.infoText}>
                BlueBot supports multiple South African languages and voice assistance 
                to make financial management accessible to everyone.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SimpleAccessibilityButton;

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#64748B',
  },
  optionTextActive: {
    color: '#1E293B',
    fontWeight: '500',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  infoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284C7',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
});
