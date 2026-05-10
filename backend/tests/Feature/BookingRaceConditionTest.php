<?php

namespace Tests\Feature;

use App\Models\Parking;
use App\Models\User;
use App\Repositories\BookingRepository;
use App\Repositories\ParkingRepository;
use App\Repositories\PricingRuleRepository;
use App\Services\Booking\BookingService;
use App\DTOs\BookingDTO;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BookingRaceConditionTest extends TestCase
{
    use RefreshDatabase;

    protected Parking $parking;
    protected User $user;
    protected BookingService $bookingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->parking = Parking::factory()->create([
            'total_slots' => 3,
            'available_slots' => 3,
            'base_price' => 10.00,
        ]);

        $this->user = User::factory()->create();
        $this->user->assignRole('user');

        $this->bookingService = new BookingService(
            app(BookingRepository::class),
            app(ParkingRepository::class),
            app(PricingRuleRepository::class),
        );
    }

    #[Test]
    public function slot_count_is_respected_exactly()
    {
        // 3 slots → first 3 succeed, next 2 fail
        $successful = 0;
        $failed = 0;

        foreach (range(1, 5) as $i) {
            $baseHour = 8 + ($i * 2);
            try {
                $dto = new BookingDTO(
                    parkingId: $this->parking->id,
                    userId: $this->user->id,
                    startTime: Carbon::now()->addDay()->setTime($baseHour, 0),
                    endTime: Carbon::now()->addDay()->setTime($baseHour + 2, 0),
                );
                $this->bookingService->create($dto, $this->user);
                $successful++;
            } catch (\Throwable) {
                $failed++;
            }
        }

        $this->assertEquals(3, $successful);
        $this->assertEquals(2, $failed);
        $this->assertEquals(0, $this->parking->fresh()->available_slots);
    }

    #[Test]
    public function overlap_prevention_works_independently_of_slots()
    {
        // 3 slots, but all want same time slot → only 1 succeeds (overlap)
        $successful = 0;

        foreach (range(1, 10) as $i) {
            try {
                $dto = new BookingDTO(
                    parkingId: $this->parking->id,
                    userId: $this->user->id,
                    startTime: Carbon::now()->addDay()->setTime(10, 0),
                    endTime: Carbon::now()->addDay()->setTime(12, 0),
                );
                $this->bookingService->create($dto, $this->user);
                $successful++;
            } catch (\Throwable) {
                // expected
            }
        }

        $this->assertEquals(1, $successful,
            "Overlap prevention: only 1 should succeed, got {$successful}"
        );
        $this->assertEquals(2, $this->parking->fresh()->available_slots,
            "Only 1 slot used by overlap prevention"
        );
    }

    #[Test]
    public function cancel_frees_up_slot()
    {
        $dto = new BookingDTO(
            parkingId: $this->parking->id,
            userId: $this->user->id,
            startTime: Carbon::now()->addDay()->setTime(10, 0),
            endTime: Carbon::now()->addDay()->setTime(12, 0),
        );
        $booking = $this->bookingService->create($dto, $this->user);
        $this->assertEquals(2, $this->parking->fresh()->available_slots);

        $this->bookingService->cancel($booking, $this->user);
        $this->assertEquals(3, $this->parking->fresh()->available_slots);
    }

    #[Test]
    public function last_slot_is_protected()
    {
        $this->parking->update(['available_slots' => 1, 'total_slots' => 1]);

        $dto = new BookingDTO(
            parkingId: $this->parking->id,
            userId: $this->user->id,
            startTime: Carbon::now()->addDay()->setTime(10, 0),
            endTime: Carbon::now()->addDay()->setTime(12, 0),
        );

        // Take the last slot
        $booking = $this->bookingService->create($dto, $this->user);
        $this->assertNotNull($booking);
        $this->assertEquals(0, $this->parking->fresh()->available_slots);

        // Try the last slot again → must fail
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $this->expectExceptionMessage('No available slots');

        $dto2 = new BookingDTO(
            parkingId: $this->parking->id,
            userId: $this->user->id,
            startTime: Carbon::now()->addDay()->setTime(14, 0),
            endTime: Carbon::now()->addDay()->setTime(16, 0),
        );
        $this->bookingService->create($dto2, $this->user);
    }

    #[Test]
    public function cancel_and_rebook_works()
    {
        // Take slot → cancel → rebook in same slot → should work
        $dto = new BookingDTO(
            parkingId: $this->parking->id,
            userId: $this->user->id,
            startTime: Carbon::now()->addDay()->setTime(10, 0),
            endTime: Carbon::now()->addDay()->setTime(12, 0),
        );
        $booking = $this->bookingService->create($dto, $this->user);
        $this->assertEquals(2, $this->parking->fresh()->available_slots);

        // Cancel
        $this->bookingService->cancel($booking, $this->user);
        $this->assertEquals(3, $this->parking->fresh()->available_slots);

        // Rebook same slot → should work
        $dto2 = new BookingDTO(
            parkingId: $this->parking->id,
            userId: $this->user->id,
            startTime: Carbon::now()->addDay()->setTime(10, 0),
            endTime: Carbon::now()->addDay()->setTime(12, 0),
        );
        $newBooking = $this->bookingService->create($dto2, $this->user);
        $this->assertNotNull($newBooking);
        $this->assertEquals(2, $this->parking->fresh()->available_slots);
    }
}
