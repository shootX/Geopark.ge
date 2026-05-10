<?php

namespace App\Services\Booking;

use App\Enums\BookingStatus;
use App\Events\BookingApproved;
use App\Events\BookingRejected;
use App\Events\BookingRequestReceived;
use App\Events\RenterArrived;
use App\Events\RenterStartedTrip;
use App\Models\Booking;
use App\Models\User;
use App\Services\Payment\PaymentSettlementService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Manages the full booking state machine lifecycle.
 */
class BookingLifecycleService
{
    public function __construct(
        private BookingService $bookingService,
        private PaymentSettlementService $paymentSettlementService,
    ) {}

    /**
     * Owner approves a pending booking.
     */
    public function approve(Booking $booking, User $owner): Booking
    {
        $this->ensureOwner($booking, $owner);
        $this->ensureStatus($booking, BookingStatus::PendingOwnerApproval);

        return DB::transaction(function () use ($booking) {
            $booking->approve();
            event(new BookingApproved($booking));
            return $booking->fresh()->load(['user', 'parking', 'parkingOffer']);
        });
    }

    /**
     * Owner rejects a pending booking.
     */
    public function reject(Booking $booking, User $owner, ?string $reason = null): Booking
    {
        $this->ensureOwner($booking, $owner);
        $this->ensureStatus($booking, BookingStatus::PendingOwnerApproval);

        return DB::transaction(function () use ($booking, $reason) {
            $booking->reject($reason);
            event(new BookingRejected($booking, $reason));
            return $booking->fresh();
        });
    }

    /**
     * Renter starts their trip to the parking.
     */
    public function startTrip(Booking $booking, User $renter): Booking
    {
        $this->ensureRenter($booking, $renter);
        $this->ensureStatus($booking, BookingStatus::Approved);

        return DB::transaction(function () use ($booking) {
            $booking->startTrip();
            event(new RenterStartedTrip($booking));
            return $booking->fresh();
        });
    }

    /**
     * Renter confirms arrival at parking location.
     */
    public function confirmArrival(Booking $booking, User $user): Booking
    {
        // Both renter and owner can confirm arrival
        $owner = $booking->getOwner();
        $isRenter = $user->id === $booking->user_id;
        $isOwner = $owner && $user->id === $owner->id;

        if (!$isRenter && !$isOwner) {
            throw ValidationException::withMessages([
                'user' => ['You are not a participant in this booking.'],
            ]);
        }

        if (!in_array($booking->booking_status, [
            BookingStatus::RenterOnTheWay,
            BookingStatus::OwnerWaiting,
        ])) {
            throw ValidationException::withMessages([
                'booking' => ['Booking is not in a state where arrival can be confirmed.'],
            ]);
        }

        return DB::transaction(function () use ($booking) {
            $booking->markArrived();
            event(new RenterArrived($booking, 'manual'));

            // Automatically settle payment on arrival
            $this->paymentSettlementService->settleOnArrival($booking);

            return $booking->fresh();
        });
    }

    /**
     * Complete the booking after the parking session.
     */
    public function complete(Booking $booking, User $user): Booking
    {
        $this->ensureStatus($booking, BookingStatus::Arrived);

        return DB::transaction(function () use ($booking) {
            $booking->activate(); // briefly go to active
            $booking->complete();

            // Release payment to owner
            $this->paymentSettlementService->settleOnCompletion($booking);

            return $booking->fresh()->load(['user', 'parking', 'parkingOffer', 'transaction']);
        });
    }

    /**
     * Cancel a booking (renter or system).
     */
    public function cancel(Booking $booking, User $user, ?string $reason = null): Booking
    {
        if (!$booking->canBeCancelled()) {
            throw ValidationException::withMessages([
                'booking' => ['This booking cannot be cancelled.'],
            ]);
        }

        return DB::transaction(function () use ($booking, $reason) {
            $booking->cancel($reason);

            // Refund if payment was held
            $this->paymentSettlementService->settleOnCancellation($booking);

            return $booking->fresh();
        });
    }

    /**
     * Mark booking as expired (cron job).
     */
    public function expire(Booking $booking): Booking
    {
        $booking->markExpired();
        return $booking->fresh();
    }

    // ─── Private Helpers ───

    private function ensureOwner(Booking $booking, User $user): void
    {
        $owner = $booking->getOwner();
        if (!$owner || $user->id !== $owner->id) {
            throw ValidationException::withMessages([
                'user' => ['Only the parking owner can perform this action.'],
            ]);
        }
    }

    private function ensureRenter(Booking $booking, User $user): void
    {
        if ($user->id !== $booking->user_id) {
            throw ValidationException::withMessages([
                'user' => ['Only the renter can perform this action.'],
            ]);
        }
    }

    private function ensureStatus(Booking $booking, BookingStatus $expected): void
    {
        if ($booking->booking_status !== $expected) {
            throw ValidationException::withMessages([
                'booking' => [
                    "This action requires the booking to be in '{$expected->value}' status, " .
                    "but it is currently '{$booking->booking_status->value}'."
                ],
            ]);
        }
    }
}
