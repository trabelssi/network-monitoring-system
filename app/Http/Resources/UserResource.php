<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($this->resource === null) {
            return [];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'is_active' => (bool)$this->is_active,
            'deleted_at' => $this->deleted_at ? (new Carbon($this->deleted_at))->format('Y-m-d H:i:s') : null,
            'created_at' => $this->created_at ? (new Carbon($this->created_at))->format('Y-m-d') : null,
        ];
    }
}
