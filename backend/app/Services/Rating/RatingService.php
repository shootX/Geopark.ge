<?php

namespace App\Services\Rating;

use App\Events\RatingSubmitted;
use App\Models\Booking;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class RatingService
{
    /**
     * Submit a rating for a completed booking.
     */
    public function submitRating(Booking $booking, User $fromUser, int $rating, ?string $comment = null): Rating
    {
        // Validate rating value
        if ($rating < 1 || $rating > 5) {
            throw ValidationException::withMessages([
                'rating' => ['Rating must be between 1 and 5.'],
            ]);
        }

        // Only completed bookings can be rated
        if ($booking->booking_status->value !== 'completed') {
            throw ValidationException::withMessages([
                'booking' => ['Only completed bookings can be rated.'],
            ]);
        }

        // Determine who is being rated
        $toUserId = $this->getRatedUserId($booking, $fromUser);

        if (!$toUserId) {
            throw ValidationException::withMessages([
                'booking' => ['You are not a participant in this booking.'],
            ]);
        }

        // Check for existing rating (one per direction)
        $existing = Rating::where('booking_id', $booking->id)
            ->where('from_user_id', $fromUser->id)
            ->where('to_user_id', $toUserId)
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'rating' => ['You have already submitted a rating for this booking.'],
            ]);
        }

        // Create the rating
        $ratingModel = Rating::create([
            'booking_id' => $booking->id,
            'from_user_id' => $fromUser->id,
            'to_user_id' => $toUserId,
            'rating' => $rating,
            'comment' => $comment,
        ]);

        // Recalculate the target user's average rating
        Rating::recalculateUserRating($toUserId);

        // Also recalculate the parking offer average rating
        if ($booking->parkingOffer) {
            $this->recalculateOfferRating($booking->parkingOffer);
        }

        // Dispatch event
        event(new RatingSubmitted($ratingModel));

        return $ratingModel->load(['fromUser', 'toUser']);
    }

    /**
     * Get ratings for a specific user.
     */
    public function getUserRatings(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Rating::forUser($userId)
            ->with(['fromUser:id,first_name,last_name,avatar', 'booking'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get ratings given by a specific user.
     */
    public function getUserGivenRatings(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Rating::byUser($userId)
            ->with(['toUser:id,first_name,last_name,avatar', 'booking'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get ratings for a booking.
     */
    public function getBookingRatings(int $bookingId)
    {
        return Rating::forBooking($bookingId)
            ->with(['fromUser:id,first_name,last_name,avatar', 'toUser:id,first_name,last_name,avatar'])
            ->get();
    }

    /**
     * Determine the user being rated.
     */
    private function getRatedUserId(Booking $booking, User $fromUser): ?int
    {
        // If renter is rating, they rate the owner
        if ($fromUser->id === $booking->user_id) {
            $owner = $booking->getOwner();
            return $owner?->id;
        }

        // If owner is rating, they rate the renter
        $owner = $booking->getOwner();
        if ($owner && $fromUser->id === $owner->id) {
            return $booking->user_id;
        }

        return null;
    }

    /**
     * Recalculate average rating for a parking offer.
     */
    private function recalculateOfferRating($parkingOffer): void
    {
        $stats = Rating::whereHas('booking', function ($q) use ($parkingOffer) {
            $q->where('parking_offer_id', $parkingOffer->id);
        })->where('to_user_id', $parkingOffer->owner_id)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        $parkingOffer->update([
            'average_rating' => round($stats->avg_rating ?? 0, 1),
            'total_reviews' => $stats->total ?? 0,
        ]);
    }
}
