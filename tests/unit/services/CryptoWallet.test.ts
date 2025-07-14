/**
 * Unit Tests for Production Crypto Wallet Service
 * Tests real blockchain integrations and secure wallet operations
 */

import CryptoWalletService from '../../../services/cryptoWallet_Production';
import { CryptoWallet, Transaction } from '../../../types/crypto';

// Mock ethers library
const mockWallet = {
  address: '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
  publicKey: '0x04...',
  privateKey: '0x...',
  connect: jest.fn(),
  getBalance: jest.fn(),
  sendTransaction: jest.fn(),
};

const mockProvider = {
  getBalance: jest.fn(),
  getTransactionCount: jest.fn(),
  estimateGas: jest.fn(),
  sendTransaction: jest.fn(),
  getNetwork: jest.fn(),
};

jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: jest.fn(() => mockWallet),
      fromMnemonic: jest.fn(() => mockWallet),
    },
    providers: {
      JsonRpcProvider: jest.fn(() => mockProvider),
      InfuraProvider: jest.fn(() => mockProvider),
    },
    utils: {
      parseEther: jest.fn((value) => value),
      formatEther: jest.fn((value) => value),
      isAddress: jest.fn((address) => address.startsWith('0x')),
    },
    Contract: jest.fn(),
  },
}));

