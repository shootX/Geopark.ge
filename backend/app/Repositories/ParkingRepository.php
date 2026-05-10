<?php

namespace App\Repositories;

use App\DTOs\ParkingSearchDTO;
use App\Enums\ParkingStatus;
use App\Models\Parking;
use Illuminate\Pagination\LengthAwarePaginator;

class ParkingRepository
{
    public function getAll(ParkingSearchDTO $dto): LengthAwarePaginator
    {
        $query = Parking::query()->with(['owner:id,first_name,last_name', 'activePricingRule']);

        if ($dto->latitude && $dto->longitude && $dto->radius) {
            $haversine = "(6371 * acos(cos(radians({$dto->latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians({$dto->longitude})) + sin(radians({$dto->latitude})) * sin(radians(latitude))))";
            $query->select('*')->selectRaw("{$haversine} AS distance")
                  ->having('distance', '<=', $dto->radius)
                  ->orderBy('distance');
        } else {
            $query->orderBy($dto->sortBy ?? 'created_at', $dto->sortDirection ?? 'desc');
        }

        if ($dto->status) {
            $query->where('status', $dto->status);
        } else {
            $query->where('status', ParkingStatus::Active);
        }

        if ($dto->search) {
            $query->search($dto->search);
        }

        $query->priceRange($dto->minPrice, $dto->maxPrice);

        return $query->paginate($dto->perPage);
    }

    public function findById(int $id): ?Parking
    {
        return Parking::with(['owner:id,first_name,last_name,email,phone', 'activePricingRule', 'pricingRules'])->find($id);
    }

    public function findByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return Parking::where('owner_id', $ownerId)
            ->with('activePricingRule')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(array $data): Parking
    {
        return Parking::create($data);
    }

    public function update(Parking $parking, array $data): Parking
    {
        $parking->update($data);
        return $parking->fresh();
    }

    public function delete(Parking $parking): bool
    {
        return $parking->delete();
    }

    public function getNearby(float $latitude, float $longitude, float $radius = 5, int $perPage = 15): LengthAwarePaginator
    {
        return Parking::active()->nearby($latitude, $longitude, $radius)->paginate($perPage);
    }

    public function getAvailable(int $perPage = 15): LengthAwarePaginator
    {
        return Parking::active()->available()->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function updateAvailability(Parking $parking): void
    {
        $parking->updateAvailability();
    }

    public function getDashboardStats(): array
    {
        return [
            'total_parkings' => Parking::count(),
            'active_parkings' => Parking::where('status', ParkingStatus::Active)->count(),
            'inactive_parkings' => Parking::where('status', ParkingStatus::Inactive)->count(),
            'maintenance_parkings' => Parking::where('status', ParkingStatus::Maintenance)->count(),
            'total_slots' => Parking::sum('total_slots'),
            'available_slots' => Parking::sum('available_slots'),
            'verified_parkings' => Parking::where('is_verified', true)->count(),
            'avg_base_price' => Parking::where('status', ParkingStatus::Active)->avg('base_price'),
        ];
    }
}
