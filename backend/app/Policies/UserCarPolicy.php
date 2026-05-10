<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserCar;

class UserCarPolicy
{
    /**
     * Any authenticated user can view their own cars (listing is user-scoped in service).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * User can view the car if they own it, or if they are admin.
     */
    public function view(User $user, UserCar $userCar): bool
    {
        return $user->id === $userCar->user_id || $user->isAdmin();
    }

    /**
     * Any authenticated user can create a car.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * User can update the car if they own it, or if they are admin.
     */
    public function update(User $user, UserCar $userCar): bool
    {
        return $user->id === $userCar->user_id || $user->isAdmin();
    }

    /**
     * User can delete the car if they own it, or if they are admin.
     */
    public function delete(User $user, UserCar $userCar): bool
    {
        return $user->id === $userCar->user_id || $user->isAdmin();
    }
}
