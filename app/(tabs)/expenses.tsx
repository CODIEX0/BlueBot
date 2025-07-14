import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ReceiptScanner from '../../components/ReceiptScanner';
import { useMobileDatabase } from '../../contexts/MobileDatabaseContext';
import { Picker } from '@react-native-picker/picker';
import { TextInput } from 'react-native';

const { width } = Dimensions.get('window');

// Icon wrapper component to handle type issues
const IconComponent = ({ name, size, color }: { name: string; size: number; color: string }) => {
  const IconLib = Ionicons as any;
  return <IconLib name={name} size={size} color={color} />;
};

// LinearGradient wrapper component to handle type issues
const GradientComponent = ({ colors, style, children }: { colors: string[]; style?: any; children: React.ReactNode }) => {
  const GradientLib = LinearGradient as any;
  return <GradientLib colors={colors} style={style}>{children}</GradientLib>;
};

// Picker wrapper component to handle type issues
const PickerComponent = ({ selectedValue, onValueChange, style, children }: { 
  selectedValue: string; 
  onValueChange: (value: string) => void; 
  style?: any; 
  children: React.ReactNode 
}) => {
  const PickerLib = Picker as any;
  return <PickerLib selectedValue={selectedValue} onValueChange={onValueChange} style={style}>{children}</PickerLib>;
};

