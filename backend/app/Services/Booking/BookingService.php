<?php

namespace App\Services\Booking;

use App\DTOs\BookingDTO;
use App\Enums\BookingStatus;
use App\Events\BookingApproved;
use App\Events\BookingCreated;
use App\Events\BookingRequestReceived;
use App\Events\ParkingAvailabilityUpdated;
use App\Models\Booking;
use App\Models\Parking;
use App\Models\ParkingOffer;
use App\Models\User;
use App\Notifications\BookingApprovedNotification;
use App\Notifications\BookingCreatedNotification;
use App\Repositories\BookingRepository;
use App\Repositories\ParkingRepository;
use App\Repositories\PricingRuleRepository;
use App\Helpers\PricingHelper;
use App\Services\Payment\PaymentSettlementService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private BookingRepository $bookingRepository,
        private ParkingRepository $parkingRepository,
        private PricingRuleRepository $pricingRuleRepository,
        private BookingLifecycleService $bookingLifecycleService,
        private PaymentSettlementService $paymentSettlementService,
    ) {}

    /**
     * Create a booking — supports both legacy (parking_id) and
     * marketplace (parking_offer_id) flows.
     *
     * CRITICAL: Uses lockForUpdate() to prevent race conditions.
     */
    public function create(BookingDTO $dto, User $user): Booking
    {
        // ── 1. Validations that don't need locking (outside transaction) ──
        if ($dto->startTime >= $dto->endTime) {
            throw ValidationException::withMessages(['end_time' => ['End time must be after start time.']]);
        }

        if ($dto->startTime < now()) {
            throw ValidationException::withMessages(['start_time' => ['Start time cannot be in the past.']]);
        }

        // ── 1b. Auto-bind default vehicle if not specified ──
        $userCarId = $dto->userCarId;

        if ($userCarId === null) {
            $defaultCar = $user->defaultCar;
            if ($defaultCar) {
                $userCarId = $defaultCar->id;
            }
        } else {
            $carBelongsToUser = $user->cars()->where('id', $userCarId)->exists();
            if (!$carBelongsToUser) {
                throw ValidationException::withMessages(['user_car_id' => ['The selected vehicle does not belong to you.']]);
            }
        }

        // ── 2. Route to the correct booking path ──
        if ($dto->parkingOfferId) {
            return $this->createOfferBooking($dto, $user, $userCarId);
        }

        return $this->createParkingBooking($dto, $user, $userCarId);
    }

    /**
     * Create a booking against a Parking (legacy flow).
     */
    private function createParkingBooking(BookingDTO $dto, User $user, ?int $userCarId): Booking
    {
        return DB::transaction(function () use ($dto, $user, $userCarId) {
            // 🔒 PESSIMISTIC LOCK: Acquire exclusive row-level lock on parking
            $parking = Parking::where('id', $dto->parkingId)
                ->lockForUpdate()
                ->first();

            if (!$parking) {
                throw ValidationException::withMessages(['parking_id' => ['Parking not found.']]);
            }

            if ($parking->status->value !== 'active') {
                throw ValidationException::withMessages(['parking_id' => ['Parking is not available for booking.']]);
            }

            // 🛡️ Re-check availability AFTER acquiring lock
            if ($parking->available_slots <= 0) {
                throw ValidationException::withMessages(['parking_id' => ['No available slots for this parking.']]);
            }

            // Check overlapping bookings (locked too)
            $overlapping = Booking::where('parking_id', $dto->parkingId)
                ->whereIn('booking_status', ['pending', 'approved', 'active'])
                ->where('start_time', '<', $dto->endTime)
                ->where('end_time', '>', $dto->startTime)
                ->lockForUpdate()
                ->exists();

            if ($overlapping) {
                throw ValidationException::withMessages(['time' => ['This time slot is already booked.']]);
            }

            // Calculate price
            $hours = $dto->startTime->diffInMinutes($dto->endTime) / 60;
            $pricingRule = $this->pricingRuleRepository->getActiveForParking($dto->parkingId);
            $priceData = PricingHelper::calculatePrice($parking, $hours, $pricingRule);

            // Create the booking
            $booking = $this->bookingRepository->create([
                'user_id' => $user->id,
                'parking_id' => $dto->parkingId,
                'start_time' => $dto->startTime,
                'end_time' => $dto->endTime,
                'total_price' => $priceData['price'],
                'booking_status' => 'pending',
                'user_car_id' => $userCarId,
            ]);

            // 🛡️ ATOMIC DECREMENT with guard
            $affected = Parking::where('id', $parking->id)
                ->where('available_slots', '>', 0)
                ->decrement('available_slots');

            if ($affected === 0) {
                throw ValidationException::withMessages(['parking_id' => ['Concurrent booking exhausted the last slot.']]);
            }

            // Log pricing
            $ruleId = $parking->activePricingRule?->id
                ? (int) $parking->activePricingRule->id
                : null;

            $this->pricingRuleRepository->logCalculation([
                'parking_id' => $parking->id,
                'pricing_rule_id' => $ruleId,
                'formula' => $priceData['formula'],
                'variables' => json_encode($priceData),
                'calculated_price' => $priceData['price'],
                'base_price' => $priceData['base_price'],
                'hours' => $priceData['hours'],
                'demand_factor' => $priceData['demand_factor'],
                'weekend_multiplier' => $priceData['weekend_multiplier'],
                'booking_id' => $booking->id,
            ]);

            event(new BookingCreated($booking));
            event(new ParkingAvailabilityUpdated($parking));

            try {
                $user->notify(new BookingCreatedNotification($booking));
            } catch (\Throwable $e) {
                // Notification failure should not rollback the booking
            }

            return $booking->load(['user', 'parking']);
        });
    }

    /**
     * Create a booking against a ParkingOffer (marketplace flow).
     */
    private function createOfferBooking(BookingDTO $dto, User $user, ?int $userCarId): Booking
    {
        return DB::transaction(function () use ($dto, $user, $userCarId) {
            // 🔒 PESSIMISTIC LOCK on the parking offer
            $offer = ParkingOffer::where('id', $dto->parkingOfferId)
                ->lockForUpdate()
                ->first();

            if (!$offer) {
                throw ValidationException::withMessages(['parking_offer_id' => ['Parking offer not found.']]);
            }

            if (!$offer->status->isBookable()) {
                throw ValidationException::withMessages([
                    'parking_offer_id' => ['This parking offer is not available for booking.'],
                ]);
            }

            // Prevent owner from booking their own offer
            if ($offer->owner_id === $user->id) {
                throw ValidationException::withMessages([
                    'parking_offer_id' => ['You cannot book your own parking offer.'],
                ]);
            }

            // Check overlapping bookings for this offer
            $overlapping = Booking::where('parking_offer_id', $dto->parkingOfferId)
                ->whereIn('booking_status', [
                    BookingStatus::PendingOwnerApproval->value,
                    BookingStatus::Approved->value,
                    BookingStatus::RenterOnTheWay->value,
                    BookingStatus::OwnerWaiting->value,
                    BookingStatus::Arrived->value,
                    BookingStatus::Active->value,
                ])
                ->where('start_time', '<', $dto->endTime)
                ->where('end_time', '>', $dto->startTime)
                ->lockForUpdate()
                ->exists();

            if ($overlapping) {
                throw ValidationException::withMessages([
                    'time' => ['This time slot is already booked for this offer.'],
                ]);
            }

            // Calculate price using offer's own pricing
            $hours = max($dto->startTime->diffInMinutes($dto->endTime) / 60, $offer->minimum_hours);
            $totalPrice = $offer->calculatePrice($hours);

            // Create the booking with PendingOwnerApproval status
            $booking = $this->bookingRepository->create([
                'user_id' => $user->id,
                'parking_offer_id' => $dto->parkingOfferId,
                'parking_id' => $offer->parking_id, // link to base parking for compatibility
                'start_time' => $dto->startTime,
                'end_time' => $dto->endTime,
                'total_price' => $totalPrice,
                'booking_status' => BookingStatus::PendingOwnerApproval->value,
                'user_car_id' => $userCarId,
            ]);

            // Mark the offer as booked (prevents further bookings)
            $offer->markAsBooked();

            // Dispatch event to notify the owner
            event(new BookingRequestReceived($booking));

            return $booking->load(['user', 'parking', 'parkingOffer.owner']);
        });
    }

    /**
     * Cancel a booking — supports both parking-based and offer-based flows.
     */
    public function cancel(Booking $booking, User $user, ?string $reason = null): Booking
    {
        if (!$booking->canBeCancelled()) {
            throw ValidationException::withMessages(['booking' => ['This booking cannot be cancelled.']]);
        }

        return DB::transaction(function () use ($booking, $reason) {
            $booking->cancel($reason);

            if ($booking->parking_offer_id) {
                // Offer-based: no slot management; refund held payment if any
                $this->paymentSettlementService->settleOnCancellation($booking);

                // Reset offer status back to active if it was marked as booked
                if ($booking->parkingOffer) {
                    $booking->parkingOffer->activate();
                }
            } else {
                // Legacy: increment available slots
                Parking::where('id', $booking->parking_id)->increment('available_slots');
                event(new ParkingAvailabilityUpdated($booking->parking->fresh()));
            }

            return $booking->fresh()->load(['user', 'parking', 'parkingOffer']);
        });
    }

    /**
     * Approve a booking — delegates to BookingLifecycleService for offer-based.
     */
    public function approve(Booking $booking, User $user): Booking
    {
        if ($booking->parking_offer_id) {
            return $this->bookingLifecycleService->approve($booking, $user);
        }

        // Legacy parking-based approval
        if ($booking->booking_status->value !== 'pending') {
            throw ValidationException::withMessages(['booking' => ['Only pending bookings can be approved.']]);
        }

        return DB::transaction(function () use ($booking) {
            Booking::where('id', $booking->id)->lockForUpdate()->first();
            $booking->approve();
            event(new BookingApproved($booking));

            try {
                $booking->user->notify(new BookingApprovedNotification($booking));
            } catch (\Throwable $e) {
                // Silently handle notification failures
            }

            return $booking->fresh()->load(['user', 'parking']);
        });
    }

    /**
     * Complete a booking — delegates to BookingLifecycleService for offer-based.
     */
    public function complete(Booking $booking): Booking
    {
        if ($booking->parking_offer_id) {
            $owner = $booking->getOwner();
            return $this->bookingLifecycleService->complete($booking, $owner ?? $booking->user);
        }

        // Legacy parking-based completion
        if ($booking->booking_status->value !== 'active') {
            throw ValidationException::withMessages(['booking' => ['Only active bookings can be completed.']]);
        }

        return DB::transaction(function () use ($booking) {
            Booking::where('id', $booking->id)->lockForUpdate()->first();
            $booking->complete();
            event(new ParkingAvailabilityUpdated($booking->parking));
            return $booking->fresh()->load(['user', 'parking']);
        });
    }
}
