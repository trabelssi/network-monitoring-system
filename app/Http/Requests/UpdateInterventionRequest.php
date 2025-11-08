<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInterventionRequest extends FormRequest
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
            'status' => 'required|string|in:approved,rejected',
            'rejection_comment' => 'required_if:status,rejected|nullable|string|max:1000',
            'rejection_image' => 'nullable|image|max:5120|mimes:jpeg,png,jpg,gif',
            'rating_comment' => 'nullable|string|max:1000'
        ];
    }

    public function messages()
    {
        return [
            'status.required' => 'The status field is required.',
            'status.in' => 'The status must be either approved or rejected.',
            'rejection_comment.required_if' => 'A comment is required when rejecting an intervention.',
            'rejection_comment.string' => 'The rejection comment must be text.',
            'rejection_comment.max' => 'The rejection comment must not exceed 1000 characters.',
            'rejection_image.image' => 'The rejection image must be a valid image file.',
            'rejection_image.max' => 'The rejection image must not be larger than 5MB.',
            'rejection_image.mimes' => 'The rejection image must be a JPEG, PNG, JPG, or GIF file.',
            'rating_comment.string' => 'Le commentaire d\'approbation doit être du texte.',
            'rating_comment.max' => 'Le commentaire d\'approbation ne doit pas dépasser 1000 caractères.'
        ];
    }

    protected function prepareForValidation()
    {
        \Log::info('Request data before validation:', $this->all());
        return $this->all();
    }
}
