<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\DTOs\ParkingSearchDTO;
use App\Http\Requests\Parking\StoreParkingRequest;
use App\Http\Requests\Parking\UpdateParkingRequest;
use App\Http\Resources\ParkingResource;
use App\Models\Parking;
use App\Services\Parking\ParkingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParkingController extends Controller
{
    use ApiResponse;

    public function __construct(private ParkingService $parkingService) {}

    public function index(Request $request): JsonResponse
    {
        $dto = ParkingSearchDTO::fromRequest($request->all());
        $parkings = $this->parkingService->getAll($dto);

        return $this->success([
            'parkings' => ParkingResource::collection($parkings),
            'meta' => [
                'current_page' => $parkings->currentPage(),
                'last_page' => $parkings->lastPage(),
                'per_page' => $parkings->perPage(),
                'total' => $parkings->total(),
            ],
        ]);
    }

    public function show(Parking $parking): JsonResponse
    {
        $parking->load(['owner', 'activePricingRule', 'pricingRules']);
        return $this->success(new ParkingResource($parking));
    }

    public function store(StoreParkingRequest $request): JsonResponse
    {
        $parking = $this->parkingService->create(
            $request->validated(),
            $request->user()->id
        );

        return $this->created(new ParkingResource($parking), 'Parking created successfully.');
    }

    public function update(UpdateParkingRequest $request, Parking $parking): JsonResponse
    {
        $parking = $this->parkingService->update($parking, $request->validated());
        return $this->success(new ParkingResource($parking), 'Parking updated successfully.');
    }

    public function destroy(Parking $parking): JsonResponse
    {
        $this->authorize('delete', $parking);
        $this->parkingService->delete($parking);
        return $this->noContent('Parking deleted successfully.');
    }

    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'sometimes|numeric|min:0.1|max:100',
        ]);

        $parkings = $this->parkingService->getNearby(
            (float) $request->latitude,
            (float) $request->longitude,
            (float) ($request->radius ?? 5)
        );

        return $this->success([
            'parkings' => ParkingResource::collection($parkings),
            'meta' => [
                'current_page' => $parkings->currentPage(),
                'last_page' => $parkings->lastPage(),
                'total' => $parkings->total(),
            ],
        ]);
    }

    public function myParkings(Request $request): JsonResponse
    {
        $parkings = $this->parkingService->getByOwner(
            $request->user()->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'parkings' => ParkingResource::collection($parkings),
            'meta' => [
                'current_page' => $parkings->currentPage(),
                'last_page' => $parkings->lastPage(),
                'total' => $parkings->total(),
            ],
        ]);
    }

    public function toggleStatus(Request $request, Parking $parking): JsonResponse
    {
        $this->authorize('manageAvailability', $parking);
        $request->validate(['status' => 'required|string|in:active,inactive,maintenance,closed']);

        $parking = $this->parkingService->toggleStatus($parking, $request->status);
        return $this->success(new ParkingResource($parking), 'Status updated successfully.');
    }
}
