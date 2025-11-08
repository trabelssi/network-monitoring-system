<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUniteMatérielRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'department_id' => ['required', 'exists:department,id'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de l\'unité matériel est requis.',
            'name.max' => 'Le nom de l\'unité matériel ne peut pas dépasser 255 caractères.',
            'description.max' => 'La description ne peut pas dépasser 1000 caractères.',
            'department_id.required' => 'Le département est requis.',
            'department_id.exists' => 'Le département sélectionné n\'existe pas.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nom',
            'description' => 'description',
            'department_id' => 'département',
            'keywords' => 'mots-clés',
        ];
    }
}
