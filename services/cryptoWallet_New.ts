/**
 * Production-Ready Crypto Wallet Service
 * This file exports the production crypto wallet service
 */

import ProductionCryptoWalletService from './cryptoWallet_Production';

// Export the production service as the default
export default ProductionCryptoWalletService;

// Re-export types for backwards compatibility
export interface CryptoWallet {
  id: string;
  userId: string;
  address: string;
  publicKey: string;
  network: 'ethereum' | 'polygon' | 'bsc';
  balances: Record<string, string>;
  transactions: CryptoTransaction[];
  isSecured: boolean;
  createdAt: Date;
  lastSync: Date;
}

export interface CryptoTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  network: string;
  logoUrl?: string;
  price?: number;
}

// Legacy class wrapper for compatibility
export class CryptoWalletService {
  static getInstance() {
    return ProductionCryptoWalletService;
  }
}
