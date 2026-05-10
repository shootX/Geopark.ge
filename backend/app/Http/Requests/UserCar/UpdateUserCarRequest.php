<?php

namespace App\Http\Requests\UserCar;

use App\Enums\FuelType;
use App\Enums\VehicleCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserCarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $currentYear = now()->year;
        $carId = $this->route('userCar')?->id ?? $this->route('user_car');

        return [
            'brand' => ['sometimes', 'required', 'string', 'max:100'],
            'model' => ['sometimes', 'required', 'string', 'max:100'],
            'category' => ['sometimes', 'required', 'string', Rule::in(VehicleCategory::values())],
            'fuel_type' => ['sometimes', 'required', 'string', Rule::in(FuelType::values())],
            'year' => [
                'sometimes',
                'required',
                'integer',
                'min:1950',
                'max:' . ($currentYear + 1),
            ],
            'plate_number' => [
                'sometimes',
                'required',
                'string',
                'regex:/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/',
                Rule::unique('user_cars', 'plate_number')->ignore($carId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'plate_number.regex' => 'The plate number format must be XX-000-XX (e.g., AB-123-CD).',
            'plate_number.unique' => 'This plate number is already registered.',
            'year.min' => 'The year must be at least 1950.',
            'year.max' => 'The year cannot be later than ' . (now()->year + 1) . '.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('plate_number')) {
            $this->merge([
                'plate_number' => strtoupper($this->plate_number),
            ]);
        }
    }
}
