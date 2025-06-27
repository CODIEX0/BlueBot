/**
 * Advanced Financial Dashboard Component
 * Displays comprehensive financial analytics, insights, and predictions
 */

import React from 'react';
const { useState, useEffect, useMemo } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatabase } from '../contexts/DatabaseContext';
import analyticsService, { SpendingPattern, FinancialInsight, BudgetRecommendation } from '../services/analyticsService';

const { width } = Dimensions.get('window');

// Icon wrapper component
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  const IconLib = Ionicons as any;
  return <IconLib name={name} size={size} color={color} />;
};

interface DashboardProps {
  onNavigateToCategory?: (category: string) => void;
}

export default function AdvancedDashboard({ onNavigateToCategory }: DashboardProps) {
  const { expenses } = useDatabase();
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [selectedInsightType, setSelectedInsightType] = useState<'all' | 'warning' | 'tip' | 'achievement' | 'prediction'>('all');

  // Calculate analytics when expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      const spendingPatterns = analyticsService.analyzeSpendingPatterns(expenses);
      const financialInsights = analyticsService.generateInsights(expenses, spendingPatterns);
      const budgetRecs = analyticsService.generateBudgetRecommendations(expenses);

      setPatterns(spendingPatterns);
      setInsights(financialInsights);
      setRecommendations(budgetRecs);
    }
  }, [expenses]);

  // Filter insights based on selected type
  const filteredInsights = useMemo(() => {
    if (selectedInsightType === 'all') return insights;
    return insights.filter(insight => insight.type === selectedInsightType);
  }, [insights, selectedInsightType]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgDaily = patterns.reduce((sum, p) => sum + p.averageDaily, 0);
    const highImpactInsights = insights.filter(i => i.impact === 'high').length;
    const savingOpportunities = insights.filter(i => i.type === 'tip').length;

    return {
      totalSpending,
      avgDaily,
      highImpactInsights,
      savingOpportunities,
    };
  }, [expenses, patterns, insights]);

  const renderSpendingPattern = (pattern: SpendingPattern, index: number) => (
    <TouchableOpacity
      key={pattern.category}
      style={styles.patternCard}
      onPress={() => onNavigateToCategory?.(pattern.category)}
    >
      <View style={styles.patternHeader}>
        <Text style={styles.patternCategory}>{pattern.category}</Text>
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor(pattern.trend) }]}>
          <Icon 
            name={getTrendIcon(pattern.trend)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.trendText}>{pattern.trend}</Text>
        </View>
      </View>
      
      <View style={styles.patternStats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Monthly Avg</Text>
          <Text style={styles.statValue}>R{pattern.averageMonthly.toFixed(2)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Weekly Avg</Text>
          <Text style={styles.statValue}>R{pattern.averageWeekly.toFixed(2)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Seasonality</Text>
          <Text style={[styles.statValue, { color: getSeasonalityColor(pattern.seasonality) }]}>
            {pattern.seasonality}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInsight = (insight: FinancialInsight, index: number) => (
    <View key={index} style={[styles.insightCard, { borderLeftColor: getInsightColor(insight.type) }]}>
      <View style={styles.insightHeader}>
        <Icon 
          name={getInsightIcon(insight.type)} 
          size={20} 
          color={getInsightColor(insight.type)} 
        />
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) }]}>
          <Text style={styles.impactText}>{insight.impact}</Text>
        </View>
      </View>
      
      <Text style={styles.insightDescription}>{insight.description}</Text>
      
      {insight.actionable && insight.actions && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Recommended Actions:</Text>
          {insight.actions.map((action, actionIndex) => (
            <View key={actionIndex} style={styles.actionItem}>
              <Icon name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecommendation = (rec: BudgetRecommendation, index: number) => (
    <View key={rec.category} style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationCategory}>{rec.category}</Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>{Math.round(rec.confidence * 100)}% confidence</Text>
        </View>
      </View>
      
      <View style={styles.budgetComparison}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Current</Text>
          <Text style={styles.budgetValue}>R{rec.currentSpending.toFixed(2)}</Text>
        </View>
        <Icon name="arrow-forward" size={20} color="#6B7280" />
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Recommended</Text>
          <Text style={[styles.budgetValue, { color: '#10B981' }]}>R{rec.recommendedBudget.toFixed(2)}</Text>
        </View>
      </View>
      
      <Text style={styles.recommendationReasoning}>{rec.reasoning}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Summary Stats */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Financial Analytics</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Icon name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>R{summaryStats.totalSpending.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Total Spending</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="trending-up" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>R{summaryStats.avgDaily.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Daily Average</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="warning" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{summaryStats.highImpactInsights}</Text>
              <Text style={styles.summaryLabel}>High Priority</Text>
            </View>
            <View style={styles.summaryCard}>
              <Icon name="bulb" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{summaryStats.savingOpportunities}</Text>
              <Text style={styles.summaryLabel}>Opportunities</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Spending Patterns Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Patterns</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {patterns.map(renderSpendingPattern)}
          </ScrollView>
        </View>

        {/* Insights Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Insights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              {['all', 'warning', 'tip', 'achievement', 'prediction'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    selectedInsightType === type && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedInsightType(type as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedInsightType === type && styles.filterButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {filteredInsights.map(renderInsight)}
        </View>

        {/* Budget Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Recommendations</Text>
          {recommendations.map(renderRecommendation)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'increasing': return '#EF4444';
    case 'decreasing': return '#10B981';
    default: return '#6B7280';
  }
};

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing': return 'trending-up';
    case 'decreasing': return 'trending-down';
    default: return 'remove';
  }
};

const getSeasonalityColor = (seasonality: string): string => {
  switch (seasonality) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    default: return '#10B981';
  }
};

const getInsightColor = (type: string): string => {
  switch (type) {
    case 'warning': return '#EF4444';
    case 'tip': return '#3B82F6';
    case 'achievement': return '#10B981';
    case 'prediction': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const getInsightIcon = (type: string): string => {
  switch (type) {
    case 'warning': return 'warning';
    case 'tip': return 'bulb';
    case 'achievement': return 'trophy';
    case 'prediction': return 'analytics';
    default: return 'information-circle';
  }
};

const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    default: return '#10B981';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  patternStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginLeft: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  confidenceContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  budgetComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  recommendationReasoning: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
