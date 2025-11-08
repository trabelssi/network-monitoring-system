<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class UniteMatérielResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'keywords' => $this->keywords,
            'keywords_array' => $this->keywords_array,
            'department_id' => $this->department_id,
            'created_at' => $this->created_at ? (new Carbon($this->created_at))->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? (new Carbon($this->updated_at))->format('Y-m-d H:i:s') : null,
            'created_at_human' => $this->created_at ? (new Carbon($this->created_at))->diffForHumans() : null,
            'updated_at_human' => $this->updated_at ? (new Carbon($this->updated_at))->diffForHumans() : null,
            
            // Relationships
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'description' => $this->department->description,
                ];
            }),
            
            'devices' => $this->whenLoaded('devices', function () {
                return $this->devices->map(function ($device) {
                    return [
                        'id' => $device->id,
                        'hostname' => $device->hostname,
                        'ip_address' => $device->ip_address,
                        'asset_number' => $device->asset_number,
                        'is_alive' => $device->is_alive,
                        'last_seen' => $device->last_seen,
                        'last_seen_human' => $device->last_seen ? (new Carbon($device->last_seen))->diffForHumans() : null,
                        'status' => $device->is_alive ? 'En ligne' : 'Hors ligne',
                        'status_color' => $device->is_alive ? 'green' : 'red',
                    ];
                });
            }),
            
            // Computed attributes
            'devices_count' => $this->devices_count ?? $this->devices()->count(),
            'online_devices_count' => $this->whenLoaded('devices', function () {
                return $this->devices->where('is_alive', true)->count();
            }),
            'offline_devices_count' => $this->whenLoaded('devices', function () {
                return $this->devices->where('is_alive', false)->count();
            }),
            'is_unknown' => $this->name === 'Unknown Unité Matériel',
            'full_name' => $this->whenLoaded('department', function () {
                return $this->department->name . ' → ' . $this->name;
            }),
            
            // Status indicators for UI
            'can_delete' => $this->devices()->count() === 0,
            'delete_warning' => $this->devices()->count() > 0 ? 
                "Cette unité contient {$this->devices()->count()} appareil(s). Suppression impossible." : null,
        ];
    }
}
