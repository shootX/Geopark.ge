<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiveLocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'user_id' => $this->user_id,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'heading' => $this->heading ? (float) $this->heading : null,
            'speed' => $this->speed ? (float) $this->speed : null,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
