<?php

namespace App\DTOs;

use Carbon\Carbon;

readonly class BookingDTO
{
    public function __construct(
        public int $parkingId,
        public Carbon $startTime,
        public Carbon $endTime,
        public ?int $userId = null,
        public ?int $userCarId = null,
        public ?int $parkingOfferId = null,
    ) {}

    public static function fromRequest(array $data, ?int $userId = null): self
    {
        return new self(
            parkingId: (int) ($data['parking_id'] ?? $data['parking_offer_id'] ?? 0),
            startTime: Carbon::parse($data['start_time']),
            endTime: Carbon::parse($data['end_time']),
            userId: $userId,
            userCarId: isset($data['user_car_id']) ? (int) $data['user_car_id'] : null,
            parkingOfferId: isset($data['parking_offer_id']) ? (int) $data['parking_offer_id'] : null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'start_time' => $this->startTime->toDateTimeString(),
            'end_time' => $this->endTime->toDateTimeString(),
            'user_id' => $this->userId,
            'user_car_id' => $this->userCarId,
        ];

        if ($this->parkingOfferId) {
            $data['parking_offer_id'] = $this->parkingOfferId;
        } else {
            $data['parking_id'] = $this->parkingId;
        }

        return $data;
    }
}
