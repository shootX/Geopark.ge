<?php

namespace App\Repositories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Pagination\LengthAwarePaginator;

class BookingRepository
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Booking::query()->with(['user:id,first_name,last_name,email', 'parking:id,title,address,owner_id']);

        if (!empty($filters['status'])) {
            $query->where('booking_status', $filters['status']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (!empty($filters['parking_id'])) {
            $query->where('parking_id', (int) $filters['parking_id']);
        }

        if (!empty($filters['owner_id'])) {
            $query->whereHas('parking', function ($q) use ($filters) {
                $q->where('owner_id', (int) $filters['owner_id']);
            });
        }

        if (!empty($filters['from_date'])) {
            $query->where('start_time', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->where('end_time', '<=', $filters['to_date']);
        }

        if (!empty($filters['date'])) {
            $query->whereDate('start_time', $filters['date']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Booking
    {
        return Booking::with(['user', 'parking', 'parking.owner'])->find($id);
    }

    public function create(array $data): Booking
    {
        return Booking::create($data);
    }

    public function update(Booking $booking, array $data): Booking
    {
        $booking->update($data);
        return $booking->fresh();
    }

    public function findOverlapping(int $parkingId, $startTime, $endTime, ?int $excludeId = null): ?Booking
    {
        $query = Booking::overlapping($parkingId, $startTime, $endTime);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->first();
    }

    public function getByUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Booking::forUser($userId)
            ->with('parking:id,title,address,base_price')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getByParking(int $parkingId, int $perPage = 15): LengthAwarePaginator
    {
        return Booking::forParking($parkingId)
            ->with('user:id,first_name,last_name,email,phone')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getActiveByUser(int $userId): LengthAwarePaginator
    {
        return Booking::forUser($userId)->active()->orderBy('start_time')->paginate(15);
    }

    public function getUpcomingByUser(int $userId): LengthAwarePaginator
    {
        return Booking::forUser($userId)->upcoming()->orderBy('start_time')->paginate(15);
    }

    public function getHistoryByUser(int $userId): LengthAwarePaginator
    {
        return Booking::forUser($userId)->orderBy('created_at', 'desc')->paginate(15);
    }

    public function cancel(Booking $booking, ?string $reason = null): void
    {
        $booking->cancel($reason);
    }

    public function getDashboardStats(): array
    {
        return [
            'total_bookings' => Booking::count(),
            'active_bookings' => Booking::active()->count(),
            'pending_bookings' => Booking::byStatus(BookingStatus::Pending)->count(),
            'approved_bookings' => Booking::byStatus(BookingStatus::Approved)->count(),
            'completed_bookings' => Booking::byStatus(BookingStatus::Completed)->count(),
            'cancelled_bookings' => Booking::byStatus(BookingStatus::Cancelled)->count(),
            'total_revenue' => Booking::whereIn('booking_status', [
                BookingStatus::Approved, BookingStatus::Active, BookingStatus::Completed
            ])->sum('total_price'),
            'today_bookings' => Booking::whereDate('created_at', today())->count(),
            'today_revenue' => Booking::whereDate('created_at', today())
                ->whereIn('booking_status', [BookingStatus::Approved, BookingStatus::Active, BookingStatus::Completed])
                ->sum('total_price'),
        ];
    }
}
