<?php

namespace App\Policies;

use App\Models\ParkingOffer;
use App\Models\User;

class ParkingOfferPolicy
{
    public function view(User $user, ParkingOffer $parkingOffer): bool
    {
        return $user->id === $parkingOffer->owner_id || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isAdmin();
    }

    public function update(User $user, ParkingOffer $parkingOffer): bool
    {
        return $user->id === $parkingOffer->owner_id || $user->isAdmin();
    }

    public function delete(User $user, ParkingOffer $parkingOffer): bool
    {
        return $user->id === $parkingOffer->owner_id || $user->isAdmin();
    }

    public function block(User $user, ParkingOffer $parkingOffer): bool
    {
        return $user->isAdmin();
    }
}
