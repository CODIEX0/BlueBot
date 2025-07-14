/**
 * Production-Ready QR Payment Service
 * This file exports the production QR payment service
 */

import ProductionQRPaymentService from './QRPaymentService_Production';

// Export the production service as the default
export default ProductionQRPaymentService;

// Re-export some basic types for backwards compatibility  
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

// Legacy class wrapper for compatibility
export class QRPaymentService {
  static getInstance() {
    return ProductionQRPaymentService;
  }
}
