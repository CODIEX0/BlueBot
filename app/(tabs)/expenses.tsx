import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PieChart,
  Camera,
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  receipt?: boolean;
}

interface Category {
  name: string;
  amount: number;
  budget?: number;
  color: string;
  icon: React.ReactNode;
}

export default function Expenses() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [totalSpent, setTotalSpent] = useState(4567.30);
  const [monthlyBudget, setMonthlyBudget] = useState(6000);

  const categories: Category[] = [
    {
      name: 'Groceries',
      amount: 1834.50,
      budget: 2000,
      color: '#10B981',
      icon: <Receipt size={20} color="#10B981" />,
    },
    {
      name: 'Transport',
      amount: 892.30,
      budget: 1200,
      color: '#0EA5E9',
      icon: <Receipt size={20} color="#0EA5E9" />,
    },
    {
      name: 'Entertainment',
      amount: 654.20,
      budget: 800,
      color: '#8B5CF6',
      icon: <Receipt size={20} color="#8B5CF6" />,
    },
    {
      name: 'Utilities',
      amount: 543.10,
      budget: 700,
      color: '#F59E0B',
      icon: <Receipt size={20} color="#F59E0B" />,
    },
    {
      name: 'Healthcare',
      amount: 432.80,
      budget: 500,
      color: '#EF4444',
      icon: <Receipt size={20} color="#EF4444" />,
    },
    {
      name: 'Other',
      amount: 210.40,
      budget: 300,
      color: '#64748B',
      icon: <Receipt size={20} color="#64748B" />,
    },
  ];

  const recentExpenses: Expense[] = [
    {
      id: '1',
      amount: 234.50,
      category: 'Groceries',
      merchant: 'Checkers',
      date: '2025-01-20',
      receipt: true,
    },
    {
      id: '2',
      amount: 87.50,
      category: 'Transport',
      merchant: 'Uber',
      date: '2025-01-20',
    },
    {
      id: '3',
      amount: 125.00,
      category: 'Entertainment',
      merchant: 'Netflix',
      date: '2025-01-19',
    },
    {
      id: '4',
      amount: 45.80,
      category: 'Groceries',
      merchant: 'Woolworths',
      date: '2025-01-19',
      receipt: true,
    },
    {
      id: '5',
      amount: 320.00,
      category: 'Utilities',
      merchant: 'Eskom',
      date: '2025-01-18',
    },
  ];

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getBudgetProgress = (spent: number, budget?: number) => {
    if (!budget) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getBudgetStatus = (spent: number, budget?: number) => {
    if (!budget) return 'no-budget';
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return 'over-budget';
    if (percentage >= 75) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over-budget':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'good':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const budgetRemaining = Math.max(monthlyBudget - totalSpent, 0);
  const budgetProgress = (totalSpent / monthlyBudget) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracking</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowReceiptModal(true)}
            >
              <Camera size={20} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['This Week', 'This Month', 'Last Month', 'This Year'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Budget Overview */}
        <View style={styles.section}>
          <LinearGradient
            colors={budgetProgress > 90 ? ['#EF4444', '#DC2626'] : ['#1E3A8A', '#0EA5E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.budgetCard}
          >
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetProgress}>{Math.round(budgetProgress)}%</Text>
            </View>
            <Text style={styles.budgetAmount}>{formatCurrency(totalSpent)}</Text>
            <Text style={styles.budgetSubtext}>
              of {formatCurrency(monthlyBudget)} • {formatCurrency(budgetRemaining)} remaining
            </Text>
            <View style={styles.budgetProgressBar}>
              <View
                style={[
                  styles.budgetProgressFill,
                  { width: `${Math.min(budgetProgress, 100)}%` },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {categories.map((category, index) => {
            const progress = getBudgetProgress(category.amount, category.budget);
            const status = getBudgetStatus(category.amount, category.budget);
            
            return (
              <View key={category.name} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                      {category.icon}
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmounts}>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(category.amount)}
                    </Text>
                    {category.budget && (
                      <Text style={styles.categoryBudget}>
                        of {formatCurrency(category.budget)}
                      </Text>
                    )}
                  </View>
                </View>
                {category.budget && (
                  <View style={styles.categoryProgressContainer}>
                    <View style={styles.categoryProgressBar}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: getStatusColor(status),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryProgressText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {Math.round(progress)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  -{formatCurrency(expense.amount)}
                </Text>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseDate}>{expense.date}</Text>
                  {expense.receipt && (
                    <Receipt size={12} color="#10B981" style={styles.receiptIcon} />
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Receipt Scanner Modal */}
      <Modal
        visible={showReceiptModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Scan Receipt</Text>
            <TouchableOpacity>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cameraPlaceholder}>
            <Camera size={64} color="#64748B" />
            <Text style={styles.cameraText}>Camera view would appear here</Text>
            <Text style={styles.cameraSubtext}>
              Point your camera at a receipt to automatically extract expense details
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerTitle: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodSelector: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
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
  budgetCard: {
    borderRadius: 16,
    padding: 24,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  budgetProgress: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  budgetProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  budgetProgressFill: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  categoryItem: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  categoryAmounts: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  categoryBudget: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginRight: 12,
  },
  categoryProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryProgressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expenseItem: {
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
  expenseInfo: {
    flex: 1,
  },
  expenseMerchant: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748B',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDate: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 6,
  },
  receiptIcon: {
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalTitle: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  modalDone: {
    fontSize: 16,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  cameraText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});