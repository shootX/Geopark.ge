<?php

namespace App\DTOs;

readonly class PricingRuleDTO
{
    public function __construct(
        public string $name,
        public string $formula,
        public ?string $description,
        public bool $isActive,
        public ?int $parkingId = null,
        public float $multiplier = 1.0,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            formula: $data['formula'],
            description: $data['description'] ?? null,
            isActive: (bool) ($data['is_active'] ?? true),
            parkingId: isset($data['parking_id']) ? (int) $data['parking_id'] : null,
            multiplier: (float) ($data['multiplier'] ?? 1.0),
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'formula' => $this->formula,
            'description' => $this->description,
            'is_active' => $this->isActive,
            'parking_id' => $this->parkingId,
            'multiplier' => $this->multiplier,
        ];
    }
}
