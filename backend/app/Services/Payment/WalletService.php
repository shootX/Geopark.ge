<?php

namespace App\Services\Payment;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WalletService
{
    /**
     * Get user's wallet, creating one if it doesn't exist.
     */
    public function getOrCreateWallet(User $user): Wallet
    {
        return $user->wallet ?? Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
            'currency' => 'GEL',
        ]);
    }

    /**
     * Get wallet with balance.
     */
    public function getWallet(User $user): Wallet
    {
        $wallet = $this->getOrCreateWallet($user);

        if ($wallet->is_blocked) {
            throw ValidationException::withMessages([
                'wallet' => ['Your wallet has been blocked. Contact support.'],
            ]);
        }

        return $wallet;
    }

    /**
     * Deposit funds into user's wallet.
     */
    public function deposit(User $user, float $amount, ?string $description = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Deposit amount must be positive.'],
            ]);
        }

        $wallet = $this->getWallet($user);

        return $wallet->credit($amount, [
            'type' => 'deposit',
            'description' => $description ?? 'Wallet deposit',
        ]);
    }

    /**
     * Withdraw funds from user's wallet.
     */
    public function withdraw(User $user, float $amount, ?string $description = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => ['Withdrawal amount must be positive.'],
            ]);
        }

        $wallet = $this->getWallet($user);

        try {
            return $wallet->debit($amount, [
                'type' => 'withdrawal',
                'description' => $description ?? 'Wallet withdrawal',
            ]);
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages([
                'balance' => [$e->getMessage()],
            ]);
        }
    }

    /**
     * Get wallet balance.
     */
    public function getBalance(User $user): float
    {
        $wallet = $this->getOrCreateWallet($user);
        return $wallet->getFreshBalance();
    }

    /**
     * Get transaction history for user's wallet.
     */
    public function getTransactions(User $user, int $perPage = 15): LengthAwarePaginator
    {
        $wallet = $this->getOrCreateWallet($user);

        return WalletTransaction::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Freeze/unfreeze a wallet (admin).
     */
    public function setBlocked(int $userId, bool $blocked): Wallet
    {
        $wallet = $this->getOrCreateWallet(User::findOrFail($userId));
        $wallet->update(['is_blocked' => $blocked]);
        return $wallet->fresh();
    }

    /**
     * Get all wallets (admin).
     */
    public function getAllWallets(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Wallet::with('user:id,first_name,last_name,email');

        if (isset($filters['is_blocked'])) {
            $query->where('is_blocked', (bool) $filters['is_blocked']);
        }

        if (!empty($filters['min_balance'])) {
            $query->where('balance', '>=', (float) $filters['min_balance']);
        }

        return $query->orderBy('balance', 'desc')->paginate($perPage);
    }

    /**
     * Get platform revenue stats (admin).
     */
    public function getPlatformRevenue(): array
    {
        return [
            'total_platform_fees' => WalletTransaction::where('type', 'platform_fee')
                ->where('status', 'completed')
                ->sum(DB::raw('ABS(amount)')),
            'total_deposits' => WalletTransaction::where('type', 'deposit')
                ->where('status', 'completed')
                ->sum('amount'),
            'total_withdrawals' => WalletTransaction::where('type', 'withdrawal')
                ->where('status', 'completed')
                ->sum(DB::raw('ABS(amount)')),
            'active_wallets' => Wallet::where('is_blocked', false)->count(),
            'blocked_wallets' => Wallet::where('is_blocked', true)->count(),
        ];
    }
}
