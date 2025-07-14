/**
 * Wallet Screen - Digital wallet and payment management with crypto support
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
import { useWallet } from '@/contexts/WalletContext';
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
  const {
    balance,
    transactions,
    topUpWallet,
    sendMoney,
    formatCurrency,
    loading: walletLoading
  } = useWallet();
  
  const [showTransferHub, setShowTransferHub] = useState(false);

  const handleAddMoney = () => {
    Alert.alert(
      'Add Money',
      'Choose how you want to add money to your wallet:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Bank Transfer', 
          onPress: () => showBankTransferOptions()
        },
        { 
          text: 'Card Payment', 
          onPress: () => showCardPaymentOptions()
        },
        { 
          text: 'Cash Deposit', 
          onPress: () => showCashDepositOptions()
        },
        { 
          text: 'Demo +R100', 
          onPress: () => performDemoTopUp()
        },
      ]
    );
  };

  const showBankTransferOptions = () => {
    Alert.alert(
      'Bank Transfer',
      'Choose your bank transfer method:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'EFT Payment', 
          onPress: () => showEFTDetails()
        },
        { 
          text: 'PayShap (instant)', 
          onPress: () => showPayShapDetails()
        },
        { 
          text: 'Banking App', 
          onPress: () => showBankingAppIntegration()
        },
      ]
    );
  };

  const showEFTDetails = () => {
    Alert.alert(
      'EFT Transfer Details',
      `Bank: BlueBot Financial Services
Account Name: BlueBot Wallet
Account Number: 12345678901
Branch Code: 250655
Reference: ${user?.id || 'USER123'}

Save these details in your banking app for future transfers. Transfers typically take 1-3 business days to reflect.`,
      [
        { text: 'Copy Details', onPress: () => Alert.alert('Copied', 'Banking details copied to clipboard') },
        { text: 'Open Banking App', onPress: () => Alert.alert('Redirect', 'Opening your default banking app...') },
        { text: 'Done' }
      ]
    );
  };

  const showPayShapDetails = () => {
    Alert.alert(
      'PayShap Instant Transfer',
      `Send money instantly using PayShap:

1. Open your banking app
2. Select PayShap/Instant Pay
3. Enter phone: +27 87 550 8200
4. Reference: ${user?.id || 'USER123'}
5. Amount: Enter desired amount

Transfers are instant and available 24/7!`,
      [
        { text: 'How PayShap Works', onPress: () => Alert.alert('PayShap', 'PayShap is a real-time payment system that allows instant transfers between participating banks in South Africa.') },
        { text: 'Start Transfer', onPress: () => Alert.alert('Opening App', 'Opening your banking app for PayShap transfer...') },
        { text: 'Done' }
      ]
    );
  };

  const showBankingAppIntegration = () => {
    Alert.alert(
      'Open Banking Integration',
      'Connect your bank account for seamless transfers:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect FNB', onPress: () => Alert.alert('FNB Connect', 'FNB integration available in next update') },
        { text: 'Connect Capitec', onPress: () => Alert.alert('Capitec Connect', 'Capitec integration coming soon') },
        { text: 'Connect Standard Bank', onPress: () => Alert.alert('Standard Bank', 'Standard Bank integration in development') },
        { text: 'Connect Nedbank', onPress: () => Alert.alert('Nedbank', 'Nedbank integration planned for Q2') }
      ]
    );
  };

  const showCardPaymentOptions = () => {
    Alert.alert(
      'Card Payment',
      'Add money using your debit or credit card:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Debit Card', 
          onPress: () => showSecureCardEntry('debit')
        },
        { 
          text: 'Credit Card', 
          onPress: () => showSecureCardEntry('credit')
        },
        {
          text: 'Tap to Pay',
          onPress: () => showTapToPayOptions()
        }
      ]
    );
  };

  const showSecureCardEntry = (cardType: string) => {
    Alert.alert(
      `${cardType === 'debit' ? 'Debit' : 'Credit'} Card Payment`,
      `For security, card payments are processed through our secure payment partner.

✓ 256-bit SSL encryption
✓ PCI DSS compliant
✓ 3D Secure verification
✓ No card details stored

Supported cards: Visa, Mastercard, Amex`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enter Card Details', 
          onPress: () => Alert.alert('Secure Payment', 'Opening secure payment form...') 
        },
        {
          text: 'Saved Cards',
          onPress: () => Alert.alert('Saved Cards', 'No saved cards found. Add a card to enable quick payments.')
        }
      ]
    );
  };

  const showTapToPayOptions = () => {
    Alert.alert(
      'Tap to Pay',
      'Use contactless payment methods:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Samsung Pay', onPress: () => Alert.alert('Samsung Pay', 'Samsung Pay integration coming soon') },
        { text: 'Google Pay', onPress: () => Alert.alert('Google Pay', 'Google Pay support in development') },
        { text: 'Apple Pay', onPress: () => Alert.alert('Apple Pay', 'Apple Pay integration planned') },
        { text: 'SnapScan', onPress: () => Alert.alert('SnapScan', 'SnapScan partnership in progress') }
      ]
    );
  };

  const showCashDepositOptions = () => {
    Alert.alert(
      'Cash Deposit',
      'Find nearby locations to deposit cash:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'ATM Deposits', 
          onPress: () => showATMLocations()
        },
        { 
          text: 'Retail Partners', 
          onPress: () => showRetailPartners()
        },
        {
          text: 'Cash-in Agents',
          onPress: () => showCashAgents()
        }
      ]
    );
  };

  const showATMLocations = () => {
    Alert.alert(
      'ATM Cash Deposits',
      `BlueBot-enabled ATMs near you:

📍 Checkers Menlyn - 2km
📍 Pick n Pay Centurion - 3.2km  
📍 Woolworths Sandton - 8.5km
📍 FNB ATM Brooklyn - 1.8km

Deposit fees: R5 per transaction
Available 24/7`,
      [
        { text: 'Get Directions', onPress: () => Alert.alert('Navigation', 'Opening maps for closest ATM...') },
        { text: 'View All Locations', onPress: () => Alert.alert('ATM Network', 'Showing all 450+ BlueBot ATMs nationwide') },
        { text: 'Done' }
      ]
    );
  };

  const showRetailPartners = () => {
    Alert.alert(
      'Retail Cash Deposits',
      `Deposit cash at our retail partners:

🏪 Pick n Pay - All stores nationwide
🏪 Checkers - Selected stores  
🏪 Spar - Participating stores
🏪 OK Foods - Available soon
🏪 Shoprite - Coming Q2 2024

Fees: R3-R8 per deposit
Store hours apply`,
      [
        { text: 'Find Nearest Store', onPress: () => Alert.alert('Store Locator', 'Finding nearest participating store...') },
        { text: 'Check Store Hours', onPress: () => Alert.alert('Store Hours', 'Most stores: 8AM-6PM Mon-Fri, 8AM-2PM Sat') },
        { text: 'Done' }
      ]
    );
  };

  const showCashAgents = () => {
    Alert.alert(
      'Cash-in Agents',
      `Local cash agents in your area:

👤 Thabo's Shop - 500m (4.8⭐)
👤 Mary's Convenience - 1.2km (4.9⭐)
👤 Lucky's Superette - 2km (4.7⭐)

💰 Deposit up to R5,000 per day
⏰ Extended hours: 7AM-9PM
📱 SMS confirmation`,
      [
        { text: 'Contact Agent', onPress: () => Alert.alert('Agent Contact', 'Connecting you with Thabo\'s Shop...') },
        { text: 'View All Agents', onPress: () => Alert.alert('Agent Network', 'Showing all certified agents in your area') },
        { text: 'Become an Agent', onPress: () => Alert.alert('Agent Program', 'Earn money as a BlueBot cash agent! Contact us for details.') },
        { text: 'Done' }
      ]
    );
  };

  const performDemoTopUp = async () => {
    try {
      await topUpWallet(100, 'demo');
      Alert.alert('Success', 'R100 added to your wallet (Demo mode)');
    } catch (error) {
      Alert.alert('Error', 'Failed to top up wallet');
    }
  };

  const handleSendMoney = () => {
    setShowTransferHub(true);
  };

  const handleConnectCrypto = () => {
    Alert.alert(
      'Connect Crypto Wallet',
      'Choose your preferred wallet connection method:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'MetaMask', 
          onPress: async () => {
            try {
              await connectMetaMask();
              Alert.alert('Success', 'MetaMask wallet connected successfully!');
            } catch (error: any) {
              Alert.alert('Connection Failed', error.message || 'Failed to connect MetaMask');
            }
          }
        },
        { 
          text: 'WalletConnect', 
          onPress: async () => {
            try {
              await connectWalletConnect();
              Alert.alert('Success', 'Wallet connected via WalletConnect!');
            } catch (error: any) {
              Alert.alert('Connection Failed', error.message || 'Failed to connect via WalletConnect');
            }
          }
        },
        {
          text: 'Mobile Wallets',
          onPress: () => showMobileWalletOptions()
        }
      ]
    );
  };

  const showMobileWalletOptions = () => {
    Alert.alert(
      'Mobile Crypto Wallets',
      'Connect popular mobile crypto wallets:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Trust Wallet', 
          onPress: () => attemptWalletConnection('Trust Wallet', 'trustwallet://wc')
        },
        { 
          text: 'Coinbase Wallet', 
          onPress: () => attemptWalletConnection('Coinbase Wallet', 'cbwallet://wc')
        },
        { 
          text: 'Binance Wallet', 
          onPress: () => attemptWalletConnection('Binance Wallet', 'bnc://wc')
        },
        {
          text: 'Other Wallets',
          onPress: () => showOtherWallets()
        }
      ]
    );
  };

  const attemptWalletConnection = (walletName: string, deepLink: string) => {
    Alert.alert(
      `Connect ${walletName}`,
      `To connect your ${walletName}:

1. Make sure ${walletName} is installed
2. We'll open ${walletName} 
3. Approve the connection request
4. Your wallet will be linked to BlueBot

Supported networks: Ethereum, Polygon, BSC`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: `Open ${walletName}`, 
          onPress: () => {
            Alert.alert('Connecting...', `Opening ${walletName} for connection approval...`);
            // In real implementation, this would use Linking.openURL(deepLink)
          }
        },
        {
          text: 'Install Wallet',
          onPress: () => Alert.alert('Install', `Download ${walletName} from your app store first`)
        }
      ]
    );
  };

  const showOtherWallets = () => {
    Alert.alert(
      'Other Wallets',
      'Additional wallet support:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rainbow Wallet', onPress: () => attemptWalletConnection('Rainbow', 'rainbow://') },
        { text: 'Argent Wallet', onPress: () => attemptWalletConnection('Argent', 'argent://') },
        { text: 'Zerion Wallet', onPress: () => attemptWalletConnection('Zerion', 'zerion://') },
        { text: 'Request Support', onPress: () => Alert.alert('Wallet Request', 'Contact support to request integration for your preferred wallet') }
      ]
    );
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

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction) => (
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

        {/* Crypto Transactions */}
        {isCryptoConnected && cryptoTransactions.length > 0 && (
          <View style={styles.transactionsContainer}>
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
                      To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: '#F59E0B' }
                ]}>
                  -{transaction.value} ETH
                </Text>
              </View>
            ))}
          </View>
        )}

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
  transactionsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
});
