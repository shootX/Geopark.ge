<?php

namespace App\Services\Payment;

use App\Events\PaymentReleased;
use App\Models\Booking;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private WalletService $walletService,
        private PaymentSettlementService $settlementService,
    ) {}

    /**
     * Hold funds in escrow when booking arrives.
     * Deducts from renter's wallet and records the escrow transaction.
     */
    public function holdEscrow(Booking $booking): Transaction
    {
        return DB::transaction(function () use ($booking) {
            $renter = $booking->user;
            $owner = $booking->getOwner();

            if (!$owner) {
                throw ValidationException::withMessages([
                    'booking' => ['Booking owner not found.'],
                ]);
            }

            $totalAmount = (float) $booking->total_price;
            $fees = Transaction::calculateFees($totalAmount);

            // Deduct from renter's wallet
            $this->walletService->getWallet($renter);

            try {
                $renterWallet = $renter->wallet;
                $renterWallet->debit($totalAmount, [
                    'type' => 'booking_payment',
                    'reference_type' => 'booking',
                    'reference_id' => $booking->id,
                    'description' => "Payment for booking #{$booking->id}",
                ]);
            } catch (\RuntimeException $e) {
                throw ValidationException::withMessages([
                    'balance' => ['Insufficient balance to complete this booking. Please deposit funds.'],
                ]);
            }

            // Record platform fee transaction from renter
            $renterWallet = $renter->wallet->fresh();
            $renterWallet->debit($fees['platform_fee'], [
                'type' => 'platform_fee',
                'reference_type' => 'booking',
                'reference_id' => $booking->id,
                'description' => "Platform fee (3%) for booking #{$booking->id}",
            ]);

            // Create escrow transaction record
            $transaction = Transaction::create([
                'booking_id' => $booking->id,
                'renter_id' => $renter->id,
                'owner_id' => $owner->id,
                'total_amount' => $fees['total_amount'],
                'platform_fee' => $fees['platform_fee'],
                'owner_amount' => $fees['owner_amount'],
                'status' => 'held',
                'held_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Release escrow funds to owner when booking is completed.
     */
    public function releaseEscrow(Booking $booking): Transaction
    {
        $transaction = Transaction::where('booking_id', $booking->id)
            ->where('status', 'held')
            ->first();

        if (!$transaction) {
            throw ValidationException::withMessages([
                'booking' => ['No held escrow transaction found for this booking.'],
            ]);
        }

        return DB::transaction(function () use ($transaction, $booking) {
            // Lock the transaction row
            Transaction::where('id', $transaction->id)->lockForUpdate()->first();

            $owner = $transaction->owner;

            // Credit the owner's wallet
            $ownerWallet = $this->walletService->getOrCreateWallet($owner);
            $ownerWallet->credit($transaction->owner_amount, [
                'type' => 'booking_income',
                'reference_type' => 'booking',
                'reference_id' => $booking->id,
                'description' => "Income from booking #{$booking->id} (after 3% platform fee)",
            ]);

            // Mark transaction as released
            $transaction->release();

            // Dispatch event
            event(new PaymentReleased($transaction));

            return $transaction->fresh();
        });
    }

    /**
     * Refund escrow to renter (when booking is cancelled).
     */
    public function refundEscrow(Booking $booking): Transaction
    {
        $transaction = Transaction::where('booking_id', $booking->id)
            ->whereIn('status', ['held', 'released'])
            ->first();

        if (!$transaction) {
            throw ValidationException::withMessages([
                'booking' => ['No active transaction found for this booking.'],
            ]);
        }

        return DB::transaction(function () use ($transaction, $booking) {
            Transaction::where('id', $transaction->id)->lockForUpdate()->first();

            $renter = $transaction->renter;

            // Refund the total amount to renter
            $renterWallet = $this->walletService->getOrCreateWallet($renter);
            $renterWallet->credit($transaction->total_amount, [
                'type' => 'refund',
                'reference_type' => 'booking',
                'reference_id' => $booking->id,
                'description' => "Refund for cancelled booking #{$booking->id}",
            ]);

            // If already released, deduct from owner
            if ($transaction->status->value === 'released') {
                $owner = $transaction->owner;
                try {
                    $ownerWallet = $this->walletService->getOrCreateWallet($owner);
                    $ownerWallet->debit($transaction->owner_amount, [
                        'type' => 'refund',
                        'reference_type' => 'booking',
                        'reference_id' => $booking->id,
                        'description' => "Chargeback for cancelled booking #{$booking->id}",
                    ]);
                } catch (\RuntimeException $e) {
                    throw ValidationException::withMessages([
                        'refund' => ['Owner has insufficient balance for chargeback. Contact admin.'],
                    ]);
                }
            }

            $transaction->refund();

            return $transaction->fresh();
        });
    }

    /**
     * Get transaction for a booking.
     */
    public function getBookingTransaction(Booking $booking): ?Transaction
    {
        return Transaction::where('booking_id', $booking->id)->first();
    }

    /**
     * Admin: get all transactions.
     */
    public function getAllTransactions(array $filters = [], int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = Transaction::with(['booking', 'renter', 'owner']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['renter_id'])) {
            $query->where('renter_id', (int) $filters['renter_id']);
        }

        if (!empty($filters['owner_id'])) {
            $query->where('owner_id', (int) $filters['owner_id']);
        }

        return $query->latest()->paginate($perPage);
    }
}
