<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = \App\Models\Booking::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('now', '+1 month');
        $end = (clone $start)->modify('+' . fake()->numberBetween(1, 8) . ' hours');

        return [
            'user_id' => \App\Models\User::factory(),
            'parking_id' => \App\Models\Parking::factory(),
            'start_time' => $start,
            'end_time' => $end,
            'total_price' => fake()->randomFloat(2, 10, 100),
            'booking_status' => BookingStatus::Pending,
            'vehicle_plate' => fake()->optional()->regexify('[A-Z]{2}-[0-9]{3}-[A-Z]{2}'),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn(array $attrs) => ['booking_status' => BookingStatus::Pending]);
    }

    public function approved(): static
    {
        return $this->state(fn(array $attrs) => ['booking_status' => BookingStatus::Approved]);
    }

    public function completed(): static
    {
        return $this->state(fn(array $attrs) => ['booking_status' => BookingStatus::Completed]);
    }

    public function cancelled(): static
    {
        return $this->state(fn(array $attrs) => [
            'booking_status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => fake()->sentence(),
        ]);
    }
}
