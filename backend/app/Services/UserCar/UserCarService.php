<?php

namespace App\Services\UserCar;

use App\Events\VehicleAdded;
use App\Events\VehicleDeleted;
use App\Models\User;
use App\Models\UserCar;
use App\Notifications\VehicleAddedNotification;
use App\Notifications\VehicleDeletedNotification;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserCarService
{
    /**
     * Get all cars for a user with optional filters.
     */
    public function getAll(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = UserCar::where('user_id', $user->id);

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['fuel_type'])) {
            $query->where('fuel_type', $filters['fuel_type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('brand', 'like', "%{$filters['search']}%")
                  ->orWhere('model', 'like', "%{$filters['search']}%")
                  ->orWhere('plate_number', 'like', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Get a single car by ID (scoped to user).
     */
    public function getById(User $user, int $id): ?UserCar
    {
        return UserCar::where('user_id', $user->id)->find($id);
    }

    /**
     * Create a new car for the user.
     * If it's the user's first car, auto-set as default.
     */
    public function create(User $user, array $data): UserCar
    {
        return DB::transaction(function () use ($user, $data) {
            $data['user_id'] = $user->id;
            $data['plate_number'] = strtoupper($data['plate_number']);

            // If this is the first car, make it default
            $hasExistingCars = UserCar::where('user_id', $user->id)->exists();
            $data['is_default'] = !$hasExistingCars;

            $car = UserCar::create($data);

            // Dispatch event & notification
            event(new VehicleAdded($car));
            $user->notify(new VehicleAddedNotification($car));

            return $car;
        });
    }

    /**
     * Update an existing car.
     */
    public function update(User $user, UserCar $car, array $data): UserCar
    {
        if (isset($data['plate_number'])) {
            $data['plate_number'] = strtoupper($data['plate_number']);
        }

        $car->update($data);

        return $car->fresh();
    }

    /**
     * Delete a car.
     * If the deleted car was default, assign default to the most recent remaining car.
     */
    public function delete(User $user, UserCar $car): void
    {
        DB::transaction(function () use ($user, $car) {
            $wasDefault = $car->is_default;
            $carId = $car->id;
            $plateNumber = $car->plate_number;

            $car->delete();

            // If the deleted car was default, assign a new default
            if ($wasDefault) {
                $newDefault = UserCar::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($newDefault) {
                    $newDefault->setAsDefault();
                }
            }

            // Dispatch event & notification
            event(new VehicleDeleted($carId, $plateNumber, $user->id));
            $user->notify(new VehicleDeletedNotification($carId, $plateNumber, $user->id));
        });
    }

    /**
     * Set a car as the default for the user.
     */
    public function setDefault(User $user, UserCar $car): UserCar
    {
        $car->setAsDefault();
        return $car->fresh();
    }
}
