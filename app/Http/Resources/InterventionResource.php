<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Http\Resources\UserResource;

class InterventionResource extends JsonResource
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
            'task_id' => $this->task_id,
            'description' => $this->description,
            'status' => $this->status,
            'action_time' => $this->action_time,
            'image_path' => $this->image_url,
            'rejection_comment' => $this->rejection_comment,
            'rejection_image_path' => $this->rejection_image_url,
            'rating_comment' => $this->rating_comment,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', function () {
                return $this->user ? (new UserResource($this->user))->toArray(request()) : null;
            }),
            'task' => $this->whenLoaded('task', function () {
                $projects = $this->task->products->pluck('project')->unique('id')->filter();
                return [
                    'id' => $this->task?->id,
                    'name' => $this->task?->name,
                    'description' => $this->task?->description,
                    'status' => $this->task?->status,
                    'projects' => $projects->map(function($project) {
                        return $project ? [
                            'id' => $project->id,
                            'name' => $project->name,
                        ] : null;
                    })->values(),
                    'assignedUser' => $this->task->assignedUser ? (new UserResource($this->task->assignedUser))->toArray(request()) : null,
                    'createdBy' => $this->task->createdBy ? (new UserResource($this->task->createdBy))->toArray(request()) : null,
                ];
            }),
        ];
    }
}
