<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Booking $booking): bool
    {
        return $user->isAdmin() ||
               $user->id === $booking->user_id ||
               $user->id === $booking->parking->owner_id;
    }

    public function create(User $user): bool
    {
        return $user->isRegularUser() || $user->isAdmin();
    }

    public function update(User $user, Booking $booking): bool
    {
        return $user->isAdmin() || $user->id === $booking->parking->owner_id;
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $user->id === $booking->user_id ||
               $user->isAdmin() ||
               $user->id === $booking->parking->owner_id;
    }

    public function approve(User $user, Booking $booking): bool
    {
        return $user->isAdmin() || $user->id === $booking->parking->owner_id;
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $user->isAdmin();
    }
}
