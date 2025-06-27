/**
 * Main Dashboard - BlueBot Home Screen
 * Integrated analytics, insights, and gamification features
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
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Import our contexts
import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import GamificationWidget from '@/components/GamificationWidget';

const { width } = Dimensions.get('window');

interface QuickStat {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: keyof typeof Ionicons.glyphMap;
}

interface FinancialInsight {
  id: string;
  type: 'positive' | 'negative' | 'warning' | 'tip';
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function Dashboard() {
  const { user } = useMobileAuth();
  const { expenses, getExpensesByDateRange, getCategoryTotals } = useMobileDatabase();
  const [totalBalance, setTotalBalance] = useState(15420.50);
  const [monthlyBudget] = useState(8000);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [userXP, setUserXP] = useState(450); // User's gamification XP

  // Calculate current month expenses
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const monthlyExpenses = getExpensesByDateRange(
    firstDayOfMonth.toISOString().split('T')[0],
    lastDayOfMonth.toISOString().split('T')[0]
  );

  const monthlySpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetUsed = (monthlySpent / monthlyBudget) * 100;
  const remaining = monthlyBudget - monthlySpent;

  // Generate insights based on spending patterns
  useEffect(() => {
    generateInsights();
  }, [expenses]);

  const generateInsights = () => {
    const newInsights: FinancialInsight[] = [];

    // Budget insight
    if (budgetUsed > 90) {
      newInsights.push({
        id: 'budget-warning',
        type: 'warning',
        title: 'Budget Alert',
        message: `You've used ${budgetUsed.toFixed(0)}% of your monthly budget. Consider reducing discretionary spending.`,
        icon: 'warning-outline'
      });
    } else if (budgetUsed < 70) {
      newInsights.push({
        id: 'budget-good',
        type: 'positive',
        title: 'Great Progress!',
        message: `You're doing well! Only ${budgetUsed.toFixed(0)}% of budget used with ${new Date(lastDayOfMonth.getTime() - currentDate.getTime()).getDate()} days left.`,
        icon: 'checkmark-circle-outline'
      });
    }

    // Category spending insight
    const categoryTotals = getCategoryTotals();
    const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topCategory && (topCategory[1] as number) > monthlyBudget * 0.3) {
      newInsights.push({
        id: 'category-spending',
        type: 'tip',
        title: 'Spending Pattern',
        message: `${topCategory[0]} is your highest expense category at R${(topCategory[1] as number).toFixed(2)}. Consider setting a specific budget for this category.`,
        icon: 'analytics-outline'
      });
    }

    // Savings opportunity
    if (remaining > 0) {
      newInsights.push({
        id: 'savings-tip',
        type: 'tip',
        title: 'Savings Opportunity',
        message: `You have R${remaining.toFixed(2)} left in your budget. Consider transferring it to your emergency fund or TFSA.`,
        icon: 'wallet-outline'
      });
    }

    setInsights(newInsights);
  };

  const quickStats: QuickStat[] = [
    {
      label: 'Total Balance',
      value: `R${totalBalance.toFixed(2)}`,
      change: '+R234.50',
      changeType: 'positive',
      icon: 'wallet-outline'
    },
    {
      label: 'Monthly Spent',
      value: `R${monthlySpent.toFixed(2)}`,
      change: `${budgetUsed.toFixed(0)}% of budget`,
      changeType: budgetUsed > 90 ? 'negative' : budgetUsed > 75 ? 'warning' : 'positive',
      icon: 'card-outline'
    },
    {
      label: 'Budget Remaining',
      value: `R${remaining.toFixed(2)}`,
      change: `${Math.max(lastDayOfMonth.getDate() - currentDate.getDate(), 0)} days left`,
      changeType: remaining > 0 ? 'positive' : 'negative',
      icon: 'trending-up-outline'
    },
    {
      label: 'This Week',
      value: 'R456.30',
      change: '-12% vs last week',
      changeType: 'positive',
      icon: 'calendar-outline'
    }
  ];

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'positive':
        return { bg: '#F0FDF4', border: '#10B981', text: '#047857' };
      case 'negative':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' };
      case 'warning':
        return { bg: '#FFFBEB', border: '#F59E0B', text: '#D97706' };
      case 'tip':
        return { bg: '#F0F9FF', border: '#0EA5E9', text: '#0284C7' };
      default:
        return { bg: '#F8FAFC', border: '#64748B', text: '#334155' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</Text>
              <Text style={styles.userName}>{user?.name || 'Welcome to BlueBot'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Balance Overview */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
            <View style={styles.balanceChange}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={styles.balanceChangeText}>+2.3% this month</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Gamification Widget */}
        <View style={styles.gamificationContainer}>
          <GamificationWidget 
            currentXP={userXP} 
            onXPChange={setUserXP}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.quickStatsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.quickStatCard}>
                <View style={styles.quickStatHeader}>
                  <Ionicons 
                    name={stat.icon} 
                    size={20} 
                    color="#64748B" 
                  />
                  <Text style={styles.quickStatLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.quickStatValue}>{stat.value}</Text>
                <Text style={[
                  styles.quickStatChange,
                  {
                    color: stat.changeType === 'positive' ? '#10B981' : 
                           stat.changeType === 'negative' ? '#EF4444' : '#F59E0B'
                  }
                ]}>
                  {stat.change}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Financial Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            {insights.map((insight) => {
              const colors = getInsightColors(insight.type);
              return (
                <View
                  key={insight.id}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.bg,
                      borderLeftColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.insightHeader}>
                    <Ionicons name={insight.icon} size={20} color={colors.text} />
                    <Text style={[styles.insightTitle, { color: colors.text }]}>
                      {insight.title}
                    </Text>
                  </View>
                  <Text style={[styles.insightMessage, { color: colors.text }]}>
                    {insight.message}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionGradient}
              >
                <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Add Expense</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.actionGradient}
              >
                <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Scan Receipt</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.actionGradient}
              >
                <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>View Reports</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionGradient}
              >
                <Ionicons name="school-outline" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Learn</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {monthlyExpenses.slice(0, 3).map((expense) => (
            <View key={expense.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="receipt-outline" size={20} color="#64748B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{expense.merchant}</Text>
                <Text style={styles.activitySubtitle}>{expense.category}</Text>
              </View>
              <View style={styles.activityAmount}>
                <Text style={styles.activityAmountText}>
                  -{formatCurrency(expense.amount)}
                </Text>
                <Text style={styles.activityDate}>{expense.date}</Text>
              </View>
            </View>
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
  },
  gamificationContainer: {
    paddingHorizontal: 20,
  },
  quickStatsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickStatChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  insightCard: {
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  actionGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#64748B',
  },
});
