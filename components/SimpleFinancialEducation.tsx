/**
 * Simple Financial Education Component
 * Temporary replacement for the complex component with export issues
 */

import React from 'react';
const { useState } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface EducationModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  completed: boolean;
  emoji: string;
}

const FinancialEducation = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const modules: EducationModule[] = [
    {
      id: '1',
      title: 'Understanding Money',
      description: 'Learn the fundamental concepts of money and finance',
      category: 'basics',
      difficulty: 'Beginner',
      duration: 5,
      completed: true,
      emoji: '💡'
    },
    {
      id: '2',
      title: 'Banking in South Africa',
      description: 'Navigate the South African banking system',
      category: 'basics',
      difficulty: 'Beginner',
      duration: 8,
      completed: false,
      emoji: '🏦'
    },
    {
      id: '3',
      title: 'The 50/30/20 Budget Rule',
      description: 'Master the most popular budgeting method',
      category: 'budgeting',
      difficulty: 'Beginner',
      duration: 7,
      completed: false,
      emoji: '📊'
    },
    {
      id: '4',
      title: 'Building Your Emergency Fund',
      description: 'Create a financial safety net',
      category: 'saving',
      difficulty: 'Beginner',
      duration: 8,
      completed: false,
      emoji: '🚨'
    },
    {
      id: '5',
      title: 'Introduction to Investing',
      description: 'Start your wealth-building journey',
      category: 'investing',
      difficulty: 'Intermediate',
      duration: 15,
      completed: false,
      emoji: '📈'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Topics', emoji: '📚', color: '#64748B' },
    { id: 'basics', name: 'Financial Basics', emoji: '📖', color: '#10B981' },
    { id: 'budgeting', name: 'Budgeting', emoji: '📊', color: '#0EA5E9' },
    { id: 'saving', name: 'Saving Money', emoji: '💰', color: '#8B5CF6' },
    { id: 'investing', name: 'Investing', emoji: '📈', color: '#F59E0B' },
  ];

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#64748B';
    }
  };

  const completedCount = modules.filter(m => m.completed).length;
  const totalXP = completedCount * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Financial Education</Text>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Level {Math.floor(totalXP / 500) + 1} • {totalXP} XP
          </Text>
          <Text style={styles.moduleProgress}>
            {completedCount}/{modules.length} modules completed
          </Text>
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.emoji} {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modules List */}
      <ScrollView style={styles.modulesList}>
        {filteredModules.map((module) => (
          <TouchableOpacity key={module.id} style={[
            styles.moduleCard,
            module.completed && styles.moduleCardCompleted
          ]}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleEmoji}>{module.emoji}</Text>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </View>
              <View style={styles.moduleStats}>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(module.difficulty) }
                ]}>
                  <Text style={styles.difficultyText}>{module.difficulty}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.moduleFooter}>
              <Text style={styles.durationText}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                {' '}{module.duration} min
              </Text>
              {module.completed ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : (
                <Text style={styles.xpReward}>+100 XP</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievement Banner */}
      <View style={styles.achievementBanner}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.achievementGradient}
        >
          <View style={styles.achievementContent}>
            <Text style={styles.achievementEmoji}>🎯</Text>
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>Keep Learning!</Text>
              <Text style={styles.achievementDescription}>
                Complete 3 more modules to unlock the "Knowledge Seeker" badge
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

export default FinancialEducation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  moduleProgress: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  categoryFilter: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  modulesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  moduleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  moduleStats: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#64748B',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  xpReward: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  achievementBanner: {
    margin: 20,
    marginTop: 0,
  },
  achievementGradient: {
    borderRadius: 12,
    padding: 16,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 18,
  },
});
