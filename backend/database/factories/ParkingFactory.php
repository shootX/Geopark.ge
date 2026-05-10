<?php

namespace Database\Factories;

use App\Enums\ParkingStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParkingFactory extends Factory
{
    protected $model = \App\Models\Parking::class;

    public function definition(): array
    {
        return [
            'owner_id' => \App\Models\User::factory()->owner(),
            'title' => fake()->company() . ' Parking',
            'description' => fake()->paragraph(),
            'address' => fake()->address(),
            'latitude' => fake()->latitude(41.6, 41.8),
            'longitude' => fake()->longitude(44.6, 44.9),
            'total_slots' => fake()->numberBetween(10, 200),
            'available_slots' => fn(array $attrs) => $attrs['total_slots'],
            'base_price' => fake()->randomFloat(2, 2, 15),
            'images' => [],
            'status' => ParkingStatus::Active,
            'opening_time' => '08:00',
            'closing_time' => '22:00',
            'amenities' => fake()->randomElements(['CCTV', '24/7 Security', 'EV Charging', 'Covered', 'Wheelchair Access', 'Valet'], rand(1, 4)),
            'is_verified' => fake()->boolean(80),
        ];
    }
}
