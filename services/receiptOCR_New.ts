/**
 * Production-Ready Receipt OCR Service
 * This file exports the production receipt OCR service
 */

import ProductionReceiptOCRService from './receiptOCR_Production';

// Export the production service as the default
export default ProductionReceiptOCRService;

// Re-export types for backwards compatibility
export interface ReceiptData {
  merchantName: string;
  amount: number;
  date: string;
  items: ReceiptItem[];
  category: string;
  confidence: number;
  rawText?: string;
  processingTime?: number;
  ocrProvider?: string;
  imageQualityScore?: number;
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
  confidence?: number;
}

// Legacy class wrapper for compatibility
export class ReceiptOCRService {
  static getInstance() {
    return ProductionReceiptOCRService;
  }
}
