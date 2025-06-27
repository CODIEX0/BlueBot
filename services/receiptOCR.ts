/**
 * Receipt OCR Service
 * Handles receipt scanning and text extraction using Tesseract.js
 */

import { createWorker } from 'tesseract.js';

export interface ReceiptData {
  merchantName: string;
  amount: number;
  date: string;
  items: ReceiptItem[];
  category: string;
  confidence: number;
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
}

class ReceiptOCRService {
  private worker: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      
      // Configure OCR parameters for receipt scanning
      if (this.worker.setParameters) {
        await this.worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/- :',
        });
      }
      
      this.isInitialized = true;
      console.log('Receipt OCR Service initialized');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    }
  }

  async scanReceipt(imageUri: string): Promise<ReceiptData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      // Extract text from image
      const { data: { text, confidence } } = await this.worker.recognize(imageUri);
      
      console.log('OCR Raw Text:', text);
      console.log('OCR Confidence:', confidence);

      // Parse the extracted text
      const receiptData = this.parseReceiptText(text, confidence);
      
      return receiptData;
    } catch (error) {
      console.error('Receipt scanning failed:', error);
      throw new Error('Failed to scan receipt. Please try again with a clearer image.');
    }
  }

  private parseReceiptText(text: string, confidence: number): ReceiptData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Initialize receipt data
    const receiptData: ReceiptData = {
      merchantName: '',
      amount: 0,
      date: '',
      items: [],
      category: 'General',
      confidence: confidence
    };

    // Extract merchant name (usually first few lines)
    receiptData.merchantName = this.extractMerchantName(lines);
    
    // Extract date
    receiptData.date = this.extractDate(lines);
    
    // Extract total amount
    receiptData.amount = this.extractTotal(lines);
    
    // Extract items
    receiptData.items = this.extractItems(lines);
    
    // Determine category based on merchant or items
    receiptData.category = this.determineCategory(receiptData.merchantName, receiptData.items);

    return receiptData;
  }

  private extractMerchantName(lines: string[]): string {
    // Common South African retailers and patterns
    const commonMerchants = [
      'CHECKERS', 'PICK N PAY', 'SHOPRITE', 'SPAR', 'WOOLWORTHS',
      'CLICKS', 'DISCHEM', 'GAME', 'MAKRO', 'BUILDERS',
      'SHELL', 'BP', 'CALTEX', 'ENGEN', 'SASOL',
      'MCDONALD\'S', 'KFC', 'STEERS', 'NANDO\'S', 'WIMPY'
    ];

    // Look for merchant names in the first 5 lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toUpperCase().trim();
      
      // Check against known merchants
      for (const merchant of commonMerchants) {
        if (line.includes(merchant)) {
          return merchant;
        }
      }
      
      // If line looks like a business name (has letters and is not too long)
      if (line.length > 3 && line.length < 30 && /[A-Z]/.test(line) && !/\d{4}/.test(line)) {
        return line;
      }
    }

    return 'Unknown Merchant';
  }

  private extractDate(lines: string[]): string {
    const today = new Date().toISOString().split('T')[0];
    
    // Look for date patterns
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // DD/MM/YYYY or DD-MM-YYYY
      /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD or YYYY-MM-DD
      /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{2,4})/i  // DD MMM YYYY
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            // Try to parse and format the date
            let dateStr = match[0];
            
            // Convert to standard format if needed
            if (match[1] && match[2] && match[3]) {
              // Determine format and convert
              if (match[3].length === 4) {
                // DD/MM/YYYY format
                dateStr = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
              } else if (match[1].length === 4) {
                // YYYY/MM/DD format
                dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
              }
            }
            
            // Validate the date
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
          } catch (error) {
            console.log('Date parsing error:', error);
          }
        }
      }
    }

    return today; // Default to today if no date found
  }

  private extractTotal(lines: string[]): number {
    // Look for total patterns (usually at the bottom)
    const totalPatterns = [
      /TOTAL.*?R?\s*(\d+[.,]\d{2})/i,
      /AMOUNT.*?R?\s*(\d+[.,]\d{2})/i,
      /R\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*R/,
    ];

    // Search from bottom up
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          const amountStr = match[1].replace(',', '.');
          const amount = parseFloat(amountStr);
          
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }

    return 0;
  }

  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    
    // Look for item patterns (product name followed by price)
    const itemPattern = /^(.+?)\s+R?\s*(\d+[.,]\d{2})$/;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip header lines, totals, and other non-item lines
      if (trimmedLine.length < 3 || 
          /^(TOTAL|SUBTOTAL|TAX|VAT|CHANGE|TENDER)/i.test(trimmedLine) ||
          /^\d{4}-\d{2}-\d{2}/.test(trimmedLine) ||
          trimmedLine.length > 50) {
        continue;
      }

      const match = trimmedLine.match(itemPattern);
      if (match) {
        const name = match[1].trim();
        const priceStr = match[2].replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (name.length > 2 && !isNaN(price) && price > 0) {
          items.push({
            name: this.cleanItemName(name),
            price: price
          });
        }
      }
    }

    return items;
  }

  private cleanItemName(name: string): string {
    // Remove common prefixes/suffixes and clean up item names
    return name
      .replace(/^\d+\s*x?\s*/i, '') // Remove quantity prefix
      .replace(/\s+R?\d+[.,]\d{2}$/, '') // Remove price suffix
      .replace(/[*#@]+/g, '') // Remove special characters
      .trim()
      .toUpperCase();
  }

  private determineCategory(merchantName: string, items: ReceiptItem[]): string {
    const merchant = merchantName.toUpperCase();
    
    // Category mapping based on merchant
    if (['CHECKERS', 'PICK N PAY', 'SHOPRITE', 'SPAR', 'WOOLWORTHS'].some(m => merchant.includes(m))) {
      return 'Groceries';
    }
    
    if (['CLICKS', 'DISCHEM'].some(m => merchant.includes(m))) {
      return 'Health & Pharmacy';
    }
    
    if (['SHELL', 'BP', 'CALTEX', 'ENGEN', 'SASOL'].some(m => merchant.includes(m))) {
      return 'Fuel';
    }
    
    if (['MCDONALD\'S', 'KFC', 'STEERS', 'NANDO\'S', 'WIMPY'].some(m => merchant.includes(m))) {
      return 'Restaurants';
    }

    if (['GAME', 'MAKRO', 'BUILDERS'].some(m => merchant.includes(m))) {
      return 'Retail';
    }

    // Category based on items
    if (items.length > 0) {
      const itemNames = items.map(item => item.name.toUpperCase()).join(' ');
      
      if (/BREAD|MILK|EGGS|MEAT|VEGETABLE|FRUIT/i.test(itemNames)) {
        return 'Groceries';
      }
      
      if (/PETROL|DIESEL|FUEL/i.test(itemNames)) {
        return 'Fuel';
      }
      
      if (/MEDICINE|VITAMIN|TABLET/i.test(itemNames)) {
        return 'Health & Pharmacy';
      }
    }

    return 'General';
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Mock receipt data for development/testing
  getMockReceiptData(): ReceiptData {
    return {
      merchantName: 'CHECKERS',
      amount: 234.50,
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'BREAD WHITE', price: 15.99 },
        { name: 'MILK 2L', price: 24.99 },
        { name: 'EGGS DOZEN', price: 35.99 },
        { name: 'CHICKEN BREAST 1KG', price: 89.99 },
        { name: 'APPLES 1KG', price: 29.99 },
        { name: 'BANANAS 1KG', price: 18.99 },
        { name: 'YOGURT 500ML', price: 18.55 }
      ],
      category: 'Groceries',
      confidence: 85
    };
  }
}

export default new ReceiptOCRService();
