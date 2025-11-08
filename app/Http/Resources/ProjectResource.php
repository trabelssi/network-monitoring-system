<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Http\Resources\ProductResource;

class ProjectResource extends JsonResource
{

    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get members from the string
        $memberIds = array_filter(explode(',', $this->members ?? ''));
        $members = User::whereIn('id', $memberIds)->get();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'created_at' => (new Carbon($this->created_at))->format('Y-m-d'),
            'reference' => $this->reference,
            'products' => $this->products->map(function($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name
                ];
            }),
            'createdBy' => new UserResource($this->createdBy),
            'updatedBy' => $this->updatedBy ? new UserResource($this->updatedBy) : null,
            'members' => UserResource::collection($members),
            'image_path' => $this->image_path ? Storage::url($this->image_path) : null,
        ];
    }
}
