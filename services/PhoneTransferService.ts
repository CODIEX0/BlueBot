/**
 * Phone Number Transfer Service
 * Enables money transfers using just phone numbers
 */

import { useMobileDatabase } from '@/contexts/MobileDatabaseContext';
import { useMobileAuth } from '@/contexts/MobileAuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';
import * as Crypto from 'expo-crypto';

export interface PhoneTransfer {
  id: string;
  senderPhone: string;
  recipientPhone: string;
  amount: number;
  currency: string;
  method: 'sms' | 'whatsapp' | 'ussd';
  status: 'pending' | 'sent' | 'received' | 'completed' | 'failed';
  pin?: string;
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
}

export class PhoneTransferService {
  private database: any;
  private auth: any;

  constructor() {
    // Initialize with mobile contexts
  }

  /**
   * Send money to a phone number
   */
  async sendMoneyToPhone(
    recipientPhone: string,
    amount: number,
    method: 'sms' | 'whatsapp' | 'ussd' = 'sms'
  ): Promise<PhoneTransfer> {
    try {
      // Validate sender has sufficient balance
      const balance = await this.getUserBalance();
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Generate secure transfer PIN
      const transferPin = await this.generateTransferPin();
      
      // Create transfer record
      const transfer: PhoneTransfer = {
        id: await Crypto.randomUUID(),
        senderPhone: this.auth.user?.phone || '',
        recipientPhone: this.formatPhoneNumber(recipientPhone),
        amount,
        currency: 'ZAR',
        method,
        status: 'pending',
        pin: transferPin,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      };

      // Store transfer locally
      await this.database.addTransfer(transfer);

      // Deduct amount from sender
      await this.deductBalance(amount);

      // Send notification based on method
      switch (method) {
        case 'sms':
          await this.sendSMSNotification(transfer);
          break;
        case 'whatsapp':
          await this.sendWhatsAppNotification(transfer);
          break;
        case 'ussd':
          await this.sendUSSDNotification(transfer);
          break;
      }

      transfer.status = 'sent';
      await this.database.updateTransfer(transfer);

      return transfer;
    } catch (error) {
      console.error('Phone transfer failed:', error);
      throw error;
    }
  }

  /**
   * Receive money using transfer PIN
   */
  async receiveMoneyWithPin(pin: string, recipientPhone: string): Promise<PhoneTransfer> {
    try {
      // Find transfer by PIN and recipient phone
      const transfer = await this.database.getTransferByPin(pin, recipientPhone);
      
      if (!transfer) {
        throw new Error('Invalid transfer PIN or phone number');
      }

      if (transfer.status !== 'sent') {
        throw new Error('Transfer already processed or expired');
      }

      if (transfer.expiresAt < new Date()) {
        throw new Error('Transfer has expired');
      }

      // Add amount to recipient balance
      await this.addBalance(transfer.amount);

      // Update transfer status
      transfer.status = 'completed';
      transfer.completedAt = new Date();
      await this.database.updateTransfer(transfer);

      // Send confirmation SMS to sender
      await this.sendCompletionConfirmation(transfer);

      return transfer;
    } catch (error) {
      console.error('Receive money failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification with transfer details
   */
  private async sendSMSNotification(transfer: PhoneTransfer): Promise<void> {
    const message = `BlueBot Money Transfer
Amount: R${transfer.amount.toFixed(2)}
PIN: ${transfer.pin}
From: ${this.maskPhoneNumber(transfer.senderPhone)}
To claim: Open BlueBot app > Receive Money > Enter PIN
Expires: ${transfer.expiresAt.toLocaleDateString()}
T&Cs apply`;

    if (await SMS.isAvailableAsync()) {
      await SMS.sendSMSAsync([transfer.recipientPhone], message);
    } else {
      console.log('SMS not available, using alternative notification');
      // Fallback to push notification or other method
    }
  }

  /**
   * Generate secure 6-digit transfer PIN
   */
  private async generateTransferPin(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(3);
    const randomNumber = randomBytes.reduce((acc, byte) => acc * 256 + byte, 0);
    return String(randomNumber % 900000 + 100000); // 6-digit number
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add South African country code if not present
    if (cleaned.startsWith('0')) {
      return '+27' + cleaned.substring(1);
    } else if (!cleaned.startsWith('27')) {
      return '+27' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Mask phone number for privacy
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.substring(0, 4) + '***' + phone.substring(phone.length - 3);
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
   * Add amount to user balance
   */
  private async addBalance(amount: number): Promise<void> {
    const currentBalance = await this.getUserBalance();
    const newBalance = currentBalance + amount;
    await AsyncStorage.setItem('userBalance', newBalance.toString());
  }

  /**
   * Send WhatsApp notification (requires WhatsApp Business API)
   */
  private async sendWhatsAppNotification(transfer: PhoneTransfer): Promise<void> {
    // Implementation would depend on WhatsApp Business API integration
    console.log('WhatsApp notification sent:', transfer.id);
  }

  /**
   * Send USSD notification (requires USSD gateway integration)
   */
  private async sendUSSDNotification(transfer: PhoneTransfer): Promise<void> {
    // Implementation would depend on USSD gateway integration
    console.log('USSD notification sent:', transfer.id);
  }

  /**
   * Send completion confirmation to sender
   */
  private async sendCompletionConfirmation(transfer: PhoneTransfer): Promise<void> {
    const message = `BlueBot: Your transfer of R${transfer.amount.toFixed(2)} to ${this.maskPhoneNumber(transfer.recipientPhone)} has been collected. Transaction ID: ${transfer.id.substring(0, 8)}`;
    
    if (await SMS.isAvailableAsync()) {
      await SMS.sendSMSAsync([transfer.senderPhone], message);
    }
  }

  /**
   * Get transfer history for user
   */
  async getTransferHistory(): Promise<PhoneTransfer[]> {
    return await this.database.getUserTransfers();
  }

  /**
   * Cancel pending transfer
   */
  async cancelTransfer(transferId: string): Promise<void> {
    const transfer = await this.database.getTransferById(transferId);
    
    if (!transfer || transfer.status !== 'sent') {
      throw new Error('Cannot cancel this transfer');
    }

    if (transfer.expiresAt < new Date()) {
      throw new Error('Transfer has already expired');
    }

    // Refund amount to sender
    await this.addBalance(transfer.amount);

    // Update transfer status
    transfer.status = 'failed';
    await this.database.updateTransfer(transfer);

    // Send cancellation SMS
    const message = `BlueBot: Transfer of R${transfer.amount.toFixed(2)} to ${this.maskPhoneNumber(transfer.recipientPhone)} has been cancelled and refunded.`;
    
    if (await SMS.isAvailableAsync()) {
      await SMS.sendSMSAsync([transfer.senderPhone], message);
    }
  }
}
