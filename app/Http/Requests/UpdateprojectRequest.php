<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UpdateProjectRequest extends FormRequest
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
                function ($attribute, $value, $fail) {
                    if (empty($value)) {
                        $fail('Au moins un produit doit être ajouté.');
                        return;
                    }
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

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la machine est requis.',
            'name.max' => 'Le nom de la machine ne doit pas dépasser 255 caractères.',
            'description.required' => 'La description est requise.',
            'reference.max' => 'La référence ne doit pas dépasser 255 caractères.',
            'members.required' => 'Au moins un membre doit être sélectionné.',
            'products.required' => 'Au moins un produit doit être ajouté.',
            'products.array' => 'Le format des produits est invalide.',
            'image.image' => 'Le fichier doit être une image.',
            'image.mimes' => 'L\'image doit être de type : jpeg, png, jpg, gif.',
            'image.max' => 'L\'image ne doit pas dépasser 2Mo.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Clean up empty members string
        if ($this->members === '') {
            $this->merge(['members' => null]);
        }

        // Clean up empty products array
        if ($this->has('products') && empty($this->products)) {
            $this->merge(['products' => []]);
        }

        // Log the request data for debugging
        Log::info('Project update request data:', [
            'all' => $this->all(),
            'members' => $this->members,
            'products' => $this->products,
        ]);
    }
}
