<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeviceRequest extends FormRequest
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
            'hostname' => ['required', 'string', 'max:255'],
            'ip_address' => ['required', 'ip', 'unique:device,ip_address'],
            'sys_descr' => ['nullable', 'string', 'max:500'],
            'sys_location' => ['nullable', 'string', 'max:255'],
            'sys_contact' => ['nullable', 'string', 'max:255'],
            'asset_number' => ['nullable', 'string', 'max:50'],
            'user_name' => ['nullable', 'string', 'max:255'],
            'department_id' => ['required', 'exists:department,id'],
            'unit_id' => ['required', 'exists:unite_materiel,id'],
            'auto_assigned' => ['nullable', 'boolean'],
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
            'hostname.required' => 'Le nom d\'hôte est requis.',
            'hostname.max' => 'Le nom d\'hôte ne peut pas dépasser 255 caractères.',
            'ip_address.required' => 'L\'adresse IP est requise.',
            'ip_address.ip' => 'L\'adresse IP doit être valide.',
            'ip_address.unique' => 'Cette adresse IP est déjà utilisée par un autre appareil.',
            'sys_descr.max' => 'La description système ne peut pas dépasser 500 caractères.',
            'sys_location.max' => 'La localisation ne peut pas dépasser 255 caractères.',
            'sys_contact.max' => 'Le contact système ne peut pas dépasser 255 caractères.',
            'asset_number.max' => 'Le numéro d\'actif ne peut pas dépasser 50 caractères.',
            'user_name.max' => 'Le nom d\'utilisateur ne peut pas dépasser 255 caractères.',
            'department_id.required' => 'Le département est requis.',
            'department_id.exists' => 'Le département sélectionné n\'existe pas.',
            'unit_id.required' => 'L\'unité matériel est requise.',
            'unit_id.exists' => 'L\'unité matériel sélectionnée n\'existe pas.',
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
            'hostname' => 'nom d\'hôte',
            'ip_address' => 'adresse IP',
            'sys_descr' => 'description système',
            'sys_location' => 'localisation',
            'sys_contact' => 'contact système',
            'asset_number' => 'numéro d\'actif',
            'user_name' => 'nom d\'utilisateur',
            'department_id' => 'département',
            'unit_id' => 'unité matériel',
        ];
    }
}
