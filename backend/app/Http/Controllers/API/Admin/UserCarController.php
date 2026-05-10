<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserCarResource;
use App\Models\UserCar;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserCarController extends Controller
{
    use ApiResponse;

    /**
     * List all cars (admin).
     * Supports filtering by plate_number, category, fuel_type, and user.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserCar::with('user:id,first_name,last_name,email');

        // Search by plate number
        if ($search = $request->search) {
            $query->where('plate_number', 'like', "%{$search}%");
        }

        // Filter by category
        if ($category = $request->category) {
            $query->where('category', $category);
        }

        // Filter by fuel type
        if ($fuelType = $request->fuel_type) {
            $query->where('fuel_type', $fuelType);
        }

        // Filter by user
        if ($userId = $request->user_id) {
            $query->where('user_id', (int) $userId);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortDir = $request->sort_direction ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        $cars = $query->paginate((int) ($request->per_page ?? 15));

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
     * Show a single car with user info.
     */
    public function show(int $id): JsonResponse
    {
        $car = UserCar::with('user:id,first_name,last_name,email,phone')->find($id);

        if (!$car) {
            return $this->notFound('Vehicle not found.');
        }

        return $this->success(new UserCarResource($car));
    }

    /**
     * Admin-delete a car.
     */
    public function destroy(int $id): JsonResponse
    {
        $car = UserCar::find($id);

        if (!$car) {
            return $this->notFound('Vehicle not found.');
        }

        $car->delete();

        return $this->success(null, 'Vehicle deleted successfully.');
    }

    /**
     * Flag a suspicious vehicle (soft-flag via a flag column or logs).
     * For simplicity, we just log it — can be extended with a flagged column.
     */
    public function flag(int $id): JsonResponse
    {
        $car = UserCar::find($id);

        if (!$car) {
            return $this->notFound('Vehicle not found.');
        }

        // Log the flagging action
        logger()->warning('Vehicle flagged as suspicious', [
            'car_id' => $car->id,
            'plate_number' => $car->plate_number,
            'user_id' => $car->user_id,
            'flagged_by' => auth()->id(),
        ]);

        return $this->success(null, 'Vehicle flagged for review.');
    }
}
