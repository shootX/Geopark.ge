<?php

namespace App\Services\Payment;

use App\Models\Booking;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

/**
 * Handles the automatic settlement of payments based on booking lifecycle events.
 */
class PaymentSettlementService
{
    public function __construct(
        private PaymentService $paymentService,
    ) {}

    /**
     * Called when booking transitions to "arrived" status.
     * Funds are held in escrow from renter's wallet.
     */
    public function settleOnArrival(Booking $booking): ?Transaction
    {
        // Only settle for offer-based marketplace bookings
        if (!$booking->parking_offer_id) {
            return null;
        }

        return $this->paymentService->holdEscrow($booking);
    }

    /**
     * Called when booking transitions to "completed" status.
     * Funds are released to the owner's wallet.
     */
    public function settleOnCompletion(Booking $booking): ?Transaction
    {
        if (!$booking->parking_offer_id) {
            return null;
        }

        return $this->paymentService->releaseEscrow($booking);
    }

    /**
     * Called when booking is cancelled after payment was held.
     * Funds are refunded to the renter.
     */
    public function settleOnCancellation(Booking $booking): ?Transaction
    {
        if (!$booking->parking_offer_id) {
            return null;
        }

        $transaction = Transaction::where('booking_id', $booking->id)
            ->whereIn('status', ['held', 'released'])
            ->first();

        if (!$transaction) {
            return null;
        }

        return $this->paymentService->refundEscrow($booking);
    }
}
