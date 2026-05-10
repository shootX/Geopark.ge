<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ParkingOffer;
use App\Services\ParkingOffer\ParkingOfferService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ParkingOfferController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ParkingOfferService $parkingOfferService,
    ) {}

    /**
     * List parking offers with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'owner_id', 'parking_type', 'vehicle_size', 'feature',
            'min_price', 'max_price', 'latitude', 'longitude', 'radius',
        ]);

        $offers = $this->parkingOfferService->getAll(
            $filters,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'offers' => $offers->items(),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    /**
     * Show a single parking offer.
     */
    public function show(ParkingOffer $parkingOffer): JsonResponse
    {
        $offer = $this->parkingOfferService->findById($parkingOffer->id);

        if (!$offer) {
            return $this->notFound('Parking offer not found.');
        }

        return $this->success($offer);
    }

    /**
     * Create a new parking offer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parking_id' => ['nullable', 'integer', 'exists:parkings,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'parking_type' => ['required', 'string', 'in:private,municipal'],
            'address' => ['required', 'string', 'max:500'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'supported_vehicle_sizes' => ['nullable', 'array'],
            'supported_vehicle_sizes.*' => ['string', 'in:sedan,suv,hatchback,truck,van,motorcycle'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:50'],
            'hourly_price' => ['required', 'numeric', 'min:0'],
            'minimum_hours' => ['nullable', 'integer', 'min:1'],
            'available_from' => ['nullable', 'date_format:H:i'],
            'available_until' => ['nullable', 'date_format:H:i'],
            'is_active' => ['nullable', 'boolean'],
            'availability' => ['nullable', 'array'],
            'availability.*.day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'availability.*.specific_date' => ['nullable', 'date'],
            'availability.*.from_time' => ['required', 'date_format:H:i'],
            'availability.*.until_time' => ['required', 'date_format:H:i'],
            'availability.*.is_available' => ['nullable', 'boolean'],
        ]);

        $offer = $this->parkingOfferService->create($validated, $request->user());

        return $this->created($offer, 'Parking offer created successfully.');
    }

    /**
     * Update a parking offer.
     */
    public function update(Request $request, ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('update', $parkingOffer);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'parking_type' => ['sometimes', 'string', 'in:private,municipal'],
            'address' => ['sometimes', 'string', 'max:500'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'supported_vehicle_sizes' => ['nullable', 'array'],
            'supported_vehicle_sizes.*' => ['string', 'in:sedan,suv,hatchback,truck,van,motorcycle'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:50'],
            'hourly_price' => ['sometimes', 'numeric', 'min:0'],
            'minimum_hours' => ['nullable', 'integer', 'min:1'],
            'available_from' => ['nullable', 'date_format:H:i'],
            'available_until' => ['nullable', 'date_format:H:i'],
            'is_active' => ['nullable', 'boolean'],
            'availability' => ['nullable', 'array'],
            'availability.*.day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'availability.*.specific_date' => ['nullable', 'date'],
            'availability.*.from_time' => ['required', 'date_format:H:i'],
            'availability.*.until_time' => ['required', 'date_format:H:i'],
            'availability.*.is_available' => ['nullable', 'boolean'],
        ]);

        $offer = $this->parkingOfferService->update($parkingOffer, $validated);

        return $this->success($offer, 'Parking offer updated successfully.');
    }

    /**
     * Delete a parking offer.
     */
    public function destroy(ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('delete', $parkingOffer);

        $this->parkingOfferService->delete($parkingOffer);

        return $this->noContent('Parking offer deleted successfully.');
    }

    /**
     * Get offers owned by the current user.
     */
    public function myOffers(Request $request): JsonResponse
    {
        $offers = $this->parkingOfferService->getByOwner(
            $request->user()->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'offers' => $offers->items(),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    /**
     * Activate a draft or paused offer.
     */
    public function activate(ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('update', $parkingOffer);

        $offer = $this->parkingOfferService->activate($parkingOffer);

        return $this->success($offer, 'Parking offer activated successfully.');
    }

    /**
     * Pause an active offer.
     */
    public function pause(ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('update', $parkingOffer);

        $offer = $this->parkingOfferService->pause($parkingOffer);

        return $this->success($offer, 'Parking offer paused successfully.');
    }

    /**
     * Block an offer (admin only).
     */
    public function block(ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('block', $parkingOffer);

        $offer = $this->parkingOfferService->block($parkingOffer);

        return $this->success($offer, 'Parking offer blocked successfully.');
    }

    /**
     * Add images to an offer.
     */
    public function addImages(Request $request, ParkingOffer $parkingOffer): JsonResponse
    {
        $this->authorize('update', $parkingOffer);

        $validated = $request->validate([
            'images' => ['required', 'array', 'max:10'],
            'images.*' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        $paths = [];
        foreach ($validated['images'] as $image) {
            $paths[] = $image->store('parking-offers', 'public');
        }

        $offer = $this->parkingOfferService->addImages($parkingOffer, $paths);

        return $this->success($offer, 'Images added successfully.');
    }

    /**
     * Remove an image from an offer.
     */
    public function removeImage(ParkingOffer $parkingOffer, int $imageId): JsonResponse
    {
        $this->authorize('update', $parkingOffer);

        $offer = $this->parkingOfferService->removeImage($parkingOffer, $imageId);

        return $this->success($offer, 'Image removed successfully.');
    }
}
