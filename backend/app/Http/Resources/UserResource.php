<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'personal_number' => $this->personal_number,
            'role' => $this->role?->value,
            'role_label' => $this->role?->label(),
            'is_active' => $this->is_active,
            'avatar' => $this->avatar,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'is_phone_verified' => $this->is_phone_verified,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'roles' => $this->whenLoaded('roles', fn() => $this->getRoleNames()),
            'permissions' => $this->whenLoaded('permissions', fn() => $this->getPermissionNames()),
            'parkings_count' => $this->when($this->isOwner(), fn() => $this->parkings()->count()),
            'bookings_count' => $this->when($this->isRegularUser(), fn() => $this->bookings()->count()),
            'has_vehicle' => $this->hasVehicle(),
            'default_vehicle' => new \App\Http\Resources\UserCarResource($this->whenLoaded('defaultCar')),
            'cars_count' => $this->when($this->isRegularUser(), fn() => $this->cars()->count()),
        ];
    }
}
