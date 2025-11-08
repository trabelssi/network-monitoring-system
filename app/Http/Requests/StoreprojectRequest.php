<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;

class StoreProjectRequest extends FormRequest
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
            'description' => ['required', 'string'],
            'reference' => ['nullable', 'string', 'max:255'],
            'members' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $memberIds = array_filter(array_map('trim', explode(',', $value)));
                    if (empty($memberIds)) {
                        $fail('Au moins un membre doit être sélectionné.');
                    }
                    foreach ($memberIds as $id) {
                        if (!is_numeric($id) || !User::where('id', $id)->exists()) {
                            $fail('Un ou plusieurs membres sélectionnés sont invalides.');
                        }
                    }
                },
            ],
            'products' => [
                'required',
                'array',
                'min:1',
                function ($attribute, $value, $fail) {
                    foreach ($value as $name) {
                        if (empty(trim($name))) {
                            $fail('Les noms de produits ne peuvent pas être vides.');
                        }
                    }
                },
            ],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048']
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Le nom de la machine est requis.',
            'name.max' => 'Le nom de la machine ne doit pas dépasser 255 caractères.',
            'description.required' => 'La description de la machine est requise.',
            'members.required' => 'Au moins un membre doit être sélectionné.',
            'products.required' => 'Au moins un produit doit être fourni.',
            'products.min' => 'Au moins un produit doit être fourni.',
            'image.image' => 'Le fichier doit être une image.',
            'image.mimes' => 'L\'image doit être au format jpeg, png, jpg ou gif.',
            'image.max' => 'L\'image ne doit pas dépasser 2Mo.'
        ];
    }
}
