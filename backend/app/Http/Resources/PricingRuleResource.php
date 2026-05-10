<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PricingRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parking_id' => $this->parking_id,
            'parking' => new ParkingResource($this->whenLoaded('parking')),
            'name' => $this->name,
            'description' => $this->description,
            'formula' => $this->formula,
            'multiplier' => (float) $this->multiplier,
            'is_active' => $this->is_active,
            'is_valid' => $this->is_valid,
            'valid_from' => $this->valid_from?->toIso8601String(),
            'valid_until' => $this->valid_until?->toIso8601String(),
            'created_by' => $this->created_by,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
