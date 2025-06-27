import React from 'react';
const { useState, useCallback, useEffect, useRef, useContext, createContext } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';

interface Expense {
  id: number;
  amount: number;
  category: string;
  merchant: string;
  description: string;
  date: string;
  receiptUrl?: string;
  isRecurring: boolean;
  createdAt: string;
}

export default function ExpenseTracker() {
  const { expenses, addExpense, getExpensesByDateRange } = useDatabase();
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showAddExpense, setShowAddExpense] = useState(false);

  React.useEffect(() => {
    loadRecentExpenses();
  }, []);

  const loadRecentExpenses = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const expenseData = await getExpensesByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      setRecentExpenses(expenseData || []);
      
      const total = expenseData?.reduce((sum: number, exp: Expense) => sum + exp.amount, 0) || 0;
      setTotalSpent(total);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    try {
      // Mock expense for testing
      await addExpense({
        amount: 50.00,
        category: 'Food',
        merchant: 'Test Store',
        date: new Date().toISOString().split('T')[0],
        description: 'Test expense',
        isRecurring: false,
      });
      
      Alert.alert('Success', 'Expense added successfully!');
      loadRecentExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food': '#10B981',
      'Transport': '#0EA5E9',
      'Entertainment': '#8B5CF6',
      'Shopping': '#F59E0B',
      'Healthcare': '#EF4444',
      'Utilities': '#6B7280',
      'Other': '#64748B',
    };
    return colors[category] || '#64748B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddExpense}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent (30 days)</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.summarySubtext}>
            {recentExpenses.length} transactions
          </Text>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No expenses yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tracking your expenses to see insights
              </Text>
            </View>
          ) : (
            recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseIcon}>
                  <View 
                    style={[
                      styles.categoryDot, 
                      { backgroundColor: getCategoryColor(expense.category) }
                    ]} 
                  />
                </View>
                
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseAmountText}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Receipt scanning will be available soon!')}
          >
            <Text style={styles.actionButtonText}>📷 Scan Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Expense analysis will be available soon!')}
          >
            <Text style={styles.actionButtonText}>📊 View Analysis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Budget setup will be available soon!')}
          >
            <Text style={styles.actionButtonText}>🎯 Set Budget</Text>
          </TouchableOpacity>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E3A8A',
  },
});