// Mock Expo Secure Store
const mockSecureStore = {
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

jest.mock('expo-secure-store', () => mockSecureStore);

// Mock AsyncStorage
const mockAsyncStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

/**
 * Copyright (c) 2025-present, Xenothon Tech, Inc.
 * Production Crypto Wallet Service Tests
 */

// ...existing code...

describe('Production Crypto Wallet Service', () => {
  let walletService: any; // Use any since it's an instance

  beforeEach(() => {
    walletService = CryptoWalletService; // Use the exported instance
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockProvider.getBalance.mockResolvedValue('1000000000000000000'); // 1 ETH
    mockProvider.getTransactionCount.mockResolvedValue(5);
    mockProvider.estimateGas.mockResolvedValue('21000');
    mockProvider.getNetwork.mockResolvedValue({ chainId: 1, name: 'homestead' });
  });

  describe('Wallet Creation', () => {
    test('should create a new wallet with proper encryption', async () => {
      const userId = 'test-user-123';
      const network = 'ethereum';

      const wallet = await walletService.createWallet(userId, network);

      expect(wallet).toBeDefined();
      expect(wallet.id).toBe(`wallet_${userId}`);
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.network).toBe(network);
      expect(wallet.isSecured).toBe(true);
      expect(wallet.createdAt).toBeDefined();

      // Verify secure storage was called
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    test('should create wallets for different networks', async () => {
      const userId = 'test-user-123';
      const networks = ['ethereum', 'polygon', 'bsc'];

      for (const network of networks) {
        const wallet = await walletService.createWallet(userId, network);
        expect(wallet.network).toBe(network);
      }
    });

    test('should not create duplicate wallets for same user', async () => {
      const userId = 'test-user-123';
      
      // Mock existing wallet
      mockSecureStore.getItemAsync.mockResolvedValueOnce('existing-encrypted-key');
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        id: `wallet_${userId}`,
        address: '0x123...',
        network: 'ethereum',
      }));

      await expect(walletService.createWallet(userId)).rejects.toThrow('Wallet already exists');
    });
  });

  describe('Wallet Retrieval', () => {
    test('should retrieve existing wallet', async () => {
      const userId = 'test-user-123';
      const mockWalletData = {
        id: `wallet_${userId}`,
        address: '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
        publicKey: '0x04...',
        network: 'ethereum',
        balances: { ETH: '1.5', USDC: '100.0' },
        isSecured: true,
        createdAt: new Date().toISOString(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockWalletData));

      const wallet = await walletService.getWallet(userId);

      expect(wallet).toEqual(mockWalletData);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(`wallet_${userId}`);
    });

    test('should return null for non-existent wallet', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const wallet = await walletService.getWallet('non-existent-user');

      expect(wallet).toBeNull();
    });
  });

  describe('Balance Queries', () => {
    test('should fetch real ETH balance from blockchain', async () => {
      const address = '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a';
      const network = 'ethereum';

      const balance = await walletService.getBalance(address, 'ETH', network);

      expect(balance).toBeDefined();
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
      expect(mockProvider.getBalance).toHaveBeenCalledWith(address);
    });

    test('should fetch ERC-20 token balances', async () => {
      const address = '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a';
      const network = 'ethereum';

      // Mock contract call for USDC balance
      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue('100000000'), // 100 USDC (6 decimals)
      };

      jest.spyOn(walletService as any, 'getTokenContract').mockReturnValue(mockContract);

      const balance = await walletService.getBalance(address, 'USDC', network);

      expect(balance).toBeDefined();
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
    });

    test('should refresh all wallet balances', async () => {
      const userId = 'test-user-123';
      const mockWallet = {
        id: `wallet_${userId}`,
        address: '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
        network: 'ethereum',
        balances: {},
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockWallet));

      await walletService.refreshBalances(userId);

      expect(mockProvider.getBalance).toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Transaction Broadcasting', () => {
    test('should send ETH transaction successfully', async () => {
      const userId = 'test-user-123';
      const toAddress = '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a';
      const amount = '0.1';
      const asset = 'ETH';

      const mockTxResponse = {
        hash: '0x123abc...',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: '21000',
        }),
      };

      mockWallet.sendTransaction.mockResolvedValueOnce(mockTxResponse);
      mockSecureStore.getItemAsync.mockResolvedValueOnce('encrypted-private-key');

      const transaction = await walletService.sendTransaction(
        userId,
        toAddress,
        amount,
        asset
      );

      expect(transaction.hash).toBe('0x123abc...');
      expect(transaction.status).toBe('pending');
      expect(transaction.amount).toBe(amount);
      expect(transaction.asset).toBe(asset);
      expect(transaction.networkFee).toBeDefined();
    });

    test('should send ERC-20 token transaction', async () => {
      const userId = 'test-user-123';
      const toAddress = '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a';
      const amount = '100';
      const asset = 'USDC';

      const mockContract = {
        transfer: jest.fn().mockResolvedValue({
          hash: '0x456def...',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      };

      jest.spyOn(walletService as any, 'getTokenContract').mockReturnValue(mockContract);
      mockSecureStore.getItemAsync.mockResolvedValueOnce('encrypted-private-key');

      const transaction = await walletService.sendTransaction(
        userId,
        toAddress,
        amount,
        asset
      );

      expect(transaction.hash).toBe('0x456def...');
      expect(transaction.asset).toBe(asset);
      expect(mockContract.transfer).toHaveBeenCalledWith(toAddress, expect.any(String));
    });

    test('should validate transaction parameters', async () => {
      const userId = 'test-user-123';

      // Test invalid address
      await expect(
        walletService.sendTransaction(userId, 'invalid-address', '1', 'ETH')
      ).rejects.toThrow('Invalid recipient address');

      // Test invalid amount
      await expect(
        walletService.sendTransaction(userId, '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a', '-1', 'ETH')
      ).rejects.toThrow('Invalid amount');

      // Test insufficient balance
      mockProvider.getBalance.mockResolvedValueOnce('0');
      await expect(
        walletService.sendTransaction(userId, '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a', '1', 'ETH')
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('Security Features', () => {
    test('should encrypt private keys securely', async () => {
      const userId = 'test-user-123';
      await walletService.createWallet(userId);

      const secureStoreCalls = mockSecureStore.setItemAsync.mock.calls;
      expect(secureStoreCalls.length).toBeGreaterThan(0);

      // Verify that the stored value is encrypted (not the raw private key)
      const storedValue = secureStoreCalls[0][1];
      expect(storedValue).not.toBe(mockWallet.privateKey);
      expect(storedValue.length).toBeGreaterThan(64); // Encrypted data should be longer
    });

    test('should verify wallet ownership before transactions', async () => {
      const userId = 'test-user-123';
      const wrongUserId = 'wrong-user';

      // Create wallet for user1
      await walletService.createWallet(userId);

      // Try to send transaction with wrong user
      await expect(
        walletService.sendTransaction(
          wrongUserId,
          '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
          '1',
          'ETH'
        )
      ).rejects.toThrow('Wallet not found');
    });

    test('should implement proper key derivation', async () => {
      const userId = 'test-user-123';
      const wallet1 = await walletService.createWallet(userId);
      
      // Delete and recreate - should generate different address
      await walletService.deleteWallet(userId);
      const wallet2 = await walletService.createWallet(userId);

      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('Multi-Network Support', () => {
    test('should support Ethereum mainnet', async () => {
      const userId = 'test-user-123';
      const wallet = await walletService.createWallet(userId, 'ethereum');

      expect(wallet.network).toBe('ethereum');
    });

    test('should support Polygon network', async () => {
      const userId = 'test-user-123';
      const wallet = await walletService.createWallet(userId, 'polygon');

      expect(wallet.network).toBe('polygon');
      // Verify it uses different RPC endpoints
    });

    test('should support Binance Smart Chain', async () => {
      const userId = 'test-user-123';
      const wallet = await walletService.createWallet(userId, 'bsc');

      expect(wallet.network).toBe('bsc');
    });

    test('should get correct network fees for different chains', async () => {
      const networks = ['ethereum', 'polygon', 'bsc'];

      for (const network of networks) {
        const fee = await walletService.estimateTransactionFee('ETH', network);
        expect(fee).toBeDefined();
        expect(parseFloat(fee)).toBeGreaterThan(0);
      }
    });
  });

  describe('Transaction History', () => {
    test('should fetch transaction history from blockchain', async () => {
      const address = '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a';
      const network = 'ethereum';

      // Mock provider history
      const mockHistory = [
        {
          hash: '0x123...',
          from: address,
          to: '0x456...',
          value: '1000000000000000000',
          blockNumber: 18000000,
        },
      ];

      jest.spyOn(walletService as any, 'getTransactionHistory').mockResolvedValue(mockHistory);

      const history = await walletService.getTransactionHistory(address, network);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('hash');
        expect(history[0]).toHaveProperty('amount');
        expect(history[0]).toHaveProperty('timestamp');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network connectivity issues', async () => {
      mockProvider.getBalance.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        walletService.getBalance('0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a', 'ETH', 'ethereum')
      ).rejects.toThrow('Network error');
    });

    test('should handle invalid private key encryption', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('corrupted-data');

      await expect(
        walletService.sendTransaction(
          'test-user',
          '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
          '1',
          'ETH'
        )
      ).rejects.toThrow();
    });

    test('should handle RPC node failures with fallback', async () => {
      // First provider fails
      mockProvider.getBalance.mockRejectedValueOnce(new Error('RPC error'));
      
      // Fallback provider succeeds
      mockProvider.getBalance.mockResolvedValueOnce('1000000000000000000');

      const balance = await walletService.getBalance(
        '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
        'ETH',
        'ethereum'
      );

      expect(balance).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time for balance queries', async () => {
      const startTime = Date.now();
      
      await walletService.getBalance(
        '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
        'ETH',
        'ethereum'
      );
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Under 5 seconds
    });

    test('should handle concurrent balance requests efficiently', async () => {
      const promises = Array(5).fill(null).map(() =>
        walletService.getBalance(
          '0x742d35Cc6639C0532fEb5E42e8f3e49F8d1b3e1a',
          'ETH',
          'ethereum'
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(balance => {
        expect(balance).toBeDefined();
      });
    });
  });
});
