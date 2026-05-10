<?php

namespace App\Observers;

use App\Models\Booking;
use App\Enums\BookingStatus;

class BookingObserver
{
    /**
     * DO NOT update availability on created/updated/deleted events.
     *
     * Availability is managed atomically in BookingService with:
     * 1. lockForUpdate() — pessimistic row lock
     * 2. where('available_slots', '>', 0)->decrement() — guarded decrement
     * 3. Observer-based updates cause race conditions within a single request
     *    (observer fires before/after decrement, creating double-subtraction bugs)
     *
     * See: BookingService::create() and BookingService::cancel()
     */
    public function creating(Booking $booking): void
    {
        if (empty($booking->booking_status)) {
            $booking->booking_status = BookingStatus::Pending;
        }
    }
}
