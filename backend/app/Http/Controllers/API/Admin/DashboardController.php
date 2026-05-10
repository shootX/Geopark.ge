<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\ParkingResource;
use App\Http\Resources\PricingRuleResource;
use App\Http\Resources\UserResource;
use App\Repositories\BookingRepository;
use App\Repositories\ParkingRepository;
use App\Repositories\UserRepository;
use App\Services\Pricing\PricingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private UserRepository $userRepository,
        private ParkingRepository $parkingRepository,
        private BookingRepository $bookingRepository,
        private PricingService $pricingService,
    ) {}

    public function index(): JsonResponse
    {
        $userStats = $this->userRepository->getDashboardStats();
        $parkingStats = $this->parkingRepository->getDashboardStats();
        $bookingStats = $this->bookingRepository->getDashboardStats();

        $occupancyRate = $parkingStats['total_slots'] > 0
            ? round((($parkingStats['total_slots'] - $parkingStats['available_slots']) / $parkingStats['total_slots']) * 100, 2)
            : 0;

        return $this->success([
            'users' => $userStats,
            'parkings' => $parkingStats,
            'bookings' => $bookingStats,
            'occupancy_rate' => $occupancyRate,
            'total_revenue' => $bookingStats['total_revenue'],
            'today_revenue' => $bookingStats['today_revenue'],
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $users = $this->userRepository->getAll(
            $request->only(['role', 'search', 'is_active', 'sort_by', 'sort_direction']),
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'users' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function showUser(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return $this->notFound('User not found.');
        }
        return $this->success(new UserResource($user->load(['parkings', 'bookings'])));
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return $this->notFound('User not found.');
        }

        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'sometimes|string|max:20|unique:users,phone,' . $id,
            'is_active' => 'sometimes|boolean',
            'role' => 'sometimes|string|in:admin,owner,user',
        ]);

        $user = $this->userRepository->update($user, $request->only([
            'first_name', 'last_name', 'email', 'phone', 'is_active', 'role'
        ]));

        return $this->success(new UserResource($user), 'User updated successfully.');
    }

    public function deleteUser(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return $this->notFound('User not found.');
        }
        if ($user->isAdmin()) {
            return $this->error('Cannot delete admin users.', 403);
        }
        $this->userRepository->delete($user);
        return $this->noContent('User deleted successfully.');
    }

    public function parkings(Request $request): JsonResponse
    {
        $dto = new \App\DTOs\ParkingSearchDTO(
            latitude: null,
            longitude: null,
            radius: null,
            status: $request->status,
            search: $request->search,
            minPrice: null,
            maxPrice: null,
            sortBy: $request->sort_by ?? 'created_at',
            sortDirection: $request->sort_direction ?? 'desc',
            perPage: (int) ($request->per_page ?? 15),
        );

        $parkings = $this->parkingRepository->getAll($dto);

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

    public function bookings(Request $request): JsonResponse
    {
        $bookings = $this->bookingRepository->getAll(
            $request->only(['status', 'user_id', 'parking_id', 'from_date', 'to_date', 'sort_by', 'sort_direction']),
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

    public function pricingRules(Request $request): JsonResponse
    {
        $rules = $this->pricingService->getAll(
            $request->only(['parking_id', 'is_active', 'search']),
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'rules' => PricingRuleResource::collection($rules),
            'meta' => [
                'current_page' => $rules->currentPage(),
                'last_page' => $rules->lastPage(),
                'per_page' => $rules->perPage(),
                'total' => $rules->total(),
            ],
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $period = $request->period ?? '7_days';

        $dateFrom = match ($period) {
            '30_days' => now()->subDays(30),
            '90_days' => now()->subDays(90),
            'year' => now()->subYear(),
            default => now()->subDays(7),
        };

        $revenue = \App\Models\Booking::whereIn('booking_status', ['approved', 'active', 'completed'])
            ->where('created_at', '>=', $dateFrom)
            ->sum('total_price');

        $totalBookings = \App\Models\Booking::where('created_at', '>=', $dateFrom)->count();
        $newUsers = \App\Models\User::where('created_at', '>=', $dateFrom)->count();
        $newParkings = \App\Models\Parking::where('created_at', '>=', $dateFrom)->count();

        // Daily revenue for chart
        $dailyRevenue = \App\Models\Booking::whereIn('booking_status', ['approved', 'active', 'completed'])
            ->where('created_at', '>=', $dateFrom)
            ->selectRaw('DATE(created_at) as date, SUM(total_price) as revenue, COUNT(*) as bookings_count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $this->success([
            'period' => $period,
            'date_from' => $dateFrom->toDateString(),
            'date_to' => now()->toDateString(),
            'revenue' => round($revenue, 2),
            'total_bookings' => $totalBookings,
            'new_users' => $newUsers,
            'new_parkings' => $newParkings,
            'daily_revenue' => $dailyRevenue,
        ]);
    }
}
