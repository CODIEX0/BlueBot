import React, { useState, useEffect } from 'react';
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Star,
  Gift,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement';
  title: string;
  message: string;
  icon: React.ReactNode;
}

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  type: 'debit' | 'credit';
}

export default function Dashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(12847.50);
  const [monthlySpending, setMonthlySpending] = useState(4567.30);
  const [savingsGoal, setSavingsGoal] = useState({ target: 10000, current: 7250 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      merchant: 'Checkers',
      amount: -234.50,
      category: 'Groceries',
      date: '2025-01-20',
      type: 'debit',
    },
    {
      id: '2',
      merchant: 'Uber',
      amount: -87.50,
      category: 'Transport',
      date: '2025-01-20',
      type: 'debit',
    },
    {
      id: '3',
      merchant: 'Salary',
      amount: 15000,
      category: 'Income',
      date: '2025-01-19',
      type: 'credit',
    },
  ]);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'tip',
      title: 'Smart Savings Tip',
      message: 'You could save R380 this month by reducing takeout orders.',
      icon: <TrendingUp size={20} color="#10B981" />,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Budget Alert',
      message: 'You\'ve spent 75% of your entertainment budget this month.',
      icon: <AlertTriangle size={20} color="#F59E0B" />,
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Goal Achievement',
      message: 'Congratulations! You reached your grocery savings goal.',
      icon: <Star size={20} color="#8B5CF6" />,
    },
  ]);

  const savingsProgress = (savingsGoal.current / savingsGoal.target) * 100;

  const formatCurrency = (amount: number) => {
    return `R${Math.abs(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'tip':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'achievement':
        return '#8B5CF6';
      default:
        return '#1E3A8A';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>Welcome back!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#1E3A8A', '#0EA5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
              style={styles.eyeButton}
            >
              {balanceVisible ? (
                <Eye size={20} color="#FFFFFF" />
              ) : (
                <EyeOff size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(currentBalance) : '••••••'}
          </Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceItem}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.balanceSubtext}>+12.5% this month</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <DollarSign size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Send Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Target size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Set Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Gift size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BlueBot Insights</Text>
          {aiInsights.map((insight) => (
            <TouchableOpacity key={insight.id} style={styles.insightCard}>
              <View style={styles.insightIcon}>
                {insight.icon}
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Savings Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Goal Progress</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Emergency Fund</Text>
              <Text style={styles.goalAmount}>
                {formatCurrency(savingsGoal.current)} / {formatCurrency(savingsGoal.target)}
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(savingsProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(savingsProgress)}%</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              </View>
              <View style={styles.transactionAmountContainer}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'credit' ? '#10B981' : '#1E3A8A',
                    },
                  ]}
                >
                  {transaction.type === 'credit' ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '700',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eyeButton: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  goalAmount: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
  },
});