<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterventionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'task_id' => 'required|exists:tasks,id',
            'description' => 'required|string|max:1000',
            'image' => 'nullable|image|max:5120', // 5MB max
            'status' => 'nullable|string|in:pending,approved,rejected,submitted',
            'rejection_comment' => 'required_if:status,rejected|string|max:1000',
            'rejection_image' => 'required_if:status,rejected|image|max:5120'
        ];
    }

    public function messages()
    {
        return [
            'rejection_comment.required_if' => 'A comment is required when rejecting an intervention.',
            'rejection_image.required_if' => 'An image is required when rejecting an intervention.'
        ];
    }
}