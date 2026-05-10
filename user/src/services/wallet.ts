import apiClient from './api';
import type {
  ApiResponse,
  Wallet,
  WalletTransaction,
  PaginationMeta,
} from '@/types';

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const { data } = await apiClient.get<ApiResponse<Wallet>>('/wallet');
    return data.data!;
  },

  async getBalance(): Promise<{ balance: number; currency: string }> {
    const { data } = await apiClient.get<ApiResponse<{ balance: number; currency: string }>>(
      '/wallet/balance'
    );
    return data.data!;
  },

  async deposit(amount: number, description?: string): Promise<WalletTransaction> {
    const { data } = await apiClient.post<ApiResponse<WalletTransaction>>('/wallet/deposit', {
      amount,
      description,
    });
    return data.data!;
  },

  async withdraw(amount: number, description?: string): Promise<WalletTransaction> {
    const { data } = await apiClient.post<ApiResponse<WalletTransaction>>('/wallet/withdraw', {
      amount,
      description,
    });
    return data.data!;
  },

  async getTransactions(): Promise<{
    transactions: WalletTransaction[];
    meta?: PaginationMeta;
  }> {
    const { data } = await apiClient.get<ApiResponse<unknown>>('/wallet/transactions');
    const transactions = (data.data as { transactions?: WalletTransaction[] })?.transactions ?? [];
    return {
      transactions: transactions as WalletTransaction[],
      meta: (data.data as { meta?: PaginationMeta })?.meta,
    };
  },
};
