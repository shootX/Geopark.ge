<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParkingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'title' => $this->title,
            'description' => $this->description,
            'address' => $this->address,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'total_slots' => $this->total_slots,
            'available_slots' => $this->available_slots,
            'occupancy_rate' => $this->occupancy_rate,
            'base_price' => (float) $this->base_price,
            'images' => $this->images ?? [],
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'is_open' => $this->is_open,
            'opening_time' => $this->opening_time ? $this->opening_time->format('H:i') : null,
            'closing_time' => $this->closing_time ? $this->closing_time->format('H:i') : null,
            'amenities' => $this->amenities ?? [],
            'cancellation_policy' => $this->cancellation_policy,
            'is_verified' => $this->is_verified,
            'distance' => $this->when($this->distance ?? false, fn() => round((float) $this->distance, 2)),
            'active_pricing_rule' => new PricingRuleResource($this->whenLoaded('activePricingRule')),
            'bookings_count' => $this->when($this->bookings_count ?? false, (int) $this->bookings_count),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
