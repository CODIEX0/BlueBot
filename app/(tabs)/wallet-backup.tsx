/**
 * Wallet Screen - Digital wallet and payment management
 * Supports offline storage with cloud sync when available
 */

import React from 'react';
const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import { useCryptoWallet } from '@/contexts/SimpleCryptoWalletContext';
import MoneyTransferHub from '@/components/MoneyTransferHub';

export default function WalletScreen() {
  const { user } = useMobileAuth();
  const { isOnline, syncStatus } = useMobileDatabase();
  const { 
    isConnected: isCryptoConnected, 
    wallet: cryptoWallet, 
    transactions: cryptoTransactions,
    isLoading: cryptoLoading,
    error: cryptoError,
    connectMetaMask,
    connectWalletConnect,
    disconnectWallet: disconnectCryptoWallet,
    clearError
  } = useCryptoWallet();
  
  const [balance, setBalance] = useState(2450.75);
  const [showTransferHub, setShowTransferHub] = useState(false);
  const [showCryptoWallet, setShowCryptoWallet] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: '1', type: 'credit', amount: 500, description: 'Salary', date: '2025-06-26' },
    { id: '2', type: 'debit', amount: 45.50, description: 'Groceries', date: '2025-06-26' },
    { id: '3', type: 'debit', amount: 120, description: 'Electricity', date: '2025-06-25' },
  ]);

  const formatCurrency = (amount: number): string => {
    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleAddMoney = () => {
    Alert.alert('Add Money', 'This feature will be available soon with bank integration');
  };

  const handleSendMoney = () => {
    // Navigate to money transfer hub
    setShowTransferHub(true);
  };

  const handleConnectCrypto = () => {
    // Connect to crypto wallet
    if (isCryptoConnected) {
      disconnectCryptoWallet();
    } else {
      // Choose connection method (MetaMask or WalletConnect)
      Alert.alert(
        'Connect Crypto Wallet',
        'Choose a connection method',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'MetaMask', onPress: () => connectMetaMask() },
          { text: 'WalletConnect', onPress: () => connectWalletConnect() },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* Sync Status */}
        {syncStatus.pendingChanges > 0 && (
          <View style={styles.syncAlert}>
            <Ionicons name="cloud-upload-outline" size={16} color="#F59E0B" />
            <Text style={styles.syncText}>
              {syncStatus.pendingChanges} changes pending sync
            </Text>
          </View>
        )}

        {/* Balance Card */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Ionicons name="wallet-outline" size={24} color="white" />
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceSubtext}>South African Rand (ZAR)</Text>
        </LinearGradient>

        {/* Crypto Balance Card */}
        <LinearGradient
          colors={['#6B21A8', '#A855F7']}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Crypto Balance</Text>
            <Ionicons name="logo-bitcoin" size={24} color="white" />
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(cryptoWallet.balance)}</Text>
          <Text style={styles.balanceSubtext}>Bitcoin (BTC)</Text>
        </LinearGradient>

        {/* Crypto Wallet Section */}
        <View style={styles.cryptoSection}>
          <View style={styles.cryptoHeader}>
            <Text style={styles.sectionTitle}>Crypto Wallet</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isCryptoConnected ? '#10B981' : '#EF4444' }]} />
          </View>
          
          {!isCryptoConnected ? (
            <View style={styles.cryptoConnectSection}>
              <Text style={styles.cryptoDescription}>
                Connect your crypto wallet to manage digital assets and make crypto payments
              </Text>
              
              <View style={styles.cryptoButtons}>
                <TouchableOpacity 
                  style={styles.cryptoButton} 
                  onPress={connectMetaMask}
                  disabled={cryptoLoading}
                >
                  <LinearGradient
                    colors={['#F97316', '#EA580C']}
                    style={styles.cryptoButtonGradient}
                  >
                    <Ionicons name="wallet" size={20} color="white" />
                    <Text style={styles.cryptoButtonText}>
                      {cryptoLoading ? 'Connecting...' : 'Connect MetaMask'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cryptoButton} 
                  onPress={connectWalletConnect}
                  disabled={cryptoLoading}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.cryptoButtonGradient}
                  >
                    <Ionicons name="qr-code" size={20} color="white" />
                    <Text style={styles.cryptoButtonText}>
                      {cryptoLoading ? 'Connecting...' : 'WalletConnect'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              {cryptoError && (
                <View style={styles.errorContainer}>
                  <View style={styles.errorBox}>
                    <Ionicons name="warning" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{cryptoError}</Text>
                    <TouchableOpacity onPress={clearError}>
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.cryptoWalletConnected}>
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.cryptoWalletCard}
              >
                <View style={styles.cryptoWalletHeader}>
                  <View>
                    <Text style={styles.cryptoWalletLabel}>Crypto Balance</Text>
                    <Text style={styles.cryptoWalletNetwork}>{cryptoWallet?.network}</Text>
                  </View>
                  <TouchableOpacity onPress={disconnectCryptoWallet}>
                    <Ionicons name="log-out-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.cryptoBalance}>{cryptoWallet?.balance} ETH</Text>
                <Text style={styles.cryptoAddress}>
                  {cryptoWallet?.address.slice(0, 6)}...{cryptoWallet?.address.slice(-4)}
                </Text>
              </LinearGradient>
              
              {/* Crypto Transactions */}
              {cryptoTransactions.length > 0 && (
                <View style={styles.cryptoTransactions}>
                  <Text style={styles.sectionTitle}>Recent Crypto Transactions</Text>
                  {cryptoTransactions.slice(0, 3).map((transaction) => (
                    <View key={transaction.hash} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View style={[
                          styles.transactionIcon,
                          { backgroundColor: transaction.status === 'confirmed' ? '#10B981' : '#F59E0B' }
                        ]}>
                          <Ionicons 
                            name={transaction.status === 'confirmed' ? 'checkmark' : 'time'} 
                            size={16} 
                            color="white" 
                          />
                        </View>
                        <View>
                          <Text style={styles.transactionDescription}>
                            {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        { color: '#10B981' }
                      ]}>
                        -{transaction.value} ETH
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddMoney}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.actionText}>Add Money</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSendMoney}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.actionGradient}
            >
              <Ionicons name="send-outline" size={24} color="white" />
              <Text style={styles.actionText}>Send Money</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Crypto Wallet Connection */}
        <View style={styles.cryptoContainer}>
          <Text style={styles.sectionTitle}>Crypto Wallet</Text>
          <TouchableOpacity 
            style={[styles.cryptoButton, isCryptoConnected && styles.connectedButton]}
            onPress={handleConnectCrypto}
          >
            <Ionicons 
              name={isCryptoConnected ? "checkmark-circle" : "wallet-outline"} 
              size={24} 
              color={isCryptoConnected ? "#10B981" : "#1E293B"} 
            />
            <Text style={[styles.cryptoText, isCryptoConnected && styles.connectedText]}>
              {isCryptoConnected ? 'Connected' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
                ]}>
                  <Ionicons 
                    name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                    size={16} 
                    color="white" 
                  />
                </View>
                <View>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
              ]}>
                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Local Storage Notice */}
        <View style={styles.storageNotice}>
          <Ionicons name="phone-portrait-outline" size={16} color="#64748B" />
          <Text style={styles.storageText}>
            All data is stored locally on your device and synced to cloud when online
          </Text>
        </View>
        {/* Money Transfer Hub Modal */}
        <Modal
          visible={showTransferHub}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowTransferHub(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Money Transfer</Text>
              <View style={styles.placeholder} />
            </View>
            <MoneyTransferHub />
          </View>
        </Modal>

        {/* Crypto Wallet Modal - Connect/Disconnect */}
        <Modal
          visible={showCryptoWallet}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowCryptoWallet(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Crypto Wallet</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.cryptoModalContent}>
              {!isCryptoConnected ? (
                <View style={styles.connectWalletContainer}>
                  <Text style={styles.connectWalletTitle}>Connect Your Wallet</Text>
                  <Text style={styles.connectWalletDescription}>
                    To view your crypto balance and transactions, connect your wallet.
                  </Text>
                  <TouchableOpacity 
                    style={styles.connectButton}
                    onPress={handleConnectCrypto}
                  >
                    <Text style={styles.connectButtonText}>
                      {isCryptoConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.walletInfoContainer}>
                  <Text style={styles.walletInfoTitle}>Wallet Connected</Text>
                  <Text style={styles.walletAddress}>{cryptoWallet.address}</Text>
                  <TouchableOpacity 
                    style={styles.viewTransactionsButton}
                    onPress={() => setShowCryptoWallet(false)} // Close modal for now
                  >
                    <Text style={styles.viewTransactionsButtonText}>
                      View Transactions
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
  },
  syncAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 20,
  },
  syncText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
  },
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  cryptoSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cryptoConnectSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cryptoDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  cryptoButtons: {
    gap: 12,
  },
  cryptoButton: {
    width: '100%',
  },
  cryptoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  cryptoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
  },
  cryptoWalletConnected: {
    gap: 16,
  },
  cryptoWalletCard: {
    padding: 20,
    borderRadius: 12,
  },
  cryptoWalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cryptoWalletLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cryptoWalletNetwork: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  cryptoBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cryptoAddress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
  },
  cryptoTransactions: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  storageText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  // Crypto Wallet Styles
  cryptoSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cryptoConnectSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cryptoDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  cryptoButtons: {
    gap: 12,
  },
  cryptoButton: {
    width: '100%',
  },
  cryptoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  cryptoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
  },
  cryptoWalletConnected: {
    gap: 16,
  },
  cryptoWalletCard: {
    padding: 20,
    borderRadius: 12,
  },
  cryptoWalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cryptoWalletLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cryptoWalletNetwork: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  cryptoBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cryptoAddress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
  },
  cryptoTransactions: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
