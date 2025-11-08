<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TaskResource extends JsonResource
{
    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $projects = $this->products->pluck('project')->unique('id')->filter();

        // Ensure task status is up to date
        $this->refresh();
        $this->status = $this->determineStatus();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'title' => $this->name,
            'description' => $this->description,
            'created_at' => (new Carbon($this->created_at))->format('Y-m-d'),
            'due_date' => $this->due_date ? (new Carbon($this->due_date))->format('Y-m-d') : null,
            'status' => $this->status,
            'priority' => $this->priority,
            'assignedUser' => $this->assignedUser ? new UserResource($this->assignedUser) : null,
            'products' => $this->whenLoaded('products', function () {
                return $this->products->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'project' => $product->project ? [
                            'id' => $product->project->id,
                            'name' => $product->project->name,
                        ] : null,
                    ];
                });
            }),
            'projects' => $projects,
            'created_by' => $this->created_by,
            'createdBy' => new UserResource($this->createdBy),
            'updatedBy' => new UserResource($this->updatedBy),
            'image_path' => $this->image_path ? Storage::url($this->image_path) : '',
            'assigned_user_id' => $this->assigned_user_id,
            'observers' => UserResource::collection($this->whenLoaded('observers')),
            'interventions' => $this->whenLoaded('interventions', function () {
                return $this->interventions->map(function ($intervention) {
                    return [
                        'id' => $intervention->id,
                        'description' => $intervention->description,
                        'status' => $intervention->status,
                        'action_time' => $intervention->action_time,
                        'image_path' => $intervention->image_url,
                        'rejection_comment' => $intervention->rejection_comment,
                        'rejection_image_path' => $intervention->rejection_image_url,
                        'created_at' => $intervention->created_at,
                        'updated_at' => $intervention->updated_at,
                        'user' => $intervention->user ? new UserResource($intervention->user) : null,
                    ];
                });
            }),
            'interventions_count' => $this->interventions_count ?? $this->interventions()->count(),
            'latest_intervention' => $this->whenLoaded('interventions', function() {
                $latest = $this->interventions->sortByDesc('created_at')->first();
                return $latest ? [
                    'status' => $latest->status,
                    'created_at' => $latest->created_at
                ] : null;
            }),
            'computed_status' => $this->determineStatus(),
        ];
    }
}
