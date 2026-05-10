<?php

namespace App\Policies;

use App\Models\Parking;
use App\Models\User;

class ParkingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Parking $parking): bool
    {
        return true; // Public listings are viewable by all
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isAdmin();
    }

    public function update(User $user, Parking $parking): bool
    {
        return $user->isAdmin() || $user->id === $parking->owner_id;
    }

    public function delete(User $user, Parking $parking): bool
    {
        return $user->isAdmin() || $user->id === $parking->owner_id;
    }

    public function manageAvailability(User $user, Parking $parking): bool
    {
        return $user->isAdmin() || $user->id === $parking->owner_id;
    }
}
