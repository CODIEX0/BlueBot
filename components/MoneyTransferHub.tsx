/**
 * Money Transfer Hub - Comprehensive bankless money transfer interface
 * Features phone transfers, QR payments, and cash network integration
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
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import QRPaymentService from '../services/QRPaymentService_Production';
import USSDService from '../services/USSDService_Production';
import WhatsAppService from '../services/WhatsAppIntegration_Production';

const { width } = Dimensions.get('window');

interface TransferMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
}

export default function MoneyTransferHub() {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [nearbyAgents, setNearbyAgents] = useState([]);
  const [userBalance, setUserBalance] = useState(2450.75);

  const { user, isOnline } = useMobileAuth();
  const { syncStatus } = useMobileDatabase();
  const router = useRouter();

  const transferMethods: TransferMethod[] = [
    {
      id: 'phone',
      title: 'Send to Phone Number',
      subtitle: 'Send money using SMS/WhatsApp',
      icon: 'phone-portrait-outline',
      color: '#10B981',
      available: true,
    },
    {
      id: 'qr_generate',
      title: 'Generate QR Code',
      subtitle: 'Create QR for others to scan',
      icon: 'qr-code-outline',
      color: '#3B82F6',
      available: true,
    },
    {
      id: 'qr_scan',
      title: 'Scan QR Code',
      subtitle: 'Scan to pay someone',
      icon: 'scan-outline',
      color: '#8B5CF6',
      available: true,
    },
    {
      id: 'cash_out',
      title: 'Cash Out',
      subtitle: 'Get cash from nearby agents',
      icon: 'cash-outline',
      color: '#F59E0B',
      available: true,
    },
    {
      id: 'cash_in',
      title: 'Cash In',
      subtitle: 'Deposit cash to digital wallet',
      icon: 'wallet-outline',
      color: '#06B6D4',
      available: true,
    },
    {
      id: 'airtime',
      title: 'Buy Airtime',
      subtitle: 'Purchase airtime for any network',
      icon: 'phone-portrait',
      color: '#EF4444',
      available: true,
    },
  ];

  useEffect(() => {
    loadNearbyAgents();
  }, []);

  const loadNearbyAgents = async () => {
    // Simulated nearby agents data
    setNearbyAgents([
      { id: '1', name: 'Spar Supermarket', distance: '0.2km', rating: 4.8 },
      { id: '2', name: 'Joe\'s Spaza Shop', distance: '0.5km', rating: 4.6 },
      { id: '3', name: 'Pick n Pay Express', distance: '1.2km', rating: 4.9 },
    ]);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    
    switch (methodId) {
      case 'qr_generate':
        handleGenerateQR();
        break;
      case 'qr_scan':
        handleScanQR();
        break;
      case 'cash_out':
        handleCashOut();
        break;
      case 'cash_in':
        handleCashIn();
        break;
      case 'airtime':
        handleBuyAirtime();
        break;
      default:
        break;
    }
  };

  const handlePhoneTransfer = async () => {
    if (!recipientPhone || !transferAmount) {
      Alert.alert('Error', 'Please enter phone number and amount');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0 || amount > userBalance) {
      Alert.alert('Error', 'Invalid amount or insufficient balance');
      return;
    }

    try {
      Alert.alert(
        'Send Money',
        `Send R${amount.toFixed(2)} to ${recipientPhone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              // Simulate phone transfer
              Alert.alert(
                'Money Sent',
                `R${amount.toFixed(2)} sent to ${recipientPhone} via SMS. They will receive a PIN to collect the money.`
              );
              setUserBalance(prev => prev - amount);
              setTransferAmount('');
              setRecipientPhone('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send money. Please try again.');
    }
  };

  const handleGenerateQR = () => {
    if (!transferAmount) {
      Alert.alert('Error', 'Please enter amount to generate QR code');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'receive',
      amount,
      userId: user?.id,
      userName: user?.name || user?.email,
      timestamp: new Date().toISOString(),
    });

    setQrCodeData(qrData);
    setShowQRModal(true);
  };

  const handleScanQR = () => {
    // Navigate to QR scanner screen
    router.push('/qr-scanner');
  };

  const handleCashOut = () => {
    if (nearbyAgents.length === 0) {
      Alert.alert('No Agents', 'No cash-out agents found nearby');
      return;
    }

    Alert.alert(
      'Cash Out',
      `Found ${nearbyAgents.length} nearby agents. Select one to continue.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Agents', onPress: () => router.push('/cash-agents') },
      ]
    );
  };

  const handleCashIn = () => {
    if (nearbyAgents.length === 0) {
      Alert.alert('No Agents', 'No cash-in agents found nearby');
      return;
    }

    Alert.alert(
      'Cash In',
      `Found ${nearbyAgents.length} nearby agents. Select one to continue.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Agents', onPress: () => router.push('/cash-agents') },
      ]
    );
  };

  const handleBuyAirtime = () => {
    Alert.alert(
      'Buy Airtime', 
      'Select your mobile network:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Vodacom', onPress: () => Alert.alert('Vodacom Airtime', 'Opening Vodacom airtime purchase...') },
        { text: 'MTN', onPress: () => Alert.alert('MTN Airtime', 'Opening MTN airtime purchase...') },
        { text: 'Cell C', onPress: () => Alert.alert('Cell C Airtime', 'Opening Cell C airtime purchase...') },
        { text: 'Telkom', onPress: () => Alert.alert('Telkom Airtime', 'Opening Telkom airtime purchase...') }
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Money Transfer</Text>
          <Text style={styles.headerSubtitle}>Send and receive money without a bank</Text>
        </View>

        {/* Balance & Status */}
        <View style={styles.balanceContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6']}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.statusText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(userBalance)}</Text>
            {syncStatus.pendingChanges > 0 && (
              <Text style={styles.syncStatus}>
                {syncStatus.pendingChanges} changes pending sync
              </Text>
            )}
          </LinearGradient>
        </View>

        {/* Transfer Methods */}
        <View style={styles.methodsContainer}>
          <Text style={styles.sectionTitle}>Transfer Methods</Text>
          <View style={styles.methodsGrid}>
            {transferMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  !method.available && styles.methodCardDisabled
                ]}
                onPress={() => method.available && handleMethodSelect(method.id)}
                disabled={!method.available}
              >
                <LinearGradient
                  colors={method.available ? [method.color, method.color + '80'] : ['#9CA3AF', '#6B7280']}
                  style={styles.methodGradient}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  {!method.available && (
                    <Text style={styles.comingSoon}>Coming Soon</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone Transfer Form */}
        {selectedMethod === 'phone' && (
          <View style={styles.transferForm}>
            <Text style={styles.formTitle}>Send to Phone Number</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Recipient Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+27 XX XXX XXXX"
                placeholderTextColor="#9CA3AF"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (ZAR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={transferAmount}
                onChangeText={setTransferAmount}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handlePhoneTransfer}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.sendButtonText}>Send Money</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* QR Generate Form */}
        {selectedMethod === 'qr_generate' && (
          <View style={styles.transferForm}>
            <Text style={styles.formTitle}>Generate QR Code</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount to Receive (ZAR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={transferAmount}
                onChangeText={setTransferAmount}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleGenerateQR}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="qr-code" size={20} color="white" />
                <Text style={styles.sendButtonText}>Generate QR</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Agents */}
        {(selectedMethod === 'cash_out' || selectedMethod === 'cash_in') && (
          <View style={styles.agentsContainer}>
            <Text style={styles.sectionTitle}>Nearby Cash Agents</Text>
            {nearbyAgents.map((agent: any) => (
              <View key={agent.id} style={styles.agentCard}>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentDistance}>{agent.distance}</Text>
                </View>
                <View style={styles.agentRating}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{agent.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* QR Code Modal */}
        <Modal
          visible={showQRModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Receive Payment</Text>
                <TouchableOpacity
                  onPress={() => setShowQRModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrContainer}>
                {qrCodeData ? (
                  <QRCode
                    value={qrCodeData}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                ) : null}
              </View>

              <Text style={styles.qrAmount}>
                Amount: {formatCurrency(parseFloat(transferAmount) || 0)}
              </Text>
              
              <Text style={styles.qrInstructions}>
                Show this QR code to the person sending you money
              </Text>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  Alert.alert(
                    'Share QR Code', 
                    'Choose how to share your payment QR code:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'WhatsApp', onPress: () => Alert.alert('WhatsApp', 'Opening WhatsApp to share QR code...') },
                      { text: 'SMS', onPress: () => Alert.alert('SMS', 'Opening messages to share payment link...') },
                      { text: 'Email', onPress: () => Alert.alert('Email', 'Opening email to share payment details...') },
                      { text: 'Copy Link', onPress: () => Alert.alert('Copied', 'Payment link copied to clipboard!') }
                    ]
                  );
                }}
              >
                <Ionicons name="share-outline" size={20} color="#3B82F6" />
                <Text style={styles.shareButtonText}>Share QR Code</Text>
              </TouchableOpacity>
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
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  balanceContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  methodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  methodCardDisabled: {
    opacity: 0.6,
  },
  methodGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  transferForm: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    marginTop: 8,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  agentsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  agentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  agentDistance: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  agentRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
  },
});