export default function Expenses() {
  const {
    expenses = [],
    categories = [],
    currentUser,
    addExpense,
    updateExpense,
    deleteExpense,
    scanReceiptAndAddExpense,
    getExpensesByDateRange,
    getCategoriesWithBudgets,
    updateCategoryBudget,
    createLocalUser,
  } = useMobileDatabase();

  const [selectedPeriod, setSelectedPeriod] = React.useState('This Month');
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<any>(null);
  const [addForm, setAddForm] = React.useState({ amount: '', category: '', merchant: '', date: '', description: '' });
  const [budgetForm, setBudgetForm] = React.useState({ budget: '' });
  const [adding, setAdding] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrError, setOcrError] = React.useState('');
  const [ocrResult, setOcrResult] = React.useState(null);

  // Initialize demo user if none exists
  React.useEffect(() => {
    const initializeDemoUser = async () => {
      if (!currentUser) {
        try {
          await createLocalUser({
            email: 'demo@bluebot.com',
            fullName: 'Demo User',
            isVerified: true,
            phoneNumber: '+27123456789',
          });
        } catch (error) {
          console.log('Demo user might already exist');
        }
      }
    };
    
    initializeDemoUser();
  }, [currentUser, createLocalUser]);

  // Add sample data for demonstration
  const addSampleData = async () => {
    const sampleExpenses = [
      { amount: 150.00, category: 'Food & Dining', merchant: 'Woolworths', description: 'Grocery shopping', date: '2025-07-10' },
      { amount: 35.50, category: 'Transportation', merchant: 'Uber', description: 'Ride to work', date: '2025-07-09' },
      { amount: 899.99, category: 'Shopping', merchant: 'Takealot', description: 'New smartphone', date: '2025-07-08' },
      { amount: 45.00, category: 'Entertainment', merchant: 'Cinema Nouveau', description: 'Movie tickets', date: '2025-07-07' },
      { amount: 450.00, category: 'Bills & Utilities', merchant: 'Eskom', description: 'Electricity bill', date: '2025-07-06' },
    ];

    for (const expense of sampleExpenses) {
      try {
        await addExpense({
          ...expense,
          isRecurring: false
        });
      } catch (error) {
        console.log('Sample expense might already exist');
      }
    }
  };

  // Filter expenses based on selected period
  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    switch (selectedPeriod) {
      case 'This Week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = weekStart.toISOString().slice(0, 10);
        endDate = new Date().toISOString().slice(0, 10);
        break;
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        endDate = new Date().toISOString().slice(0, 10);
        break;
      case 'Last Month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().slice(0, 10);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        endDate = new Date().toISOString().slice(0, 10);
        break;
      default:
        return expenses;
    }

    return getExpensesByDateRange(startDate, endDate);
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculate totals and budgets from filtered data
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const budgetRemaining = Math.max(monthlyBudget - totalSpent, 0);
  const budgetProgress = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  // Add expense via text form
  const handleAddExpense = async () => {
    if (!addForm.amount || !addForm.category || !addForm.merchant) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setAdding(true);
    try {
      await addExpense({
        amount: parseFloat(addForm.amount),
        category: addForm.category,
        merchant: addForm.merchant,
        date: addForm.date || new Date().toISOString().slice(0, 10),
        description: addForm.description || '',
        isRecurring: false
      });
      setShowAddModal(false);
      setAddForm({ amount: '', category: '', merchant: '', date: '', description: '' });
      Alert.alert('Success', 'Expense added successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense.');
    }
    setAdding(false);
  };

  // Edit expense
  const handleEditExpense = async () => {
    if (!selectedExpense || !addForm.amount || !addForm.category || !addForm.merchant) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setUpdating(true);
    try {
      await updateExpense(selectedExpense.id, {
        amount: parseFloat(addForm.amount),
        category: addForm.category,
        merchant: addForm.merchant,
        date: addForm.date || selectedExpense.date,
        description: addForm.description || ''
      });
      setShowEditModal(false);
      setSelectedExpense(null);
      setAddForm({ amount: '', category: '', merchant: '', date: '', description: '' });
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update expense.');
    }
    setUpdating(false);
  };

  // Delete expense
  const handleDeleteExpense = (expense: any) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this expense: ${expense.merchant} - ${formatCurrency(expense.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteExpense(expense.id);
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete expense.');
            }
            setDeleting(false);
          }
        }
      ]
    );
  };

  // Open edit modal
  const openEditModal = (expense: any) => {
    setSelectedExpense(expense);
    setAddForm({
      amount: expense.amount.toString(),
      category: expense.category,
      merchant: expense.merchant,
      date: expense.date,
      description: expense.description || ''
    });
    setShowEditModal(true);
  };

  // Update category budget
  const handleUpdateBudget = async () => {
    if (!selectedCategory || !budgetForm.budget) {
      Alert.alert('Error', 'Please enter a valid budget amount.');
      return;
    }

    try {
      await updateCategoryBudget(selectedCategory.name, parseFloat(budgetForm.budget));
      setShowBudgetModal(false);
      setSelectedCategory(null);
      setBudgetForm({ budget: '' });
      Alert.alert('Success', 'Budget updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update budget.');
    }
  };

  // Open budget modal
  const openBudgetModal = (category: any) => {
    setSelectedCategory(category);
    setBudgetForm({ budget: (category.budget || 0).toString() });
    setShowBudgetModal(true);
  };

  // Add expense via OCR
  const handleReceiptProcessed = async (receipt) => {
    setOcrLoading(true);
    setOcrError('');
    try {
      await addExpense({
        amount: receipt.total,
        category: receipt.category,
        merchant: receipt.merchant,
        date: receipt.date,
      });
      setOcrResult(receipt);
      setShowReceiptModal(false);
    } catch (e) {
      setOcrError('Failed to add expense from receipt.');
    }
    setOcrLoading(false);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracking</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={addSampleData}>
              <IconComponent name="add-circle-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <IconComponent name="funnel-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowReceiptModal(true)}
            >
              <IconComponent name="camera-outline" size={20} color="#1E3A8A" />
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
          <GradientComponent
            colors={budgetProgress > 90 ? ['#EF4444', '#DC2626'] : ['#1E3A8A', '#0EA5E9']}
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
          </GradientComponent>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {categories.map((category) => {
            const catExpenses = filteredExpenses.filter(e => e.category === category.name);
            const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
            const progress = getBudgetProgress(spent, category.budget);
            const status = getBudgetStatus(spent, category.budget);
            return (
              <TouchableOpacity 
                key={category.name} 
                style={styles.categoryItem}
                onPress={() => openBudgetModal(category)}
                onLongPress={() => openBudgetModal(category)}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}> 
                      <IconComponent name={category.icon} size={20} color={category.color} />
                    </View>
                    <View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryCount}>{catExpenses.length} transactions</Text>
                    </View>
                  </View>
                  <View style={styles.categoryAmounts}>
                    <Text style={styles.categoryAmount}>{formatCurrency(spent)}</Text>
                    {category.budget && category.budget > 0 ? (
                      <Text style={styles.categoryBudget}>of {formatCurrency(category.budget)}</Text>
                    ) : (
                      <Text style={styles.categoryNoBudget}>Tap to set budget</Text>
                    )}
                  </View>
                </View>
                {category.budget && category.budget > 0 && (
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
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All ({filteredExpenses.length})</Text>
            </TouchableOpacity>
          </View>
          {filteredExpenses.slice(0, 5).map((expense) => (
            <TouchableOpacity 
              key={expense.id} 
              style={styles.expenseItem}
              onPress={() => openEditModal(expense)}
            >
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                {expense.description && (
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                )}
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  -{formatCurrency(expense.amount)}
                </Text>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseDate}>{expense.date}</Text>
                  {expense.receiptUrl && (
                    <IconComponent name="receipt-outline" size={12} color="#10B981" />
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteExpense(expense);
                  }}
                >
                  <IconComponent name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {filteredExpenses.length === 0 && (
            <View style={styles.emptyState}>
              <IconComponent name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No expenses for this period</Text>
              <Text style={styles.emptyStateSubtext}>Add your first expense to get started</Text>
            </View>
          )}
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <IconComponent name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity disabled={adding} onPress={handleAddExpense}>
              <Text style={styles.modalDone}>{adding ? 'Adding...' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text>Amount</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              keyboardType="numeric"
              value={addForm.amount}
              onChangeText={v => setAddForm(f => ({ ...f, amount: v }))}
            />
            <Text>Category</Text>
            <PickerComponent
              selectedValue={addForm.category}
              onValueChange={v => setAddForm(f => ({ ...f, category: v }))}
              style={{ marginBottom: 12 }}
            >
              <Picker.Item label="Select category" value="" />
              {categories.map(c => (
                <Picker.Item key={c.name} label={c.name} value={c.name} />
              ))}
            </PickerComponent>
            <Text>Merchant</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.merchant}
              onChangeText={v => setAddForm(f => ({ ...f, merchant: v }))}
            />
            <Text>Date</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.date}
              placeholder="YYYY-MM-DD"
              onChangeText={v => setAddForm(f => ({ ...f, date: v }))}
            />
            <Text>Description (Optional)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.description}
              placeholder="Additional notes..."
              onChangeText={v => setAddForm(f => ({ ...f, description: v }))}
              multiline
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <TouchableOpacity disabled={updating} onPress={handleEditExpense}>
              <Text style={styles.modalDone}>{updating ? 'Updating...' : 'Update'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text>Amount</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              keyboardType="numeric"
              value={addForm.amount}
              onChangeText={v => setAddForm(f => ({ ...f, amount: v }))}
            />
            <Text>Category</Text>
            <PickerComponent
              selectedValue={addForm.category}
              onValueChange={v => setAddForm(f => ({ ...f, category: v }))}
              style={{ marginBottom: 12 }}
            >
              <Picker.Item label="Select category" value="" />
              {categories.map(c => (
                <Picker.Item key={c.name} label={c.name} value={c.name} />
              ))}
            </PickerComponent>
            <Text>Merchant</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.merchant}
              onChangeText={v => setAddForm(f => ({ ...f, merchant: v }))}
            />
            <Text>Date</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.date}
              placeholder="YYYY-MM-DD"
              onChangeText={v => setAddForm(f => ({ ...f, date: v }))}
            />
            <Text>Description (Optional)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12, padding: 8 }}
              value={addForm.description}
              placeholder="Additional notes..."
              onChangeText={v => setAddForm(f => ({ ...f, description: v }))}
              multiline
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Budget Management Modal */}
      <Modal visible={showBudgetModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Budget</Text>
            <TouchableOpacity onPress={handleUpdateBudget}>
              <Text style={styles.modalDone}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {selectedCategory && (
              <>
                <View style={styles.budgetCategoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${selectedCategory.color}20` }]}>
                    <IconComponent name={selectedCategory.icon} size={24} color={selectedCategory.color} />
                  </View>
                  <Text style={styles.budgetCategoryName}>{selectedCategory.name}</Text>
                </View>
                <Text style={styles.budgetModalLabel}>Monthly Budget</Text>
                <TextInput
                  style={styles.budgetInput}
                  keyboardType="numeric"
                  value={budgetForm.budget}
                  placeholder="Enter budget amount"
                  onChangeText={v => setBudgetForm({ budget: v })}
                />
                <Text style={styles.budgetHint}>
                  Current spending: {formatCurrency(selectedCategory.spent || 0)}
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

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
            <TouchableOpacity disabled={ocrLoading}>
              <Text style={styles.modalDone}>{ocrLoading ? 'Scanning...' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cameraPlaceholder}>
            <ReceiptScanner
              visible={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
              onReceiptProcessed={handleReceiptProcessed}
            />
            {ocrError ? <Text style={{ color: 'red' }}>{ocrError}</Text> : null}
            {ocrResult ? <Text style={{ color: 'green' }}>Expense added!</Text> : null}
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
  categoryCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  categoryNoBudget: {
    fontSize: 14,
    color: '#0EA5E9',
    marginTop: 2,
    fontStyle: 'italic',
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
  expenseDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  expenseRight: {
    alignItems: 'flex-end',
    position: 'relative',
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
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  budgetCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  budgetCategoryName: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '600',
    marginLeft: 12,
  },
  budgetModalLabel: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 8,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  budgetHint: {
    fontSize: 14,
    color: '#64748B',
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

