<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "name" => ['required', 'string', 'max:255'],
            "description" => ['nullable', 'string'],
            "assigned_user_id" => ['required', 'exists:users,id'],
            "observers" => ['nullable', 'array'],
            "observers.*" => ['exists:users,id'],
            "image" => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            "priority" => ['required', 'in:low,medium,high'],
            "due_date" => ['nullable', 'date'],
            "product_ids" => ['required', 'array', 'min:1'],
            "product_ids.*" => ['exists:products,id'],
        ];
    }
}
