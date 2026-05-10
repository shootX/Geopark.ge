<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date', 'before:today'],
            'personal_number' => ['required', 'string', 'size:11', 'unique:users,personal_number'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'string', 'in:user,owner'],
        ];
    }

    public function messages(): array
    {
        return [
            'personal_number.size' => 'Personal number must be exactly 11 characters.',
            'birth_date.before' => 'You must be at least 1 day old.',
        ];
    }
}
