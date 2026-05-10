<?php

namespace Tests\Feature;

use App\Enums\FuelType;
use App\Enums\VehicleCategory;
use App\Models\User;
use App\Models\UserCar;
use App\Models\Parking;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UserCarTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected User $otherUser;
    protected User $admin;
    protected string $token;
    protected string $otherToken;
    protected string $adminToken;
    protected array $validCarData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->user = User::factory()->create();
        $this->user->assignRole('user');

        $this->otherUser = User::factory()->create();
        $this->otherUser->assignRole('user');

        $this->admin = User::factory()->admin()->create();
        $this->admin->assignRole('super-admin');

        $this->token = $this->user->createToken('test-token')->plainTextToken;
        $this->otherToken = $this->otherUser->createToken('test-token')->plainTextToken;
        $this->adminToken = $this->admin->createToken('test-token')->plainTextToken;

        $this->validCarData = [
            'brand' => 'Toyota',
            'model' => 'Camry',
            'category' => VehicleCategory::Sedan->value,
            'fuel_type' => FuelType::Petrol->value,
            'year' => 2022,
            'plate_number' => 'AB-123-CD',
        ];
    }

    // ─── Auth ───────────────────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_access_vehicle_endpoints(): void
    {
        $response = $this->getJson('/api/v1/user-cars');
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/user-cars', $this->validCarData);
        $response->assertStatus(401);

        $response = $this->getJson('/api/v1/user-cars/1');
        $response->assertStatus(401);

        $response = $this->putJson('/api/v1/user-cars/1', $this->validCarData);
        $response->assertStatus(401);

        $response = $this->deleteJson('/api/v1/user-cars/1');
        $response->assertStatus(401);
    }

    // ─── Validation ─────────────────────────────────────────

    #[Test]
    public function plate_number_format_is_validated(): void
    {
        $invalidPlates = [
            'AB123CD',        // Missing hyphens
            'AB-1234-CD',     // Too many digits
            'AB-12-CD',       // Too few digits
            'A1-123-CD',      // Letters in wrong format
            'AB-123-C',       // Single letter at end
            'abc-123-def',    // Lowercase (should be caught before regex)
            '12-123-AB',      // Digits at start
            'AB-123-',        // Incomplete
            '',               // Empty
        ];

        foreach ($invalidPlates as $plate) {
            $data = array_merge($this->validCarData, ['plate_number' => $plate]);
            $response = $this->withHeader('Authorization', "Bearer {$this->token}")
                ->postJson('/api/v1/user-cars', $data);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors('plate_number');
        }
    }

    #[Test]
    public function valid_plate_format_is_accepted(): void
    {
        $validPlates = [
            'AB-123-CD',
            'XY-999-ZZ',
            'AA-000-BB',
            'RT-456-TY',
        ];

        foreach ($validPlates as $plate) {
            $data = array_merge($this->validCarData, ['plate_number' => $plate]);
            $response = $this->withHeader('Authorization', "Bearer {$this->token}")
                ->postJson('/api/v1/user-cars', $data);

            $response->assertStatus(201);
        }
    }

    #[Test]
    public function plate_number_is_auto_uppercased(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['plate_number' => 'ab-123-cd']
            ));

        $response->assertStatus(201);
        $this->assertEquals('AB-123-CD', $response->json('data.plate_number'));
    }

    #[Test]
    public function plate_number_must_be_unique(): void
    {
        // First user creates a car
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData)
            ->assertStatus(201);

        // Second user tries same plate
        $response = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('plate_number');
    }

    #[Test]
    public function required_fields_are_validated(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'brand', 'model', 'category', 'fuel_type', 'year', 'plate_number',
        ]);
    }

    #[Test]
    public function invalid_category_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['category' => 'spaceship']
            ));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('category');
    }

    #[Test]
    public function invalid_fuel_type_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['fuel_type' => 'nuclear']
            ));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('fuel_type');
    }

    #[Test]
    public function year_must_be_within_valid_range(): void
    {
        // Year too old
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['year' => 1900]
            ));
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('year');

        // Year in the far future
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['year' => now()->year + 10]
            ));
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('year');
    }

    // ─── CRUD ───────────────────────────────────────────────

    #[Test]
    public function user_can_create_a_vehicle(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id', 'user_id', 'brand', 'model', 'category',
                    'category_label', 'fuel_type', 'fuel_type_label',
                    'year', 'plate_number', 'is_default',
                    'created_at', 'updated_at',
                ],
            ]);

        $this->assertEquals('AB-123-CD', $response->json('data.plate_number'));
        $this->assertEquals($this->user->id, $response->json('data.user_id'));
        $this->assertTrue($response->json('data.is_default')); // First car is auto-default
    }

    #[Test]
    public function user_can_list_their_vehicles(): void
    {
        // Create 3 cars for this user
        $plates = ['AB-111-CD', 'AB-222-CD', 'AB-333-CD'];
        foreach ($plates as $plate) {
            $this->withHeader('Authorization', "Bearer {$this->token}")
                ->postJson('/api/v1/user-cars', array_merge(
                    $this->validCarData,
                    ['plate_number' => $plate]
                ));
        }

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/user-cars');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    #[Test]
    public function user_cannot_see_other_users_vehicles(): void
    {
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $response = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->getJson('/api/v1/user-cars');

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
    }

    #[Test]
    public function user_can_view_their_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/user-cars/{$carId}");

        $response->assertStatus(200);
        $this->assertEquals('AB-123-CD', $response->json('data.plate_number'));
    }

    #[Test]
    public function user_cannot_view_others_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->getJson("/api/v1/user-cars/{$carId}");

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_update_their_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/user-cars/{$carId}", [
                'brand' => 'Honda',
                'model' => 'Accord',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Honda', $response->json('data.brand'));
        $this->assertEquals('Accord', $response->json('data.model'));
        // Plate number should remain unchanged
        $this->assertEquals('AB-123-CD', $response->json('data.plate_number'));
    }

    #[Test]
    public function user_cannot_update_others_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->putJson("/api/v1/user-cars/{$carId}", [
                'brand' => 'Honda',
            ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function user_can_delete_their_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/user-cars/{$carId}");

        $response->assertStatus(200);

        // Verify it's gone
        $this->assertDatabaseMissing('user_cars', ['id' => $carId]);
    }

    #[Test]
    public function user_cannot_delete_others_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $response = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->deleteJson("/api/v1/user-cars/{$carId}");

        $response->assertStatus(403);
    }

    // ─── Default Vehicle ────────────────────────────────────

    #[Test]
    public function first_vehicle_is_auto_set_as_default(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $this->assertTrue($response->json('data.is_default'));
    }

    #[Test]
    public function user_can_change_default_vehicle(): void
    {
        // Create first car (auto-default)
        $car1 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);
        $car1Id = $car1->json('data.id');

        // Create second car
        $car2 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['plate_number' => 'XY-456-ZT', 'brand' => 'Honda', 'model' => 'Civic']
            ));
        $car2Id = $car2->json('data.id');

        // First car should no longer be default, second should not be default
        $this->assertFalse($this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/user-cars/{$car1Id}")
            ->json('data.is_default'));

        // Set second car as default
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/user-cars/{$car2Id}/set-default");

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.is_default'));

        // Verify first car is no longer default
        $this->assertFalse($this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/user-cars/{$car1Id}")
            ->json('data.is_default'));
    }

    #[Test]
    public function deleting_default_vehicle_does_not_break(): void
    {
        // Create car (auto-default)
        $car1 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);
        $car1Id = $car1->json('data.id');

        // Create second car
        $car2 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['plate_number' => 'XY-456-ZT', 'brand' => 'Honda', 'model' => 'Civic']
            ));
        $car2Id = $car2->json('data.id');

        // Set car2 as default
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/user-cars/{$car2Id}/set-default");

        // Delete car2 (the default)
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/user-cars/{$car2Id}")
            ->assertStatus(200);

        // car1 should still exist and not be broken
        $this->assertDatabaseHas('user_cars', ['id' => $car1Id]);
    }

    // ─── Auth / Me Integration ──────────────────────────────

    #[Test]
    public function auth_me_endpoint_returns_vehicle_info(): void
    {
        // Initially should show no vehicle
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $this->assertFalse($response->json('data.has_vehicle'));
        $this->assertEquals(0, $response->json('data.cars_count'));

        // Add a vehicle
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        // Now should show vehicle info
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.has_vehicle'));
        $this->assertEquals(1, $response->json('data.cars_count'));
        $this->assertNotNull($response->json('data.default_vehicle'));
        $this->assertEquals('AB-123-CD', $response->json('data.default_vehicle.plate_number'));
    }

    // ─── Booking Integration ────────────────────────────────

    #[Test]
    public function booking_auto_binds_default_vehicle(): void
    {
        // Create parking
        $owner = User::factory()->owner()->create();
        $owner->assignRole('owner');
        $parking = Parking::factory()->create([
            'owner_id' => $owner->id,
            'total_slots' => 10,
            'available_slots' => 8,
            'base_price' => 5.00,
        ]);

        // Add a vehicle to user
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        // Create booking without specifying user_car_id
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $parking->id,
                'start_time' => now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => now()->addDay()->addHours(3)->format('Y-m-d H:i:s'),
            ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('data.user_car_id'));
        $this->assertNotNull($response->json('data.user_car'));
    }

    #[Test]
    public function booking_accepts_explicit_user_car_id(): void
    {
        $owner = User::factory()->owner()->create();
        $owner->assignRole('owner');
        $parking = Parking::factory()->create([
            'owner_id' => $owner->id,
            'total_slots' => 10,
            'available_slots' => 8,
            'base_price' => 5.00,
        ]);

        // Add two vehicles
        $car1 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);
        $car1Id = $car1->json('data.id');

        $car2 = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['plate_number' => 'XY-456-ZT', 'brand' => 'Honda', 'model' => 'Civic']
            ));

        // Create booking with explicit car2
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $parking->id,
                'start_time' => now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => now()->addDay()->addHours(3)->format('Y-m-d H:i:s'),
                'user_car_id' => $car2->json('data.id'),
            ]);

        $response->assertStatus(201);
        $this->assertEquals($car2->json('data.id'), $response->json('data.user_car_id'));
    }

    #[Test]
    public function booking_rejects_foreign_user_car_id(): void
    {
        $owner = User::factory()->owner()->create();
        $owner->assignRole('owner');
        $parking = Parking::factory()->create([
            'owner_id' => $owner->id,
            'total_slots' => 10,
            'available_slots' => 8,
            'base_price' => 5.00,
        ]);

        // Other user's car
        $otherCar = $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        // Try to use other user's car in booking
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/bookings', [
                'parking_id' => $parking->id,
                'start_time' => now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => now()->addDay()->addHours(3)->format('Y-m-d H:i:s'),
                'user_car_id' => $otherCar->json('data.id'),
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('user_car_id');
    }

    // ─── Admin Endpoints ────────────────────────────────────

    #[Test]
    public function admin_can_list_all_vehicles(): void
    {
        // Create cars for multiple users
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $this->withHeader('Authorization', "Bearer {$this->otherToken}")
            ->postJson('/api/v1/user-cars', array_merge(
                $this->validCarData,
                ['plate_number' => 'XY-456-ZT', 'brand' => 'Honda', 'model' => 'Civic']
            ));

        // Admin sees all
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/v1/admin/user-cars');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data.cars'));
    }

    #[Test]
    public function admin_can_delete_any_vehicle(): void
    {
        $createResponse = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/user-cars', $this->validCarData);

        $carId = $createResponse->json('data.id');

        $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->deleteJson("/api/v1/admin/user-cars/{$carId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('user_cars', ['id' => $carId]);
    }

    #[Test]
    public function regular_user_cannot_access_admin_endpoints(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/user-cars');

        $response->assertStatus(403);
    }
}
