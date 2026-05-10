<?php

namespace App\Services\Offer;

use App\Enums\OfferStatus;
use App\Events\OfferReceived;
use App\Events\OfferResponded;
use App\Models\Offer;
use App\Models\User;
use App\Notifications\OfferReceivedNotification;
use App\Repositories\OfferRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfferService
{
    public function __construct(
        private OfferRepository $offerRepository,
    ) {}

    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->offerRepository->getAll($filters, $perPage);
    }

    public function findById(int $id): ?Offer
    {
        return $this->offerRepository->findById($id);
    }

    public function send(array $data, User $sender): Offer
    {
        if ($sender->id === (int) $data['receiver_id']) {
            throw ValidationException::withMessages([
                'receiver_id' => ['You cannot send an offer to yourself.'],
            ]);
        }

        if ((float) $data['price_offer'] <= 0) {
            throw ValidationException::withMessages([
                'price_offer' => ['Price offer must be greater than 0.'],
            ]);
        }

        return DB::transaction(function () use ($data, $sender) {
            $offer = $this->offerRepository->create([
                'sender_id' => $sender->id,
                'receiver_id' => (int) $data['receiver_id'],
                'booking_id' => (int) $data['booking_id'],
                'message' => $data['message'],
                'price_offer' => (float) $data['price_offer'],
                'status' => OfferStatus::Pending,
                'expires_at' => now()->addDays(3),
            ]);

            event(new OfferReceived($offer));

            $receiver = User::find($offer->receiver_id);
            if ($receiver) {
                $receiver->notify(new OfferReceivedNotification($offer));
            }

            return $offer->load(['sender', 'receiver', 'booking.parking']);
        });
    }

    public function accept(Offer $offer, User $user): Offer
    {
        if ($offer->status !== OfferStatus::Pending) {
            throw ValidationException::withMessages([
                'offer' => ['This offer is no longer pending.'],
            ]);
        }

        if ($offer->is_expired) {
            $offer->markAsExpired();
            throw ValidationException::withMessages([
                'offer' => ['This offer has expired.'],
            ]);
        }

        return DB::transaction(function () use ($offer) {
            $offer->accept();
            event(new OfferResponded($offer));
            return $offer->fresh()->load(['sender', 'receiver', 'booking.parking']);
        });
    }

    public function reject(Offer $offer, User $user): Offer
    {
        if ($offer->status !== OfferStatus::Pending) {
            throw ValidationException::withMessages([
                'offer' => ['This offer is no longer pending.'],
            ]);
        }

        return DB::transaction(function () use ($offer) {
            $offer->reject();
            event(new OfferResponded($offer));
            return $offer->fresh()->load(['sender', 'receiver', 'booking.parking']);
        });
    }

    public function getForUser(int $userId): LengthAwarePaginator
    {
        return $this->offerRepository->getForUser($userId);
    }

    public function getPending(int $userId): LengthAwarePaginator
    {
        return $this->offerRepository->getPendingByReceiver($userId);
    }
}
