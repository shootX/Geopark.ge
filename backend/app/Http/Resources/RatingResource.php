<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'from_user_id' => $this->from_user_id,
            'from_user' => new UserResource($this->whenLoaded('fromUser')),
            'to_user_id' => $this->to_user_id,
            'to_user' => new UserResource($this->whenLoaded('toUser')),
            'rating' => (int) $this->rating,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
