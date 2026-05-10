<?php

namespace Tests\Feature;

use App\Models\Parking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ParkingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $owner;
    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->owner = User::factory()->owner()->create();
        $this->owner->assignRole('owner');

        $this->user = User::factory()->create();
        $this->user->assignRole('user');

        $this->token = $this->owner->createToken('test-token')->plainTextToken;
    }

    #[Test]
    public function owner_can_create_parking()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/parkings', [
                'title' => 'Test Parking',
                'description' => 'A test parking location',
                'address' => '123 Test Street, Tbilisi',
                'latitude' => 41.7151,
                'longitude' => 44.8271,
                'total_slots' => 50,
                'base_price' => 5.00,
                'opening_time' => '08:00',
                'closing_time' => '22:00',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id', 'title', 'address', 'latitude', 'longitude',
                    'total_slots', 'available_slots', 'base_price',
                    'status', 'opening_time', 'closing_time',
                ]
            ]);

        $this->assertDatabaseHas('parkings', ['title' => 'Test Parking']);
    }

    #[Test]
    public function regular_user_cannot_create_parking()
    {
        $userToken = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$userToken}")
            ->postJson('/api/v1/parkings', [
                'title' => 'Test Parking',
                'description' => 'A test parking',
                'address' => '123 Street',
                'latitude' => 41.7151,
                'longitude' => 44.8271,
                'total_slots' => 10,
                'base_price' => 5.00,
                'opening_time' => '08:00',
                'closing_time' => '22:00',
            ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function anyone_can_view_active_parkings()
    {
        Parking::factory()->count(5)->create([
            'owner_id' => $this->owner->id,
        ]);

        $response = $this->getJson('/api/v1/parkings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['parkings']
            ]);
    }

    #[Test]
    public function nearby_parking_search_works()
    {
        Parking::factory()->create([
            'owner_id' => $this->owner->id,
            'latitude' => 41.7151,
            'longitude' => 44.8271,
            'title' => 'Central Parking',
        ]);

        $response = $this->getJson('/api/v1/parkings/nearby?latitude=41.71&longitude=44.82&radius=10');

        $response->assertStatus(200)
            ->assertJsonPath('data.parkings.0.title', 'Central Parking');
    }

    #[Test]
    public function owner_can_update_their_parking()
    {
        $parking = Parking::factory()->create(['owner_id' => $this->owner->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/parkings/{$parking->id}", [
                'title' => 'Updated Parking Title',
                'base_price' => 10.00,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('parkings', [
            'id' => $parking->id,
            'title' => 'Updated Parking Title',
            'base_price' => 10.00,
        ]);
    }

    #[Test]
    public function owner_can_delete_their_parking()
    {
        $parking = Parking::factory()->create(['owner_id' => $this->owner->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/parkings/{$parking->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('parkings', ['id' => $parking->id]);
    }
}
