/**
 * Learn Tab - Financial Education Page
 * Uses the Enhanced Financial Education component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleFinancialEducation from '../../components/SimpleFinancialEducation';

export default function Learn() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SimpleFinancialEducation />
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

