<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Rating\RatingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private RatingService $ratingService,
    ) {}

    /**
     * Submit a rating for a completed booking.
     */
    public function store(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $rating = $this->ratingService->submitRating(
            $booking,
            $request->user(),
            (int) $validated['rating'],
            $validated['comment'] ?? null,
        );

        return $this->created($rating, 'Rating submitted successfully.');
    }

    /**
     * Get ratings received by the current user.
     */
    public function received(Request $request): JsonResponse
    {
        $ratings = $this->ratingService->getUserRatings(
            $request->user()->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'ratings' => $ratings->items(),
            'meta' => [
                'current_page' => $ratings->currentPage(),
                'last_page' => $ratings->lastPage(),
                'per_page' => $ratings->perPage(),
                'total' => $ratings->total(),
            ],
        ]);
    }

    /**
     * Get ratings given by the current user.
     */
    public function given(Request $request): JsonResponse
    {
        $ratings = $this->ratingService->getUserGivenRatings(
            $request->user()->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'ratings' => $ratings->items(),
            'meta' => [
                'current_page' => $ratings->currentPage(),
                'last_page' => $ratings->lastPage(),
                'per_page' => $ratings->perPage(),
                'total' => $ratings->total(),
            ],
        ]);
    }

    /**
     * Get ratings for a specific booking.
     */
    public function booking(Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $ratings = $this->ratingService->getBookingRatings($booking->id);

        return $this->success([
            'ratings' => $ratings,
        ]);
    }
}
