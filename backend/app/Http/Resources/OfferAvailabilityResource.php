<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferAvailabilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'offer_id' => $this->offer_id,
            'day_of_week' => $this->day_of_week,
            'specific_date' => $this->specific_date?->toDateString(),
            'from_time' => $this->from_time,
            'until_time' => $this->until_time,
            'is_available' => (bool) $this->is_available,
        ];
    }
}
