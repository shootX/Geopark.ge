<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParkingOfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'parking_id' => $this->parking_id,
            'parking' => new ParkingResource($this->whenLoaded('parking')),
            'title' => $this->title,
            'description' => $this->description,
            'parking_type' => $this->parking_type?->value,
            'parking_type_label' => $this->parking_type?->label(),
            'address' => $this->address,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'supported_vehicle_sizes' => $this->supported_vehicle_sizes ?? [],
            'features' => $this->features ?? [],
            'hourly_price' => (float) $this->hourly_price,
            'minimum_hours' => $this->minimum_hours,
            'available_from' => $this->available_from,
            'available_until' => $this->available_until,
            'is_active' => (bool) $this->is_active,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'average_rating' => (float) $this->average_rating,
            'total_reviews' => (int) $this->total_reviews,
            'images' => OfferImageResource::collection($this->whenLoaded('images')),
            'availability' => OfferAvailabilityResource::collection($this->whenLoaded('availability')),
            'distance' => $this->when($this->distance ?? false, fn() => round((float) $this->distance, 2)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
