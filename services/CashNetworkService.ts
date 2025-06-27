/**
 * Cash Network Service
 * Manages cash-in and cash-out through agent network
 */

import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';

export interface CashAgent {
  id: string;
  name: string;
  businessName?: string;
  phoneNumber: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    province: string;
    city: string;
  };
  services: CashService[];
  rating: number;
  reviewCount: number;
  cashLimits: {
    dailyLimit: number;
    perTransactionLimit: number;
    availableCash: number;
  };
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  fees: {
    cashInFee: number;
    cashOutFee: number;
  };
  verified: boolean;
  active: boolean;
  lastSeen: Date;
}

export interface CashService {
  type: 'cash_in' | 'cash_out' | 'bill_payment' | 'airtime' | 'data';
  available: boolean;
  fee: number;
  minAmount: number;
  maxAmount: number;
}

export interface CashTransaction {
  id: string;
  agentId: string;
  userId: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  pin: string;
  qrCode?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  agentConfirmation?: boolean;
  userConfirmation?: boolean;
}

export class CashNetworkService {
  private database: any;
  private auth: any;

  constructor() {
    // Initialize with mobile contexts
  }

  /**
   * Find nearby cash agents
   */
  async findNearbyAgents(
    radius: number = 5000, // 5km default
    serviceType?: 'cash_in' | 'cash_out'
  ): Promise<CashAgent[]> {
    try {
      // Get user's location
      const location = await this.getUserLocation();
      
      // Get all agents from database
      const allAgents = await this.database.getAllCashAgents();
      
      // Filter by distance and service type
      const nearbyAgents = allAgents.filter((agent: CashAgent) => {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          agent.location.latitude,
          agent.location.longitude
        );
        
        const withinRadius = distance <= radius;
        const hasService = !serviceType || agent.services.some(
          service => service.type === serviceType && service.available
        );
        
        return withinRadius && hasService && agent.active;
      });

      // Sort by distance
      return nearbyAgents.sort((a, b) => {
        const distanceA = this.calculateDistance(
          location.latitude, location.longitude,
          a.location.latitude, a.location.longitude
        );
        const distanceB = this.calculateDistance(
          location.latitude, location.longitude,
          b.location.latitude, b.location.longitude
        );
        return distanceA - distanceB;
      });
    } catch (error) {
      console.error('Failed to find nearby agents:', error);
      throw error;
    }
  }

  /**
   * Initiate cash-in transaction
   */
  async initiateCashIn(
    agentId: string,
    amount: number
  ): Promise<CashTransaction> {
    try {
      const agent = await this.database.getCashAgentById(agentId);
      
      if (!agent || !agent.active) {
        throw new Error('Agent not available');
      }

      // Check agent's cash limits
      if (amount > agent.cashLimits.perTransactionLimit) {
        throw new Error('Amount exceeds agent\'s transaction limit');
      }

      // Calculate fees
      const fee = this.calculateCashInFee(amount, agent.fees.cashInFee);
      const totalAmount = amount - fee; // User gets amount minus fee

      // Generate transaction PIN
      const pin = await this.generateTransactionPin();

      // Create transaction
      const transaction: CashTransaction = {
        id: await Crypto.randomUUID(),
        agentId,
        userId: this.auth.user?.id || '',
        type: 'cash_in',
        amount,
        fee,
        totalAmount,
        status: 'pending',
        pin,
        qrCode: await this.generateTransactionQR(pin, amount, 'cash_in'),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        agentConfirmation: false,
        userConfirmation: false,
      };

      // Store transaction
      await this.database.addCashTransaction(transaction);

      // Send notification to agent
      await this.notifyAgent(agent, transaction);

      return transaction;
    } catch (error) {
      console.error('Cash-in initiation failed:', error);
      throw error;
    }
  }

  /**
   * Initiate cash-out transaction
   */
  async initiateCashOut(
    agentId: string,
    amount: number
  ): Promise<CashTransaction> {
    try {
      // Check user balance
      const userBalance = await this.getUserBalance();
      
      const agent = await this.database.getCashAgentById(agentId);
      
      if (!agent || !agent.active) {
        throw new Error('Agent not available');
      }

      // Calculate fees
      const fee = this.calculateCashOutFee(amount, agent.fees.cashOutFee);
      const totalDeduction = amount + fee;

      if (userBalance < totalDeduction) {
        throw new Error('Insufficient balance');
      }

      // Check agent's available cash
      if (amount > agent.cashLimits.availableCash) {
        throw new Error('Agent has insufficient cash');
      }

      // Generate transaction PIN
      const pin = await this.generateTransactionPin();

      // Create transaction
      const transaction: CashTransaction = {
        id: await Crypto.randomUUID(),
        agentId,
        userId: this.auth.user?.id || '',
        type: 'cash_out',
        amount,
        fee,
        totalAmount: totalDeduction,
        status: 'pending',
        pin,
        qrCode: await this.generateTransactionQR(pin, amount, 'cash_out'),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        agentConfirmation: false,
        userConfirmation: false,
      };

      // Store transaction
      await this.database.addCashTransaction(transaction);

      // Send notification to agent
      await this.notifyAgent(agent, transaction);

      return transaction;
    } catch (error) {
      console.error('Cash-out initiation failed:', error);
      throw error;
    }
  }

  /**
   * Confirm transaction with PIN (for agent)
   */
  async confirmTransactionAsAgent(
    pin: string,
    agentId: string
  ): Promise<CashTransaction> {
    try {
      const transaction = await this.database.getCashTransactionByPin(pin);
      
      if (!transaction) {
        throw new Error('Invalid transaction PIN');
      }

      if (transaction.agentId !== agentId) {
        throw new Error('Transaction not assigned to this agent');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      if (transaction.expiresAt < new Date()) {
        throw new Error('Transaction has expired');
      }

      // Mark agent confirmation
      transaction.agentConfirmation = true;

      // If user also confirmed, complete the transaction
      if (transaction.userConfirmation) {
        await this.completeTransaction(transaction);
      } else {
        await this.database.updateCashTransaction(transaction);
      }

      return transaction;
    } catch (error) {
      console.error('Agent confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Confirm transaction (for user)
   */
  async confirmTransactionAsUser(
    transactionId: string
  ): Promise<CashTransaction> {
    try {
      const transaction = await this.database.getCashTransactionById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.userId !== this.auth.user?.id) {
        throw new Error('Transaction not belonging to user');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      // Mark user confirmation
      transaction.userConfirmation = true;

      // If agent also confirmed, complete the transaction
      if (transaction.agentConfirmation) {
        await this.completeTransaction(transaction);
      } else {
        await this.database.updateCashTransaction(transaction);
      }

      return transaction;
    } catch (error) {
      console.error('User confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Complete the cash transaction
   */
  private async completeTransaction(transaction: CashTransaction): Promise<void> {
    try {
      if (transaction.type === 'cash_in') {
        // Add money to user's digital wallet
        await this.addToUserBalance(transaction.totalAmount);
      } else if (transaction.type === 'cash_out') {
        // Deduct money from user's digital wallet
        await this.deductFromUserBalance(transaction.totalAmount);
        
        // Update agent's available cash
        await this.updateAgentCash(transaction.agentId, -transaction.amount);
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await this.database.updateCashTransaction(transaction);

      // Pay commission to agent
      await this.payAgentCommission(transaction);

      // Send completion notifications
      await this.sendCompletionNotifications(transaction);
    } catch (error) {
      console.error('Transaction completion failed:', error);
      transaction.status = 'failed';
      await this.database.updateCashTransaction(transaction);
      throw error;
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactionHistory(): Promise<CashTransaction[]> {
    return await this.database.getUserCashTransactions(this.auth.user?.id);
  }

  /**
   * Rate and review agent
   */
  async rateAgent(
    agentId: string,
    rating: number,
    review?: string
  ): Promise<void> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      await this.database.addAgentReview({
        agentId,
        userId: this.auth.user?.id,
        rating,
        review,
        createdAt: new Date(),
      });

      // Update agent's average rating
      await this.updateAgentRating(agentId);
    } catch (error) {
      console.error('Agent rating failed:', error);
      throw error;
    }
  }

  /**
   * Register as cash agent
   */
  async registerAsAgent(agentData: Partial<CashAgent>): Promise<CashAgent> {
    try {
      const agent: CashAgent = {
        id: await Crypto.randomUUID(),
        name: agentData.name || '',
        businessName: agentData.businessName,
        phoneNumber: this.auth.user?.phone || '',
        location: agentData.location || await this.getUserLocationDetails(),
        services: agentData.services || this.getDefaultServices(),
        rating: 5.0,
        reviewCount: 0,
        cashLimits: agentData.cashLimits || this.getDefaultCashLimits(),
        operatingHours: agentData.operatingHours || this.getDefaultOperatingHours(),
        fees: agentData.fees || this.getDefaultFees(),
        verified: false,
        active: true,
        lastSeen: new Date(),
      };

      await this.database.addCashAgent(agent);
      return agent;
    } catch (error) {
      console.error('Agent registration failed:', error);
      throw error;
    }
  }

  // Helper methods
  private async getUserLocation(): Promise<{ latitude: number; longitude: number }> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  private calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private calculateCashInFee(amount: number, feeRate: number): number {
    return Math.max(amount * feeRate, 5); // Minimum R5 fee
  }

  private calculateCashOutFee(amount: number, feeRate: number): number {
    return Math.max(amount * feeRate, 5); // Minimum R5 fee
  }

  private async generateTransactionPin(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(3);
    const randomNumber = randomBytes.reduce((acc, byte) => acc * 256 + byte, 0);
    return String(randomNumber % 900000 + 100000); // 6-digit number
  }

  private async generateTransactionQR(
    pin: string,
    amount: number,
    type: string
  ): Promise<string> {
    const qrData = {
      pin,
      amount,
      type,
      userId: this.auth.user?.id,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(qrData);
  }

  private async getUserBalance(): Promise<number> {
    // Implementation would get balance from secure storage
    return 1000; // Placeholder
  }

  private async addToUserBalance(amount: number): Promise<void> {
    // Implementation would update user's balance
    console.log('Added to balance:', amount);
  }

  private async deductFromUserBalance(amount: number): Promise<void> {
    // Implementation would deduct from user's balance
    console.log('Deducted from balance:', amount);
  }

  private async updateAgentCash(agentId: string, amount: number): Promise<void> {
    // Implementation would update agent's available cash
    console.log('Updated agent cash:', agentId, amount);
  }

  private async payAgentCommission(transaction: CashTransaction): Promise<void> {
    // Implementation would pay commission to agent
    console.log('Paid commission for transaction:', transaction.id);
  }

  private async notifyAgent(agent: CashAgent, transaction: CashTransaction): Promise<void> {
    // Implementation would send push notification or SMS to agent
    console.log('Notified agent:', agent.name, transaction.id);
  }

  private async sendCompletionNotifications(transaction: CashTransaction): Promise<void> {
    // Implementation would send completion notifications
    console.log('Sent completion notifications for:', transaction.id);
  }

  private async updateAgentRating(agentId: string): Promise<void> {
    // Implementation would recalculate agent's average rating
    console.log('Updated rating for agent:', agentId);
  }

  private async getUserLocationDetails(): Promise<any> {
    // Implementation would get detailed location info
    return {
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'Johannesburg, South Africa',
      province: 'Gauteng',
      city: 'Johannesburg',
    };
  }

  private getDefaultServices(): CashService[] {
    return [
      { type: 'cash_in', available: true, fee: 0.02, minAmount: 10, maxAmount: 5000 },
      { type: 'cash_out', available: true, fee: 0.025, minAmount: 20, maxAmount: 3000 },
    ];
  }

  private getDefaultCashLimits() {
    return {
      dailyLimit: 20000,
      perTransactionLimit: 5000,
      availableCash: 10000,
    };
  }

  private getDefaultOperatingHours() {
    return {
      open: '08:00',
      close: '18:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    };
  }

  private getDefaultFees() {
    return {
      cashInFee: 0.02, // 2%
      cashOutFee: 0.025, // 2.5%
    };
  }
}

export default CashNetworkService;
