<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserCar\StoreUserCarRequest;
use App\Http\Requests\UserCar\UpdateUserCarRequest;
use App\Http\Resources\UserCarResource;
use App\Models\UserCar;
use App\Services\UserCar\UserCarService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserCarController extends Controller
{
    use ApiResponse;

    public function __construct(
        private UserCarService $userCarService,
    ) {}

    /**
     * List the authenticated user's cars.
     *
     * @group User Cars
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['category', 'fuel_type', 'search', 'sort_by', 'sort_direction']);

        $cars = $this->userCarService->getAll(
            $user,
            $filters,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'cars' => UserCarResource::collection($cars),
            'meta' => [
                'current_page' => $cars->currentPage(),
                'last_page' => $cars->lastPage(),
                'per_page' => $cars->perPage(),
                'total' => $cars->total(),
            ],
        ]);
    }

    /**
     * Get a single car.
     *
     * @group User Cars
     */
    public function show(Request $request, UserCar $userCar): JsonResponse
    {
        $this->authorize('view', $userCar);

        return $this->success(new UserCarResource($userCar));
    }

    /**
     * Create a new car.
     *
     * @group User Cars
     */
    public function store(StoreUserCarRequest $request): JsonResponse
    {
        $car = $this->userCarService->create($request->user(), $request->validated());

        return $this->created(new UserCarResource($car), 'Vehicle added successfully.');
    }

    /**
     * Update a car.
     *
     * @group User Cars
     */
    public function update(UpdateUserCarRequest $request, UserCar $userCar): JsonResponse
    {
        $this->authorize('update', $userCar);

        $car = $this->userCarService->update($request->user(), $userCar, $request->validated());

        return $this->success(new UserCarResource($car), 'Vehicle updated successfully.');
    }

    /**
     * Delete a car.
     *
     * @group User Cars
     */
    public function destroy(Request $request, UserCar $userCar): JsonResponse
    {
        $this->authorize('delete', $userCar);

        $this->userCarService->delete($request->user(), $userCar);

        return $this->success(null, 'Vehicle deleted successfully.');
    }

    /**
     * Set a car as the default vehicle.
     *
     * @group User Cars
     */
    public function setDefault(Request $request, UserCar $userCar): JsonResponse
    {
        $this->authorize('update', $userCar);

        $car = $this->userCarService->setDefault($request->user(), $userCar);

        return $this->success(new UserCarResource($car), 'Default vehicle updated successfully.');
    }
}
