<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parking_id' => ['required_without:parking_offer_id', 'integer', 'exists:parkings,id'],
            'parking_offer_id' => ['required_without:parking_id', 'integer', 'exists:parking_offers,id'],
            'start_time' => ['required', 'date', 'after_or_equal:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'user_car_id' => ['nullable', 'integer', 'exists:user_cars,id'],
            'vehicle_plate' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_car_id.exists' => 'The selected vehicle does not exist.',
            'parking_id.required_without' => 'Either parking_id or parking_offer_id is required.',
            'parking_offer_id.required_without' => 'Either parking_id or parking_offer_id is required.',
            'parking_offer_id.exists' => 'The selected parking offer does not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // If parking_offer_id is provided without parking_id, set a placeholder
        // parking_id for backward compatibility in DTO
    }
}
