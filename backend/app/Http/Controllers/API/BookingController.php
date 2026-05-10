<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\DTOs\BookingDTO;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\CancelBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Repositories\BookingRepository;
use App\Services\Booking\BookingLifecycleService;
use App\Services\Booking\BookingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private BookingService $bookingService,
        private BookingLifecycleService $bookingLifecycleService,
        private BookingRepository $bookingRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['status', 'parking_id', 'parking_offer_id', 'from_date', 'to_date', 'sort_by', 'sort_direction']);

        if ($user->isRegularUser()) {
            $filters['user_id'] = $user->id;
        }
        if ($user->isOwner()) {
            $filters['owner_id'] = $user->id;
        }

        $bookings = $this->bookingRepository->getAll(
            $filters,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'bookings' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function show(Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $loads = ['user', 'parking', 'parking.owner', 'offers'];
        if ($booking->parking_offer_id) {
            $loads[] = 'parkingOffer.owner';
            $loads[] = 'parkingOffer.images';
        }

        $booking->load($loads);

        return $this->success(new BookingResource($booking));
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $dto = BookingDTO::fromRequest($request->validated(), $request->user()->id);
        $booking = $this->bookingService->create($dto, $request->user());

        return $this->created(new BookingResource($booking), 'Booking created successfully.');
    }

    public function cancel(CancelBookingRequest $request, Booking $booking): JsonResponse
    {
        $this->authorize('cancel', $booking);
        $booking = $this->bookingService->cancel(
            $booking,
            $request->user(),
            $request->validated()['reason'] ?? null
        );

        return $this->success(new BookingResource($booking), 'Booking cancelled successfully.');
    }

    public function approve(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('approve', $booking);
        $booking = $this->bookingService->approve($booking, $request->user());

        return $this->success(new BookingResource($booking), 'Booking approved successfully.');
    }

    /**
     * Owner rejects a pending offer-based booking.
     */
    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('approve', $booking);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $booking = $this->bookingLifecycleService->reject(
            $booking,
            $request->user(),
            $validated['reason'] ?? null,
        );

        return $this->success(new BookingResource($booking), 'Booking rejected.');
    }

    /**
     * Renter starts their trip to the parking.
     */
    public function startTrip(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $booking = $this->bookingLifecycleService->startTrip($booking, $request->user());

        return $this->success(new BookingResource($booking), 'Trip started.');
    }

    /**
     * Confirm arrival (renter or owner).
     */
    public function confirmArrival(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $booking = $this->bookingLifecycleService->confirmArrival($booking, $request->user());

        return $this->success(new BookingResource($booking), 'Arrival confirmed.');
    }

    /**
     * Complete a booking lifecycle (offer-based only).
     */
    public function completeLifecycle(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $booking = $this->bookingService->complete($booking);

        return $this->success(new BookingResource($booking), 'Booking completed.');
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = $this->bookingRepository->getByUser(
            $request->user()->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'bookings' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function activeBooking(Request $request): JsonResponse
    {
        $bookings = $this->bookingRepository->getActiveByUser($request->user()->id);

        return $this->success([
            'bookings' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $bookings = $this->bookingRepository->getHistoryByUser($request->user()->id);

        return $this->success([
            'bookings' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * Get bookings awaiting owner approval (for offer owners).
     */
    public function pendingApproval(Request $request): JsonResponse
    {
        $bookings = $this->bookingRepository->getAll(
            ['owner_id' => $request->user()->id, 'status' => 'pending_owner_approval'],
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'bookings' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }
}
