<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'parking_id' => $this->parking_id,
            'parking' => new ParkingResource($this->whenLoaded('parking')),
            'parking_offer_id' => $this->parking_offer_id,
            'parking_offer' => new ParkingOfferResource($this->whenLoaded('parkingOffer')),
            'start_time' => $this->start_time?->toIso8601String(),
            'end_time' => $this->end_time?->toIso8601String(),
            'total_price' => (float) $this->total_price,
            'duration_hours' => $this->duration_in_hours,
            'booking_status' => $this->booking_status?->value,
            'status_label' => $this->booking_status?->label(),
            'status_color' => $this->booking_status?->color(),
            'vehicle_plate' => $this->vehicle_plate,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $this->cancellation_reason,
            'rejection_reason' => $this->rejection_reason,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'arrived_at' => $this->arrived_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'user_car_id' => $this->user_car_id,
            'user_car' => new \App\Http\Resources\UserCarResource($this->whenLoaded('userCar')),
            'offers' => OfferResource::collection($this->whenLoaded('offers')),
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'ratings' => RatingResource::collection($this->whenLoaded('ratings')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];

        return $data;
    }
}
