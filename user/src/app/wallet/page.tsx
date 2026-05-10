'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useUIStore } from '@/store/uiStore';
import WalletBalance from '@/components/marketplace/WalletBalance';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WalletTransaction } from '@/types';

export default function WalletPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    wallet,
    walletLoading,
    transactions,
    transactionsLoading,
    fetchWallet,
    fetchTransactions,
    walletDeposit,
    walletWithdraw,
  } = useMarketplaceStore();
  const { addToast } = useUIStore();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchWallet();
    fetchTransactions();
  }, [isAuthenticated, fetchWallet, fetchTransactions, router]);

  const handleDeposit = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      addToast({ type: 'error', title: 'Invalid amount' });
      return;
    }
    setProcessing(true);
    try {
      await walletDeposit(num);
      addToast({ type: 'success', title: 'Deposit successful!' });
      setShowDeposit(false);
      setAmount('');
      fetchTransactions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deposit failed';
      addToast({ type: 'error', title: message });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      addToast({ type: 'error', title: 'Invalid amount' });
      return;
    }
    if (wallet && num > wallet.balance) {
      addToast({ type: 'error', title: 'Insufficient balance' });
      return;
    }
    setProcessing(true);
    try {
      await walletWithdraw(num);
      addToast({ type: 'success', title: 'Withdrawal successful!' });
      setShowWithdraw(false);
      setAmount('');
      fetchTransactions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed';
      addToast({ type: 'error', title: message });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[var(--color-surface-secondary)] pb-24"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border-light)] sticky top-0 z-10">
        <div className="flex items-center px-5 h-14">
          <button
            onClick={() => router.push('/')}
            className="mr-3 -ml-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-base text-[var(--color-text-primary)]">Wallet</h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Balance Card */}
        <WalletBalance
          wallet={wallet}
          loading={walletLoading}
          compact={false}
          onDeposit={() => {
            setShowDeposit(true);
            setShowWithdraw(false);
            setAmount('');
          }}
          onWithdraw={() => {
            setShowWithdraw(true);
            setShowDeposit(false);
            setAmount('');
          }}
        />

        {/* Deposit / Withdraw Forms */}
        {showDeposit && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-5 space-y-3"
          >
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Deposit Funds</h3>
            <input
              type="number"
              step={0.01}
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none focus:border-[var(--color-primary-500)]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeposit(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--color-border-light)] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={processing || !amount}
                className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Deposit'}
              </button>
            </div>
          </motion.div>
        )}

        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-5 space-y-3"
          >
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Withdraw Funds</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Balance: {wallet ? `₾${wallet.balance.toFixed(2)}` : '...'}
            </p>
            <input
              type="number"
              step={0.01}
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm outline-none focus:border-[var(--color-primary-500)]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--color-border-light)] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={processing || !amount}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        <div>
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Transaction History</h2>

          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-[var(--color-text-tertiary)]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn: WalletTransaction) => (
                <div
                  key={txn.id}
                  className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-[var(--color-border-light)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {txn.description || (txn.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {formatDate(txn.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span
                      className={`text-sm font-bold ${
                        txn.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'deposit' ? '+' : '-'}₾{Number(txn.amount).toFixed(2)}
                    </span>
                    {txn.status && (
                      <p className={`text-xs mt-0.5 ${
                        txn.status === 'completed' ? 'text-green-500' :
                        txn.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {txn.status}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
