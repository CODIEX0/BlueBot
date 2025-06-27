/**
 * QR Payment Service
 * Handles QR code generation and scanning for payments
 */

import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface QRPayment {
  id: string;
  merchantId?: string;
  merchantName?: string;
  amount: number;
  currency: string;
  description?: string;
  qrData: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
  payerId?: string;
  payerPhone?: string;
}

export interface QRCodeData {
  type: 'payment' | 'receive' | 'merchant';
  paymentId: string;
  amount?: number;
  merchantId?: string;
  merchantName?: string;
  description?: string;
  expiresAt: string;
}

export class QRPaymentService {
  private database: any;
  private auth: any;

  constructor() {
    // Initialize with mobile contexts
  }

  /**
   * Generate QR code for receiving payment
   */
  async generateReceiveQR(
    amount: number,
    description?: string,
    expiryMinutes: number = 30
  ): Promise<QRPayment> {
    try {
      const paymentId = await Crypto.randomUUID();
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      const qrData: QRCodeData = {
        type: 'receive',
        paymentId,
        amount,
        description,
        expiresAt: expiresAt.toISOString(),
      };

      const payment: QRPayment = {
        id: paymentId,
        merchantId: this.auth.user?.id,
        merchantName: this.auth.user?.name || this.auth.user?.email,
        amount,
        currency: 'ZAR',
        description,
        qrData: JSON.stringify(qrData),
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
      };

      // Store payment locally
      await this.database.addQRPayment(payment);

      return payment;
    } catch (error) {
      console.error('QR generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate merchant QR code for business
   */
  async generateMerchantQR(
    merchantName: string,
    fixedAmount?: number
  ): Promise<string> {
    try {
      const merchantId = this.auth.user?.id || await Crypto.randomUUID();
      
      const qrData: QRCodeData = {
        type: 'merchant',
        paymentId: await Crypto.randomUUID(),
        merchantId,
        merchantName,
        amount: fixedAmount,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      };

      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Merchant QR generation failed:', error);
      throw error;
    }
  }

  /**
   * Process QR code scan and initiate payment
   */
  async scanAndPay(
    qrCodeData: string,
    payerAmount?: number
  ): Promise<QRPayment> {
    try {
      const qrData: QRCodeData = JSON.parse(qrCodeData);
      
      // Validate QR code
      if (!this.isValidQRData(qrData)) {
        throw new Error('Invalid QR code format');
      }

      // Check expiry
      if (new Date(qrData.expiresAt) < new Date()) {
        throw new Error('QR code has expired');
      }

      // Determine payment amount
      const amount = qrData.amount || payerAmount;
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Check sender balance
      const balance = await this.getUserBalance();
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create payment record
      const payment: QRPayment = {
        id: await Crypto.randomUUID(),
        merchantId: qrData.merchantId,
        merchantName: qrData.merchantName,
        amount,
        currency: 'ZAR',
        description: qrData.description,
        qrData: qrCodeData,
        status: 'completed',
        expiresAt: new Date(qrData.expiresAt),
        createdAt: new Date(),
        completedAt: new Date(),
        payerId: this.auth.user?.id,
        payerPhone: this.auth.user?.phone,
      };

      // Process payment
      await this.deductBalance(amount);
      await this.creditMerchant(qrData.merchantId || '', amount);
      
      // Store payment record
      await this.database.addQRPayment(payment);

      // Update original payment if it exists
      if (qrData.type === 'receive') {
        await this.updateOriginalPayment(qrData.paymentId, payment);
      }

      return payment;
    } catch (error) {
      console.error('QR payment failed:', error);
      throw error;
    }
  }

  /**
   * Generate offline QR code for later processing
   */
  async generateOfflineQR(
    amount: number,
    description?: string
  ): Promise<string> {
    try {
      const offlineData = {
        type: 'offline_payment',
        amount,
        description,
        userId: this.auth.user?.id,
        userName: this.auth.user?.name || this.auth.user?.email,
        timestamp: new Date().toISOString(),
        signature: await this.signOfflinePayment(amount, description || ''),
      };

      return JSON.stringify(offlineData);
    } catch (error) {
      console.error('Offline QR generation failed:', error);
      throw error;
    }
  }

  /**
   * Process offline QR codes when connection is restored
   */
  async processOfflineQRCodes(): Promise<void> {
    try {
      const offlinePayments = await this.database.getOfflinePayments();
      
      for (const payment of offlinePayments) {
        try {
          // Validate and process each offline payment
          await this.processOfflinePayment(payment);
          await this.database.markOfflinePaymentProcessed(payment.id);
        } catch (error) {
          console.error('Failed to process offline payment:', payment.id, error);
        }
      }
    } catch (error) {
      console.error('Offline QR processing failed:', error);
    }
  }

  /**
   * Get QR payment history
   */
  async getQRPaymentHistory(): Promise<QRPayment[]> {
    return await this.database.getQRPayments();
  }

  /**
   * Get active (pending) QR codes
   */
  async getActiveQRCodes(): Promise<QRPayment[]> {
    const payments = await this.database.getQRPayments();
    return payments.filter(p => 
      p.status === 'pending' && 
      p.expiresAt > new Date()
    );
  }

  /**
   * Cancel QR payment
   */
  async cancelQRPayment(paymentId: string): Promise<void> {
    const payment = await this.database.getQRPaymentById(paymentId);
    
    if (!payment || payment.status !== 'pending') {
      throw new Error('Cannot cancel this payment');
    }

    payment.status = 'cancelled';
    await this.database.updateQRPayment(payment);
  }

  /**
   * Validate QR code data structure
   */
  private isValidQRData(qrData: QRCodeData): boolean {
    return !!(
      qrData.type &&
      qrData.paymentId &&
      qrData.expiresAt &&
      ['payment', 'receive', 'merchant'].includes(qrData.type)
    );
  }

  /**
   * Sign offline payment for security
   */
  private async signOfflinePayment(amount: number, description: string): Promise<string> {
    const data = `${amount}:${description}:${this.auth.user?.id}:${Date.now()}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash;
  }

  /**
   * Get user's current balance
   */
  private async getUserBalance(): Promise<number> {
    const balance = await AsyncStorage.getItem('userBalance');
    return balance ? parseFloat(balance) : 0;
  }

  /**
   * Deduct amount from user balance
   */
  private async deductBalance(amount: number): Promise<void> {
    const currentBalance = await this.getUserBalance();
    const newBalance = currentBalance - amount;
    await AsyncStorage.setItem('userBalance', newBalance.toString());
  }

  /**
   * Credit merchant account
   */
  private async creditMerchant(merchantId: string, amount: number): Promise<void> {
    // In a real implementation, this would credit the merchant's account
    // For now, we'll store it as a pending credit
    await this.database.addMerchantCredit({
      merchantId,
      amount,
      timestamp: new Date(),
      status: 'pending'
    });
  }

  /**
   * Update original payment when QR is scanned
   */
  private async updateOriginalPayment(
    originalPaymentId: string,
    paymentDetails: QRPayment
  ): Promise<void> {
    const originalPayment = await this.database.getQRPaymentById(originalPaymentId);
    
    if (originalPayment) {
      originalPayment.status = 'completed';
      originalPayment.completedAt = new Date();
      originalPayment.payerId = paymentDetails.payerId;
      originalPayment.payerPhone = paymentDetails.payerPhone;
      
      await this.database.updateQRPayment(originalPayment);
    }
  }

  /**
   * Process individual offline payment
   */
  private async processOfflinePayment(payment: any): Promise<void> {
    // Validate offline payment signature
    const isValid = await this.validateOfflinePayment(payment);
    
    if (!isValid) {
      throw new Error('Invalid offline payment signature');
    }

    // Process the payment if valid
    // This would involve actual money transfer logic
    console.log('Processing offline payment:', payment.id);
  }

  /**
   * Validate offline payment signature
   */
  private async validateOfflinePayment(payment: any): Promise<boolean> {
    // Validate the signature created during offline QR generation
    // This is a simplified version - real implementation would be more robust
    return true; // Placeholder
  }

  /**
   * Generate QR code string for display
   */
  generateQRCodeString(qrData: string): string {
    // This would be used with react-native-qrcode-svg
    return qrData;
  }
}

// Export for use in components
export default QRPaymentService;
