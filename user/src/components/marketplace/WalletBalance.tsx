'use client';

import type { Wallet } from '@/types';

interface WalletBalanceProps {
  wallet: Wallet | null;
  loading?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  compact?: boolean;
}

export default function WalletBalance({
  wallet,
  loading = false,
  onDeposit,
  onWithdraw,
  compact = false,
}: WalletBalanceProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-gray-400 text-sm">Кошелёк недоступен</div>
    );
  }

  const balance = Number(wallet.balance).toFixed(2);
  const currency = wallet.currency || 'GEL';

  return (
    <div className={`${compact ? '' : 'bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white'}`}>
      {compact ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Баланс</p>
            <p className="text-lg font-bold text-gray-900">
              {balance} {currency}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-blue-100 text-sm font-medium mb-1">Баланс кошелька</p>
          <p className="text-3xl font-bold mb-1">
            {balance} {currency}
          </p>
          <p className="text-blue-200 text-xs">
            {wallet.is_blocked ? 'Кошелёк заблокирован' : 'Доступно для операций'}
          </p>

          <div className="flex gap-3 mt-6">
            {onDeposit && (
              <button
                onClick={onDeposit}
                disabled={wallet.is_blocked}
                className="flex-1 px-4 py-2.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Пополнить
              </button>
            )}
            {onWithdraw && (
              <button
                onClick={onWithdraw}
                disabled={wallet.is_blocked || balance === '0.00'}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl border border-blue-400 hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вывести
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
