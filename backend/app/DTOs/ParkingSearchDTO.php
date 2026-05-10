<?php

namespace App\DTOs;

readonly class ParkingSearchDTO
{
    public function __construct(
        public ?float $latitude,
        public ?float $longitude,
        public ?float $radius,
        public ?string $status,
        public ?string $search,
        public ?float $minPrice,
        public ?float $maxPrice,
        public ?string $sortBy,
        public ?string $sortDirection,
        public int $perPage,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            latitude: isset($data['latitude']) ? (float) $data['latitude'] : null,
            longitude: isset($data['longitude']) ? (float) $data['longitude'] : null,
            radius: isset($data['radius']) ? (float) $data['radius'] : null,
            status: $data['status'] ?? null,
            search: $data['search'] ?? null,
            minPrice: isset($data['min_price']) ? (float) $data['min_price'] : null,
            maxPrice: isset($data['max_price']) ? (float) $data['max_price'] : null,
            sortBy: $data['sort_by'] ?? 'created_at',
            sortDirection: $data['sort_direction'] ?? 'desc',
            perPage: (int) ($data['per_page'] ?? 15),
        );
    }

    public function toArray(): array
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'radius' => $this->radius,
            'status' => $this->status,
            'search' => $this->search,
            'min_price' => $this->minPrice,
            'max_price' => $this->maxPrice,
            'sort_by' => $this->sortBy,
            'sort_direction' => $this->sortDirection,
            'per_page' => $this->perPage,
        ];
    }
}
