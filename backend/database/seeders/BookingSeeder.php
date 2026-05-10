<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Parking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'user@geopark.com')->first();
        $parkings = Parking::all();

        if (!$user || $parkings->isEmpty()) return;

        $bookings = [
            [
                'user_id' => $user->id,
                'parking_id' => $parkings[0]->id,
                'start_time' => Carbon::now()->addDay(),
                'end_time' => Carbon::now()->addDay()->addHours(3),
                'total_price' => 15.00,
                'booking_status' => BookingStatus::Pending,
            ],
            [
                'user_id' => $user->id,
                'parking_id' => $parkings[1]->id,
                'start_time' => Carbon::now()->subDay(),
                'end_time' => Carbon::now()->subDay()->addHours(2),
                'total_price' => 14.00,
                'booking_status' => BookingStatus::Completed,
            ],
            [
                'user_id' => $user->id,
                'parking_id' => $parkings[0]->id,
                'start_time' => Carbon::now()->subDays(3),
                'end_time' => Carbon::now()->subDays(3)->addHours(5),
                'total_price' => 25.00,
                'booking_status' => BookingStatus::Completed,
            ],
            [
                'user_id' => $user->id,
                'parking_id' => $parkings[2]->id,
                'start_time' => Carbon::now()->addWeek(),
                'end_time' => Carbon::now()->addWeek()->addHours(4),
                'total_price' => 12.00,
                'booking_status' => BookingStatus::Approved,
            ],
            [
                'user_id' => $user->id,
                'parking_id' => $parkings[3]->id,
                'start_time' => Carbon::now()->subWeek(),
                'end_time' => Carbon::now()->subWeek()->addHours(2),
                'total_price' => 12.00,
                'booking_status' => BookingStatus::Cancelled,
                'cancelled_at' => Carbon::now()->subWeek()->addDay(),
                'cancellation_reason' => 'Changed plans',
            ],
        ];

        foreach ($bookings as $booking) {
            Booking::firstOrCreate(
                [
                    'user_id' => $booking['user_id'],
                    'parking_id' => $booking['parking_id'],
                    'start_time' => $booking['start_time'],
                ],
                $booking
            );
        }
    }
}
