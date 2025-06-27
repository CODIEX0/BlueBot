/**
 * Simple Crypto Wallet Service for BlueBot
 * Provides basic cryptocurrency functionality for unbanked users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface CryptoWallet {
  id: string;
  address: string;
  publicKey: string;
  network: 'ethereum' | 'bitcoin' | 'polygon';
  balances: {
    [token: string]: string;
  };
  createdAt: string;
}

export interface CryptoTransaction {
  id: string;
  hash?: string;
  type: 'send' | 'receive';
  amount: string;
  token: string;
  to: string;
  from: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  fee?: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string;
  icon: string;
  color: string;
}

class CryptoWalletService {
  private readonly WALLET_KEY = 'crypto_wallet_';
  private readonly PRIVATE_KEY = 'crypto_private_key_';
  
  // Supported tokens for South African users
  private supportedTokens: TokenInfo[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      icon: '⟠',
      color: '#627EEA'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0xA0b86a33E6417D13C6c3A56b1bDb0dB4d3E8F4e3',
      icon: '$',
      color: '#2775CA'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      icon: '₮',
      color: '#26A17B'
    }
  ];

  /**
   * Create a new crypto wallet
   */
  async createWallet(userId: string): Promise<CryptoWallet> {
    try {
      // Generate a simple wallet (in production, use proper crypto libraries)
      const walletId = `wallet_${userId}_${Date.now()}`;
      const keyPair = this.generateSimpleKeyPair();
      
      const wallet: CryptoWallet = {
        id: walletId,
        address: keyPair.address,
        publicKey: keyPair.publicKey,
        network: 'ethereum',
        balances: {
          ETH: '0.00',
          USDC: '0.00',
          USDT: '0.00'
        },
        createdAt: new Date().toISOString()
      };

      // Store wallet data
      await AsyncStorage.setItem(this.WALLET_KEY + userId, JSON.stringify(wallet));
      
      // Store private key securely
      await SecureStore.setItemAsync(this.PRIVATE_KEY + userId, keyPair.privateKey);

      console.log('Crypto wallet created successfully');
      return wallet;
    } catch (error) {
      console.error('Error creating crypto wallet:', error);
      throw new Error('Failed to create crypto wallet');
    }
  }

  /**
   * Load existing wallet for user
   */
  async loadWallet(userId: string): Promise<CryptoWallet | null> {
    try {
      const walletData = await AsyncStorage.getItem(this.WALLET_KEY + userId);
      
      if (!walletData) {
        return null;
      }

      const wallet: CryptoWallet = JSON.parse(walletData);
      
      // Refresh balances
      await this.refreshBalances(wallet);
      
      return wallet;
    } catch (error) {
      console.error('Error loading wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet balance for specific token
   */
  async getBalance(userId: string, token: string): Promise<string> {
    try {
      const wallet = await this.loadWallet(userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return wallet.balances[token] || '0.00';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.00';
    }
  }

  /**
   * Send cryptocurrency
   */
  async sendCrypto(
    userId: string,
    to: string,
    amount: string,
    token: string
  ): Promise<CryptoTransaction> {
    try {
      const wallet = await this.loadWallet(userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Validate recipient address
      if (!this.isValidAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      // Check balance
      const currentBalance = parseFloat(wallet.balances[token] || '0');
      const sendAmount = parseFloat(amount);
      
      if (sendAmount > currentBalance) {
        throw new Error('Insufficient balance');
      }

      // Create transaction (mock implementation)
      const transaction: CryptoTransaction = {
        id: `tx_${Date.now()}`,
        hash: this.generateTransactionHash(),
        type: 'send',
        amount: amount,
        token: token,
        to: to,
        from: wallet.address,
        status: 'pending',
        timestamp: new Date().toISOString(),
        fee: this.calculateFee(token, amount)
      };

      // Update wallet balance (mock)
      wallet.balances[token] = (currentBalance - sendAmount).toFixed(2);
      await AsyncStorage.setItem(this.WALLET_KEY + userId, JSON.stringify(wallet));

      // Store transaction
      await this.storeTransaction(userId, transaction);

      // Simulate confirmation after 3 seconds
      setTimeout(() => {
        this.confirmTransaction(userId, transaction.id);
      }, 3000);

      return transaction;
    } catch (error) {
      console.error('Error sending crypto:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string): Promise<CryptoTransaction[]> {
    try {
      const transactionsData = await AsyncStorage.getItem(`crypto_transactions_${userId}`);
      
      if (!transactionsData) {
        return [];
      }

      const transactions: CryptoTransaction[] = JSON.parse(transactionsData);
      return transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Generate QR code data for receiving payments
   */
  generateReceiveQR(address: string, amount?: string, token?: string): string {
    let qrData = `ethereum:${address}`;
    
    if (amount && token) {
      qrData += `?value=${amount}&token=${token}`;
    }
    
    return qrData;
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens(): TokenInfo[] {
    return this.supportedTokens;
  }

  /**
   * Get current exchange rates (mock implementation)
   */
  async getExchangeRates(): Promise<{ [token: string]: number }> {
    // In production, fetch from CoinGecko or similar API
    return {
      ETH: 45000, // ZAR
      USDC: 18.5, // ZAR
      USDT: 18.5  // ZAR
    };
  }

  /**
   * Convert crypto amount to ZAR
   */
  async convertToZAR(amount: string, token: string): Promise<number> {
    const rates = await this.getExchangeRates();
    const rate = rates[token] || 0;
    return parseFloat(amount) * rate;
  }

  /**
   * Refresh wallet balances (mock implementation)
   */
  private async refreshBalances(wallet: CryptoWallet): Promise<void> {
    try {
      // In production, fetch real balances from blockchain
      // For now, simulate some balance updates
      
      // Add some mock balances for demo
      if (parseFloat(wallet.balances.ETH) === 0) {
        wallet.balances.ETH = '0.05';
        wallet.balances.USDC = '100.00';
        wallet.balances.USDT = '50.00';
        
        // Save updated balances
        const userId = wallet.id.split('_')[1];
        await AsyncStorage.setItem(this.WALLET_KEY + userId, JSON.stringify(wallet));
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  }

  /**
   * Generate simple key pair (mock implementation)
   */
  private generateSimpleKeyPair(): {
    privateKey: string;
    publicKey: string;
    address: string;
  } {
    // In production, use proper cryptographic libraries
    const privateKey = this.generateRandomHex(64);
    const publicKey = this.generateRandomHex(128);
    const address = '0x' + this.generateRandomHex(40);
    
    return { privateKey, publicKey, address };
  }

  /**
   * Generate random hex string
   */
  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate address format
   */
  private isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Generate transaction hash
   */
  private generateTransactionHash(): string {
    return '0x' + this.generateRandomHex(64);
  }

  /**
   * Calculate transaction fee
   */
  private calculateFee(token: string, amount: string): string {
    // Mock fee calculation
    if (token === 'ETH') {
      return '0.002'; // ETH
    } else {
      return '0.001'; // ETH for token transfers
    }
  }

  /**
   * Store transaction
   */
  private async storeTransaction(userId: string, transaction: CryptoTransaction): Promise<void> {
    try {
      const existingTransactions = await this.getTransactionHistory(userId);
      const updatedTransactions = [transaction, ...existingTransactions];
      
      await AsyncStorage.setItem(
        `crypto_transactions_${userId}`,
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      console.error('Error storing transaction:', error);
    }
  }

  /**
   * Confirm transaction
   */
  private async confirmTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      const transactions = await this.getTransactionHistory(userId);
      const updatedTransactions = transactions.map(tx => 
        tx.id === transactionId ? { ...tx, status: 'confirmed' as const } : tx
      );
      
      await AsyncStorage.setItem(
        `crypto_transactions_${userId}`,
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      console.error('Error confirming transaction:', error);
    }
  }

  /**
   * Delete wallet (for user data cleanup)
   */
  async deleteWallet(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.WALLET_KEY + userId);
      await AsyncStorage.removeItem(`crypto_transactions_${userId}`);
      await SecureStore.deleteItemAsync(this.PRIVATE_KEY + userId);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }
}

export default new CryptoWalletService();
