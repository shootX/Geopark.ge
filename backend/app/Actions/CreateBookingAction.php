<?php

namespace App\Actions;

use App\DTOs\BookingDTO;
use App\Models\Booking;
use App\Models\User;
use App\Services\Booking\BookingService;

class CreateBookingAction
{
    public function __construct(private BookingService $bookingService) {}

    public function execute(BookingDTO $dto, User $user): Booking
    {
        return $this->bookingService->create($dto, $user);
    }
}
