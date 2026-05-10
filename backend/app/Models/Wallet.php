<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'currency',
        'is_blocked',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'float',
            'is_blocked' => 'boolean',
        ];
    }

    // ─── Relationships ───

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    // ─── Scopes ───

    public function scopeNotBlocked($query)
    {
        return $query->where('is_blocked', false);
    }

    // ─── Atomic operations ───

    /**
     * Atomically credit the wallet balance using pessimistic locking.
     *
     * @throws \RuntimeException
     */
    public function credit(float $amount, array $transactionData = []): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $transactionData) {
            /** @var Wallet $wallet */
            $wallet = self::where('id', $this->id)->lockForUpdate()->first();

            if ($wallet->is_blocked) {
                throw new \RuntimeException('Wallet is blocked.');
            }

            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore + $amount;

            $wallet->update(['balance' => $balanceAfter]);

            return $wallet->transactions()->create(array_merge([
                'type' => $transactionData['type'] ?? 'deposit',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => $transactionData['reference_type'] ?? null,
                'reference_id' => $transactionData['reference_id'] ?? null,
                'status' => 'completed',
                'description' => $transactionData['description'] ?? null,
            ]));
        });
    }

    /**
     * Atomically debit the wallet balance using pessimistic locking.
     *
     * @throws \RuntimeException
     */
    public function debit(float $amount, array $transactionData = []): WalletTransaction
    {
        return DB::transaction(function () use ($amount, $transactionData) {
            /** @var Wallet $wallet */
            $wallet = self::where('id', $this->id)->lockForUpdate()->first();

            if ($wallet->is_blocked) {
                throw new \RuntimeException('Wallet is blocked.');
            }

            if ($wallet->balance < $amount) {
                throw new \RuntimeException('Insufficient balance.');
            }

            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore - $amount;

            $wallet->update(['balance' => $balanceAfter]);

            return $wallet->transactions()->create(array_merge([
                'type' => $transactionData['type'] ?? 'withdrawal',
                'amount' => -$amount, // negative for debits
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => $transactionData['reference_type'] ?? null,
                'reference_id' => $transactionData['reference_id'] ?? null,
                'status' => 'completed',
                'description' => $transactionData['description'] ?? null,
            ]));
        });
    }

    /**
     * Get current balance (fresh from DB).
     */
    public function getFreshBalance(): float
    {
        return (float) self::where('id', $this->id)->value('balance');
    }
}
