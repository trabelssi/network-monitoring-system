<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Auth;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only allow admin users to create new users
        return Auth::user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => [ "required", "string", "max:255", ],
            "email" => ["required", "email", "string", "max:255", "unique:users,email", ],
            "password" => ["required", Password::min(8)->letters()->symbols(), "confirmed"],
            "role" => ["required", "string", "in:admin,user"],
        ];
    }
}
