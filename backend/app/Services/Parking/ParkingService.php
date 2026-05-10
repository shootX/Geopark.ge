<?php

namespace App\Services\Parking;

use App\DTOs\ParkingSearchDTO;
use App\Enums\ParkingStatus;
use App\Events\ParkingAvailabilityUpdated;
use App\Models\Parking;
use App\Repositories\ParkingRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParkingService
{
    public function __construct(
        private ParkingRepository $parkingRepository,
    ) {}

    public function getAll(ParkingSearchDTO $dto): LengthAwarePaginator
    {
        return $this->parkingRepository->getAll($dto);
    }

    public function findById(int $id): ?Parking
    {
        return $this->parkingRepository->findById($id);
    }

    public function getByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->parkingRepository->findByOwner($ownerId, $perPage);
    }

    public function create(array $data, int $ownerId): Parking
    {
        $data['owner_id'] = $ownerId;
        $data['available_slots'] = $data['total_slots'];
        $data['status'] = $data['status'] ?? ParkingStatus::Active->value;
        $data['images'] = isset($data['images']) ? (is_array($data['images']) ? $data['images'] : [$data['images']]) : [];

        return $this->parkingRepository->create($data);
    }

    public function update(Parking $parking, array $data): Parking
    {
        if (isset($data['total_slots']) && $data['total_slots'] < $parking->total_slots - $parking->available_slots) {
            throw ValidationException::withMessages([
                'total_slots' => ['Total slots cannot be less than currently occupied slots.'],
            ]);
        }

        if (isset($data['images']) && is_string($data['images'])) {
            $data['images'] = [$data['images']];
        }

        return $this->parkingRepository->update($parking, $data);
    }

    public function delete(Parking $parking): bool
    {
        if ($parking->activeBookings()->count() > 0) {
            throw ValidationException::withMessages([
                'parking' => ['Cannot delete parking with active bookings.'],
            ]);
        }

        return DB::transaction(function () use ($parking) {
            $parking->bookings()->whereIn('booking_status', ['pending'])->update(['booking_status' => 'cancelled']);
            return $this->parkingRepository->delete($parking);
        });
    }

    public function getNearby(float $latitude, float $longitude, float $radius = 5): LengthAwarePaginator
    {
        return $this->parkingRepository->getNearby($latitude, $longitude, $radius);
    }

    public function updateAvailability(Parking $parking): void
    {
        $this->parkingRepository->updateAvailability($parking);
        event(new ParkingAvailabilityUpdated($parking));
    }

    public function toggleStatus(Parking $parking, string $status): Parking
    {
        if (!in_array($status, ParkingStatus::values())) {
            throw ValidationException::withMessages([
                'status' => ['Invalid parking status.'],
            ]);
        }

        $parking = $this->parkingRepository->update($parking, ['status' => $status]);
        event(new ParkingAvailabilityUpdated($parking));

        return $parking;
    }
}
