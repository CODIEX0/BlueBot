/**
 * Financial Education Page
 * Dedicated page for enhanced financial literacy modules
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EnhancedFinancialEducation from '../components/EnhancedFinancialEducation';

export default function FinancialEducationPage() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <EnhancedFinancialEducation />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});

