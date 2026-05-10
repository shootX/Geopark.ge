<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Parking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected User $owner;
    protected Parking $parking;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->owner = User::factory()->owner()->create();
        $this->owner->assignRole('owner');

        $this->user = User::factory()->create();
        $this->user->assignRole('user');

        $this->parking = Parking::factory()->create([
            'owner_id' => $this->owner->id,
            'total_slots' => 10,
            'available_slots' => 8,
            'base_price' => 5.00,
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    #[Test]
    public function user_can_create_booking()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $this->parking->id,
                'start_time' => now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => now()->addDay()->addHours(3)->format('Y-m-d H:i:s'),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id', 'start_time', 'end_time', 'total_price',
                    'booking_status', 'parking', 'user',
                ]
            ]);
    }

    #[Test]
    public function booking_overlap_is_prevented()
    {
        $start = now()->addDay()->format('Y-m-d H:i:s');
        $end = now()->addDay()->addHours(3)->format('Y-m-d H:i:s');

        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $this->parking->id,
                'start_time' => $start,
                'end_time' => $end,
            ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $this->parking->id,
                'start_time' => $start,
                'end_time' => $end,
            ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function user_can_cancel_booking()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'parking_id' => $this->parking->id,
            'booking_status' => BookingStatus::Pending,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/bookings/{$booking->id}/cancel", [
                'reason' => 'Changed my mind',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'booking_status' => BookingStatus::Cancelled->value,
        ]);
    }

    #[Test]
    public function owner_can_approve_booking()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'parking_id' => $this->parking->id,
            'booking_status' => BookingStatus::Pending,
        ]);

        $ownerToken = $this->owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->postJson("/api/v1/bookings/{$booking->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'booking_status' => BookingStatus::Approved->value,
        ]);
    }

    #[Test]
    public function user_can_view_their_bookings()
    {
        Booking::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'parking_id' => $this->parking->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/my-bookings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['bookings']
            ]);
    }

    #[Test]
    public function unauthenticated_user_cannot_create_booking()
    {
        $response = $this->postJson('/api/v1/bookings', [
            'parking_id' => $this->parking->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHours(3),
        ]);

        $response->assertStatus(401);
    }
}
