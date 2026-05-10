<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'offer_id' => $this->offer_id,
            'url' => $this->url,
            'thumbnail_url' => $this->thumbnailUrl,
            'sort_order' => $this->sort_order,
        ];
    }
}
