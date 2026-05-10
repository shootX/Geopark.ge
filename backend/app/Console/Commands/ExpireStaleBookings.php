<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Services\Booking\BookingLifecycleService;
use Illuminate\Console\Command;

class ExpireStaleBookings extends Command
{
    protected $signature = 'bookings:expire-stale';
    protected $description = 'Expire bookings that have been in pending or renter_on_the_way for too long';

    public function __construct(
        private BookingLifecycleService $bookingLifecycleService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $expired = 0;

        // Expire bookings stuck in PendingOwnerApproval for > 24 hours
        $stalePending = Booking::where('booking_status', BookingStatus::PendingOwnerApproval->value)
            ->where('created_at', '<', now()->subHours(24))
            ->get();

        foreach ($stalePending as $booking) {
            $this->bookingLifecycleService->expire($booking);
            $expired++;
        }

        // Expire bookings stuck in RenterOnTheWay for > 2 hours
        // (renter started trip but never arrived)
        $staleEnRoute = Booking::where('booking_status', BookingStatus::RenterOnTheWay->value)
            ->where('started_at', '<', now()->subHours(2))
            ->get();

        foreach ($staleEnRoute as $booking) {
            $this->bookingLifecycleService->expire($booking);
            $expired++;
        }

        $this->info("Expired {$expired} stale booking(s).");

        return Command::SUCCESS;
    }
}
