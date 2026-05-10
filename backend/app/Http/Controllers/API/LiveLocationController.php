<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Location\LiveLocationService;
use App\Services\Booking\BookingLifecycleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiveLocationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LiveLocationService $liveLocationService,
        private BookingLifecycleService $bookingLifecycleService,
    ) {}

    /**
     * Update the current user's location for a booking.
     */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'heading' => ['nullable', 'numeric', 'between:0,360'],
            'speed' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Anti-spoofing: validate location update
        $this->liveLocationService->validateLocationUpdate(
            $booking,
            $request->user(),
            (float) $validated['latitude'],
            (float) $validated['longitude'],
        );

        $location = $this->liveLocationService->updateLocation(
            $booking,
            $request->user(),
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            isset($validated['heading']) ? (float) $validated['heading'] : null,
            isset($validated['speed']) ? (float) $validated['speed'] : null,
        );

        return $this->success($location, 'Location updated.');
    }

    /**
     * Get live locations for a booking.
     */
    public function show(Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $locations = $this->liveLocationService->getBookingLocations($booking);
        $parkingLocation = $this->liveLocationService->getParkingLocation($booking);
        $eta = $this->liveLocationService->calculateEta($booking);

        return $this->success([
            'locations' => $locations,
            'parking_location' => $parkingLocation,
            'eta_minutes' => $eta,
        ]);
    }

    /**
     * Renter confirms arrival manually.
     */
    public function confirmArrival(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $booking = $this->bookingLifecycleService->confirmArrival($booking, $request->user());

        return $this->success($booking, 'Arrival confirmed.');
    }

    /**
     * Owner confirms renter's arrival.
     */
    public function ownerConfirmArrival(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $booking = $this->liveLocationService->ownerConfirmArrival($booking, $request->user());

        return $this->success($booking, 'Arrival confirmed by owner.');
    }

    /**
     * Calculate ETA for renter.
     */
    public function eta(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        $eta = $this->liveLocationService->calculateEta($booking);

        return $this->success([
            'eta_minutes' => $eta,
        ]);
    }
}
