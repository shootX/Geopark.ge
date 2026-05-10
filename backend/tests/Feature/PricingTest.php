<?php

namespace Tests\Feature;

use App\Models\Parking;
use App\Models\PricingRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PricingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $admin;
    protected Parking $parking;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->admin = User::where('email', 'admin@geopark.com')->first();
        $this->parking = Parking::factory()->create([
            'base_price' => 10.00,
            'total_slots' => 50,
            'available_slots' => 30,
        ]);

        $this->token = $this->admin->createToken('test-token')->plainTextToken;
    }

    #[Test]
    public function price_calculation_works()
    {
        $response = $this->postJson('/api/v1/pricing/calculate', [
            'parking_id' => $this->parking->id,
            'hours' => 3,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'price', 'base_price', 'hours', 'demand_factor',
                    'weekend_multiplier', 'formula', 'rule_applied',
                ]
            ]);

        $this->assertEquals(30.00, $response->json('data.price'));
    }

    #[Test]
    public function dynamic_pricing_formula_works()
    {
        $response = $this->postJson('/api/v1/pricing/calculate-dynamic', [
            'parking_id' => $this->parking->id,
            'hours' => 3,
            'formula' => '{base_price} * {hours} * {demand_multiplier}',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['price', 'variables', 'formula']
            ]);
    }

    #[Test]
    public function pricing_rule_can_be_created()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/pricing-rules', [
                'name' => 'Weekend Special',
                'formula' => '{base_price} * {hours} * 1.5',
                'description' => '50% extra on weekends',
                'is_active' => true,
                'multiplier' => 1.5,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'name', 'formula']
            ]);
    }

    #[Test]
    public function formula_validation_works()
    {
        $response = $this->postJson('/api/v1/pricing/validate-formula', [
            'formula' => '{base_price} * {hours} * {demand_factor}',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_valid', true);

        $response2 = $this->postJson('/api/v1/pricing/validate-formula', [
            'formula' => '',
        ]);

        $response2->assertStatus(422);
    }

    #[Test]
    public function admin_can_create_pricing_rule()
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/pricing-rules', [
                'name' => 'Dynamic Pricing',
                'formula' => '{base_price} + ({hours} * 2) + ({demand_factor} * 5)',
                'description' => 'Complex dynamic pricing model',
                'is_active' => true,
                'parking_id' => $this->parking->id,
            ]);

        $response->assertStatus(201);
    }

    #[Test]
    public function pricing_logs_are_recorded()
    {
        $this->postJson('/api/v1/pricing/calculate', [
            'parking_id' => $this->parking->id,
            'hours' => 3,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/parkings/{$this->parking->id}/pricing-logs");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['logs']
            ]);
    }
}
