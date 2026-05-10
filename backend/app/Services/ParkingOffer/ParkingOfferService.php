<?php

namespace App\Services\ParkingOffer;

use App\Enums\ParkingOfferStatus;
use App\Models\ParkingOffer;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParkingOfferService
{
    /**
     * List parking offers with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ParkingOffer::query()->with(['owner:id,first_name,last_name,avatar,average_rating,total_reviews']);

        // By default, only show active offers to non-owners
        if (!isset($filters['owner_id'])) {
            $query->where('status', ParkingOfferStatus::Active)
                  ->where('is_active', true);
        }

        if (!empty($filters['owner_id'])) {
            $query->where('owner_id', (int) $filters['owner_id']);
        }

        if (!empty($filters['parking_type'])) {
            $query->where('parking_type', $filters['parking_type']);
        }

        if (!empty($filters['vehicle_size'])) {
            $query->whereJsonContains('supported_vehicle_sizes', $filters['vehicle_size']);
        }

        if (!empty($filters['feature'])) {
            $query->whereJsonContains('features', $filters['feature']);
        }

        if (!empty($filters['min_price'])) {
            $query->where('hourly_price', '>=', (float) $filters['min_price']);
        }

        if (!empty($filters['max_price'])) {
            $query->where('hourly_price', '<=', (float) $filters['max_price']);
        }

        // Nearby search
        if (!empty($filters['latitude']) && !empty($filters['longitude'])) {
            $radius = (float) ($filters['radius'] ?? 5);
            $haversine = "(6371 * acos(cos(radians({$filters['latitude']})) * cos(radians(latitude)) * cos(radians(longitude) - radians({$filters['longitude']})) + sin(radians({$filters['latitude']})) * sin(radians(latitude))))";
            $query->select('parking_offers.*')
                  ->selectRaw("{$haversine} AS distance")
                  ->having('distance', '<=', $radius)
                  ->orderBy('distance');
        } else {
            $query->latest();
        }

        return $query->paginate($perPage);
    }

    /**
     * Find offer by ID with relationships.
     */
    public function findById(int $id): ?ParkingOffer
    {
        return ParkingOffer::with([
            'owner',
            'images',
            'availability',
            'parking',
        ])->find($id);
    }

    /**
     * Create a new parking offer.
     */
    public function create(array $data, User $owner): ParkingOffer
    {
        return DB::transaction(function () use ($data, $owner) {
            $offer = ParkingOffer::create([
                'owner_id' => $owner->id,
                'parking_id' => $data['parking_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'parking_type' => $data['parking_type'],
                'address' => $data['address'],
                'latitude' => (float) $data['latitude'],
                'longitude' => (float) $data['longitude'],
                'supported_vehicle_sizes' => $data['supported_vehicle_sizes'] ?? [],
                'features' => $data['features'] ?? [],
                'hourly_price' => (float) $data['hourly_price'],
                'minimum_hours' => (int) ($data['minimum_hours'] ?? 1),
                'available_from' => $data['available_from'] ?? null,
                'available_until' => $data['available_until'] ?? null,
                'is_active' => $data['is_active'] ?? false,
                'status' => ParkingOfferStatus::Draft,
            ]);

            // Create availability records
            if (!empty($data['availability'])) {
                $offer->availability()->createMany($data['availability']);
            }

            return $offer->fresh()->load(['owner', 'images', 'availability']);
        });
    }

    /**
     * Update a parking offer.
     */
    public function update(ParkingOffer $offer, array $data): ParkingOffer
    {
        return DB::transaction(function () use ($offer, $data) {
            $offer->update($data);

            // Update availability if provided
            if (isset($data['availability'])) {
                $offer->availability()->delete();
                $offer->availability()->createMany($data['availability']);
            }

            return $offer->fresh()->load(['owner', 'images', 'availability']);
        });
    }

    /**
     * Delete a parking offer.
     */
    public function delete(ParkingOffer $offer): bool
    {
        if ($offer->status === ParkingOfferStatus::Active) {
            throw ValidationException::withMessages([
                'offer' => ['Cannot delete an active offer. Pause it first.'],
            ]);
        }

        return DB::transaction(function () use ($offer) {
            $offer->images()->delete();
            $offer->availability()->delete();
            return $offer->delete();
        });
    }

    /**
     * Pause an active offer.
     */
    public function pause(ParkingOffer $offer): ParkingOffer
    {
        if ($offer->status !== ParkingOfferStatus::Active) {
            throw ValidationException::withMessages([
                'offer' => ['Only active offers can be paused.'],
            ]);
        }

        $offer->pause();
        return $offer->fresh();
    }

    /**
     * Activate a draft or paused offer.
     */
    public function activate(ParkingOffer $offer): ParkingOffer
    {
        if (!in_array($offer->status, [ParkingOfferStatus::Draft, ParkingOfferStatus::Paused])) {
            throw ValidationException::withMessages([
                'offer' => ['Only draft or paused offers can be activated.'],
            ]);
        }

        $offer->activate();
        return $offer->fresh();
    }

    /**
     * Get offers owned by a specific user.
     */
    public function getByOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator
    {
        return ParkingOffer::where('owner_id', $ownerId)
            ->with(['images', 'owner'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Add images to an offer.
     */
    public function addImages(ParkingOffer $offer, array $imagePaths): ParkingOffer
    {
        $currentCount = $offer->images()->count();
        $maxImages = 10;

        foreach ($imagePaths as $index => $path) {
            if ($currentCount + $index >= $maxImages) {
                break;
            }
            $offer->images()->create([
                'image_path' => $path,
                'sort_order' => $currentCount + $index,
            ]);
        }

        return $offer->fresh()->load('images');
    }

    /**
     * Remove an image from an offer.
     */
    public function removeImage(ParkingOffer $offer, int $imageId): ParkingOffer
    {
        $image = $offer->images()->findOrFail($imageId);
        $image->delete();

        // Re-sort remaining images
        $offer->images()->orderBy('sort_order')->get()->each(function ($img, $index) {
            $img->update(['sort_order' => $index]);
        });

        return $offer->fresh()->load('images');
    }

    /**
     * Block an offer (admin).
     */
    public function block(ParkingOffer $offer): ParkingOffer
    {
        $offer->block();
        return $offer->fresh();
    }
}
