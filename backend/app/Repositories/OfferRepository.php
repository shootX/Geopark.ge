<?php

namespace App\Repositories;

use App\Enums\OfferStatus;
use App\Models\Offer;
use Illuminate\Pagination\LengthAwarePaginator;

class OfferRepository
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Offer::query()->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name', 'booking:id,parking_id,start_time,end_time']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['user_id'])) {
            $query->forUser((int) $filters['user_id']);
        }

        if (!empty($filters['booking_id'])) {
            $query->where('booking_id', (int) $filters['booking_id']);
        }

        $query->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_direction'] ?? 'desc');

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Offer
    {
        return Offer::with(['sender', 'receiver', 'booking.parking'])->find($id);
    }

    public function create(array $data): Offer
    {
        return Offer::create($data);
    }

    public function update(Offer $offer, array $data): Offer
    {
        $offer->update($data);
        return $offer->fresh();
    }

    public function getPendingByReceiver(int $userId): LengthAwarePaginator
    {
        return Offer::receivedBy($userId)->pending()->notExpired()
            ->with(['sender:id,first_name,last_name', 'booking.parking:id,title'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }

    public function getForUser(int $userId): LengthAwarePaginator
    {
        return Offer::forUser($userId)
            ->with(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name', 'booking.parking:id,title'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }
}
