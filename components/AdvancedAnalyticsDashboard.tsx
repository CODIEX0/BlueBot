/**
 * Advanced Analytics Dashboard
 * Comprehensive financial insights and analytics for BlueBot users
 */

import React from 'react';
const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  monthlyTrend: number[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  spendingPatterns: { day: string; amount: number }[];
  budgetPerformance: { month: string; budget: number; spent: number }[];
}

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  title: string;
  message: string;
  action?: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'savings' | 'budgeting' | 'investing' | 'debt';
  icon: keyof typeof Ionicons.glyphMap;
}

export default function AdvancedAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyTrend: [4200, 4500, 4100, 4800, 4600],
    categoryBreakdown: [
      { category: 'Groceries', amount: 1850, percentage: 35 },
      { category: 'Transport', amount: 1200, percentage: 23 },
      { category: 'Entertainment', amount: 800, percentage: 15 },
      { category: 'Utilities', amount: 650, percentage: 12 },
      { category: 'Other', amount: 800, percentage: 15 },
    ],
    spendingPatterns: [
      { day: 'Mon', amount: 120 },
      { day: 'Tue', amount: 85 },
      { day: 'Wed', amount: 200 },
      { day: 'Thu', amount: 150 },
      { day: 'Fri', amount: 300 },
      { day: 'Sat', amount: 450 },
      { day: 'Sun', amount: 180 },
    ],
    budgetPerformance: [
      { month: 'Oct', budget: 5000, spent: 4200 },
      { month: 'Nov', budget: 5000, spent: 4500 },
      { month: 'Dec', budget: 5000, spent: 4100 },
      { month: 'Jan', budget: 5200, spent: 4800 },
      { month: 'Feb', budget: 5200, spent: 4600 },
    ],
  });

  const insights: Insight[] = [
    {
      type: 'positive',
      title: 'Great Progress!',
      message: 'You\'ve reduced your spending by 15% compared to last month.',
    },
    {
      type: 'warning',
      title: 'Weekend Spending Alert',
      message: 'Your weekend expenses are 40% higher than weekdays.',
      action: 'Set weekend budget limit',
    },
    {
      type: 'neutral',
      title: 'Seasonal Pattern Detected',
      message: 'Your transport costs increase by 20% during winter months.',
    },
  ];

  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Start a Tax-Free Savings Account',
      description: 'You could save R300/month in a TFSA and avoid taxes on returns',
      impact: 'high',
      category: 'savings',
      icon: 'trending-up-outline',
    },
    {
      id: '2',
      title: 'Optimize Grocery Shopping',
      description: 'Switch to bulk buying and discount stores to save R400/month',
      impact: 'medium',
      category: 'budgeting',
      icon: 'cart-outline',
    },
    {
      id: '3',
      title: 'Consider Investment Portfolio',
      description: 'With your current savings rate, you could start investing R1000/month',
      impact: 'high',
      category: 'investing',
      icon: 'bar-chart-outline',
    },
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#64748B';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxSpending = Math.max(...analyticsData.spendingPatterns.map(d => d.amount));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Financial Analytics</Text>
          <Text style={styles.headerSubtitle}>AI-powered insights for smarter spending</Text>
        </LinearGradient>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['1M', '3M', '6M', '1Y'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="trending-down-outline" size={24} color="#10B981" />
              <Text style={styles.metricValue}>15%</Text>
              <Text style={styles.metricLabel}>Spending Reduction</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
              <Text style={styles.metricValue}>R2,340</Text>
              <Text style={styles.metricLabel}>Avg Monthly Savings</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="analytics-outline" size={24} color="#8B5CF6" />
              <Text style={styles.metricValue}>87%</Text>
              <Text style={styles.metricLabel}>Budget Efficiency</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text style={styles.metricValue}>12</Text>
              <Text style={styles.metricLabel}>Goals Achieved</Text>
            </View>
          </View>
        </View>

        {/* Spending Pattern Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Weekly Spending Pattern</Text>
          <View style={styles.chart}>
            {analyticsData.spendingPatterns.map((data, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={[
                  styles.bar,
                  { height: (data.amount / maxSpending) * 100 }
                ]} />
                <Text style={styles.chartLabel}>{data.day}</Text>
                <Text style={styles.chartValue}>{formatCurrency(data.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {analyticsData.categoryBreakdown.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={styles.categoryProgressBar}>
                  <View style={[
                    styles.categoryProgressFill,
                    { width: `${category.percentage}%` }
                  ]} />
                </View>
                <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={[
              styles.insightCard,
              { borderLeftColor: getInsightColor(insight.type) }
            ]}>
              <View style={styles.insightHeader}>
                <Text style={[
                  styles.insightTitle,
                  { color: getInsightColor(insight.type) }
                ]}>
                  {insight.title}
                </Text>
              </View>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              {insight.action && (
                <TouchableOpacity style={[
                  styles.insightAction,
                  { borderColor: getInsightColor(insight.type) }
                ]}>
                  <Text style={[
                    styles.insightActionText,
                    { color: getInsightColor(insight.type) }
                  ]}>
                    {insight.action}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Smart Recommendations</Text>
          {recommendations.map((rec) => (
            <TouchableOpacity key={rec.id} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name={rec.icon} size={24} color="#1E3A8A" />
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <Text style={styles.recommendationDescription}>{rec.description}</Text>
                </View>
                <View style={[
                  styles.impactBadge,
                  { backgroundColor: getImpactColor(rec.impact) }
                ]}>
                  <Text style={styles.impactText}>{rec.impact.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Financial Health Score */}
        <View style={styles.healthScoreContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.healthScoreCard}
          >
            <View style={styles.healthScoreContent}>
              <Text style={styles.healthScoreTitle}>Financial Health Score</Text>
              <Text style={styles.healthScoreValue}>82/100</Text>
              <Text style={styles.healthScoreDescription}>
                Excellent! You're on track to meet your financial goals.
              </Text>
            </View>
            <View style={styles.healthScoreChart}>
              <View style={styles.healthScoreRing}>
                <Text style={styles.healthScorePercentage}>82%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  periodButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#3B82F6',
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: '500',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    minWidth: 35,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightAction: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  healthScoreContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  healthScoreCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreContent: {
    flex: 1,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  healthScoreDescription: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  healthScoreChart: {
    marginLeft: 20,
  },
  healthScoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  healthScorePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
