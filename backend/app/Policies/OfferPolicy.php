<?php

namespace App\Policies;

use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Offer $offer): bool
    {
        return $user->isAdmin() ||
               $user->id === $offer->sender_id ||
               $user->id === $offer->receiver_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function accept(User $user, Offer $offer): bool
    {
        return $user->id === $offer->receiver_id || $user->isAdmin();
    }

    public function reject(User $user, Offer $offer): bool
    {
        return $user->id === $offer->receiver_id || $user->isAdmin();
    }

    public function delete(User $user, Offer $offer): bool
    {
        return $user->isAdmin() || $user->id === $offer->sender_id;
    }
}
