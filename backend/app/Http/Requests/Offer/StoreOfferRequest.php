<?php

namespace App\Http\Requests\Offer;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'receiver_id' => ['required', 'integer', 'exists:users,id', 'different:sender_id'],
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'message' => ['required', 'string', 'max:1000'],
            'price_offer' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
        ];
    }
}
