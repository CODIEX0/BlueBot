import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  Send,
  Download,
  QrCode,
  CreditCard,
  Users,
  Shield,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
} from 'lucide-react-native';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'topup';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
  recipient?: string;
}

interface Stokvel {
  id: string;
  name: string;
  members: number;
  totalAmount: number;
  myContribution: number;
  nextPayout: string;
}

export default function WalletScreen() {
  const [walletBalance, setWalletBalance] = useState(2847.50);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendRecipient, setSendRecipient] = useState('');

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'receive',
      amount: 500.00,
      description: 'From John Doe',
      date: '2025-01-20',
      status: 'completed',
      recipient: 'John Doe',
    },
    {
      id: '2',
      type: 'send',
      amount: -150.00,
      description: 'To Mary Smith',
      date: '2025-01-19',
      status: 'completed',
      recipient: 'Mary Smith',
    },
    {
      id: '3',
      type: 'topup',
      amount: 1000.00,
      description: 'Top-up at Shoprite',
      date: '2025-01-18',
      status: 'completed',
    },
    {
      id: '4',
      type: 'send',
      amount: -75.50,
      description: 'Airtime purchase',
      date: '2025-01-17',
      status: 'pending',
    },
  ];

  const stokvels: Stokvel[] = [
    {
      id: '1',
      name: 'Family Savings Group',
      members: 8,
      totalAmount: 12500.00,
      myContribution: 1500.00,
      nextPayout: '2025-02-15',
    },
    {
      id: '2',
      name: 'Community Investment Club',
      members: 15,
      totalAmount: 28750.00,
      myContribution: 2250.00,
      nextPayout: '2025-03-01',
    },
  ];

  const formatCurrency = (amount: number) => {
    return `R${Math.abs(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight size={20} color="#EF4444" />;
      case 'receive':
        return <ArrowDownLeft size={20} color="#10B981" />;
      case 'topup':
        return <Plus size={20} color="#0EA5E9" />;
      default:
        return <Wallet size={20} color="#64748B" />;
    }
  };

  const handleSendMoney = () => {
    if (!sendAmount || !sendRecipient) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const amount = parseFloat(sendAmount);
    if (amount > walletBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance to send this amount');
      return;
    }

    // Simulate sending money
    Alert.alert('Success', `R${amount} sent to ${sendRecipient}`);
    setWalletBalance(prev => prev - amount);
    setSendAmount('');
    setSendRecipient('');
    setShowSendModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Digital Wallet</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Shield size={20} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* Wallet Balance Card */}
        <LinearGradient
          colors={['#1E3A8A', '#0EA5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={24} color="#FFFFFF" />
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
          <Text style={styles.balanceSubtext}>
            Secure • Instant • No banking required
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSendModal(true)}
            >
              <Send size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Send Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReceiveModal(true)}
            >
              <Download size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowTopUpModal(true)}
            >
              <CreditCard size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <QrCode size={24} color="#1E3A8A" />
              <Text style={styles.actionText}>QR Pay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stokvels Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Stokvels</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Join New</Text>
            </TouchableOpacity>
          </View>
          {stokvels.map((stokvel) => (
            <View key={stokvel.id} style={styles.stokvelCard}>
              <View style={styles.stokvelHeader}>
                <View style={styles.stokvelIcon}>
                  <Users size={20} color="#8B5CF6" />
                </View>
                <View style={styles.stokvelInfo}>
                  <Text style={styles.stokvelName}>{stokvel.name}</Text>
                  <Text style={styles.stokvelMembers}>
                    {stokvel.members} members
                  </Text>
                </View>
                <Text style={styles.stokvelAmount}>
                  {formatCurrency(stokvel.totalAmount)}
                </Text>
              </View>
              <View style={styles.stokvelDetails}>
                <View style={styles.stokvelDetail}>
                  <Text style={styles.stokvelDetailLabel}>My Contribution</Text>
                  <Text style={styles.stokvelDetailValue}>
                    {formatCurrency(stokvel.myContribution)}
                  </Text>
                </View>
                <View style={styles.stokvelDetail}>
                  <Text style={styles.stokvelDetailLabel}>Next Payout</Text>
                  <Text style={styles.stokvelDetailValue}>{stokvel.nextPayout}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                  {transaction.status === 'pending' ? (
                    <Clock size={12} color="#F59E0B" />
                  ) : (
                    <CheckCircle size={12} color="#10B981" />
                  )}
                  <Text
                    style={[
                      styles.transactionStatus,
                      {
                        color: transaction.status === 'pending' ? '#F59E0B' : '#10B981',
                      },
                    ]}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: transaction.amount > 0 ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Send Money Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSendModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Money</Text>
            <TouchableOpacity onPress={handleSendMoney}>
              <Text style={styles.modalDone}>Send</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient</Text>
              <TextInput
                style={styles.textInput}
                value={sendRecipient}
                onChangeText={setSendRecipient}
                placeholder="Enter phone number or name"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (R)</Text>
              <TextInput
                style={styles.textInput}
                value={sendAmount}
                onChangeText={setSendAmount}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceInfoText}>
                Available Balance: {formatCurrency(walletBalance)}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Receive Money Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Receive Money</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.modalContent}>
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <QrCode size={120} color="#1E3A8A" />
              </View>
              <Text style={styles.qrTitle}>Scan to Send Money</Text>
              <Text style={styles.qrSubtitle}>
                Share this QR code with anyone who wants to send you money
              </Text>
            </View>
            <View style={styles.phoneNumber}>
              <Text style={styles.phoneNumberLabel}>Your Phone Number</Text>
              <Text style={styles.phoneNumberValue}>+27 71 234 5678</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Top Up Modal */}
      <Modal
        visible={showTopUpModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.modalContent}>
            <View style={styles.topUpOptions}>
              <TouchableOpacity style={styles.topUpOption}>
                <CreditCard size={24} color="#1E3A8A" />
                <Text style={styles.topUpOptionText}>Bank Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.topUpOption}>
                <Users size={24} color="#1E3A8A" />
                <Text style={styles.topUpOptionText}>Retail Store</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.topUpOption}>
                <Wallet size={24} color="#1E3A8A" />
                <Text style={styles.topUpOptionText}>ATM</Text>
              </TouchableOpacity>
            </View>
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
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
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
    paddingHorizontal: 8,
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
  stokvelCard: {
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
  stokvelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stokvelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stokvelInfo: {
    flex: 1,
  },
  stokvelName: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 2,
  },
  stokvelMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  stokvelAmount: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  stokvelDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stokvelDetail: {
    flex: 1,
  },
  stokvelDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  stokvelDetailValue: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
  },
  transactionItem: {
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E3A8A',
    backgroundColor: '#FFFFFF',
  },
  balanceInfo: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  balanceInfoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneNumber: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  phoneNumberLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  phoneNumberValue: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  topUpOptions: {
    paddingTop: 20,
  },
  topUpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topUpOptionText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginLeft: 16,
  },
});