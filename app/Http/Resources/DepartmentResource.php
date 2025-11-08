<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class DepartmentResource extends JsonResource
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
            'created_at' => $this->created_at ? (new Carbon($this->created_at))->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? (new Carbon($this->updated_at))->format('Y-m-d H:i:s') : null,
            'created_at_human' => $this->created_at ? (new Carbon($this->created_at))->diffForHumans() : null,
            'updated_at_human' => $this->updated_at ? (new Carbon($this->updated_at))->diffForHumans() : null,
            
            // Relationships
            'uniteMateriels' => $this->whenLoaded('uniteMateriels', function () {
                return $this->uniteMateriels->map(function ($unite) {
                    return [
                        'id' => $unite->id,
                        'name' => $unite->name,
                        'description' => $unite->description,
                        'devices_count' => $unite->devices_count ?? $unite->devices()->count(),
                        'devices' => $unite->relationLoaded('devices') ? $unite->devices->map(function ($device) {
                            return [
                                'id' => $device->id,
                                'hostname' => $device->hostname,
                                'ip_address' => $device->ip_address,
                                'is_alive' => $device->is_alive,
                                'status' => $device->is_alive ? 'En ligne' : 'Hors ligne',
                                'last_seen' => $device->last_seen,
                                'last_seen_human' => $device->last_seen ? (new Carbon($device->last_seen))->diffForHumans() : 'Jamais vu',
                            ];
                        }) : [], // Default to empty array if devices not loaded
                    ];
                });
            }),
            
            'devices' => $this->whenLoaded('devices', function () {
                return $this->devices->map(function ($device) {
                    return [
                        'id' => $device->id,
                        'hostname' => $device->hostname,
                        'ip_address' => $device->ip_address,
                        'is_alive' => $device->is_alive,
                        'status' => $device->is_alive ? 'En ligne' : 'Hors ligne',
                        'last_seen' => $device->last_seen,
                        'last_seen_human' => $device->last_seen ? (new Carbon($device->last_seen))->diffForHumans() : 'Jamais vu',
                        'unit_name' => $device->uniteMatériel->name ?? 'Non assigné',
                    ];
                });
            }),
            
            // Computed statistics
            'uniteMateriels_count' => $this->uniteMateriels_count ?? $this->uniteMateriels()->count(),
            'devices_count' => $this->devices_count ?? $this->devices()->count(),
            
            'devices_stats' => $this->whenLoaded('devices', function () {
                $devices = $this->devices;
                return [
                    'total' => $devices->count(),
                    'online' => $devices->where('is_alive', true)->count(),
                    'offline' => $devices->where('is_alive', false)->count(),
                    'online_percentage' => $devices->count() > 0 ? round(($devices->where('is_alive', true)->count() / $devices->count()) * 100, 1) : 0,
                ];
            }),
            
            'unites_stats' => $this->whenLoaded('uniteMateriels', function () {
                return [
                    'total' => $this->uniteMateriels->count(),
                    'with_devices' => $this->uniteMateriels->filter(function ($unite) {
                        return $unite->devices()->count() > 0;
                    })->count(),
                    'empty' => $this->uniteMateriels->filter(function ($unite) {
                        return $unite->devices()->count() === 0;
                    })->count(),
                ];
            }),
            
            // Device categories breakdown
            'device_categories' => $this->whenLoaded('devices', function () {
                $devices = $this->devices;
                $categories = [];
                
                foreach ($devices as $device) {
                    $category = $this->getDeviceCategory($device);
                    if (!isset($categories[$category])) {
                        $categories[$category] = ['total' => 0, 'online' => 0, 'offline' => 0];
                    }
                    $categories[$category]['total']++;
                    if ($device->is_alive) {
                        $categories[$category]['online']++;
                    } else {
                        $categories[$category]['offline']++;
                    }
                }
                
                return $categories;
            }),
            
            // Recent activity
            'recent_activity' => $this->whenLoaded('devices', function () {
                $recentDevices = $this->devices
                    ->where('last_seen', '>', now()->subHours(24))
                    ->sortByDesc('last_seen')
                    ->take(5);
                    
                return $recentDevices->map(function ($device) {
                    return [
                        'hostname' => $device->hostname,
                        'ip_address' => $device->ip_address,
                        'last_seen' => $device->last_seen,
                        'last_seen_human' => $device->last_seen ? (new Carbon($device->last_seen))->diffForHumans() : null,
                        'is_alive' => $device->is_alive,
                    ];
                });
            }),
            
            // Status indicators for UI
            'can_delete' => $this->devices()->count() === 0 && $this->uniteMateriels()->count() === 0,
            'delete_warning' => $this->getDeleteWarning(),
            'health_score' => $this->calculateHealthScore(),
            'is_unknown' => $this->name === 'Unknown Department',
        ];
    }
    
    /**
     * Get device category based on hostname or sys_descr
     */
    private function getDeviceCategory($device): string
    {
        $hostname = strtolower($device->hostname ?? '');
        $sysDescr = strtolower($device->sys_descr ?? '');
        
        if (str_contains($hostname, 'switch') || str_contains($hostname, 'sw') || 
            (str_contains($sysDescr, 'cisco') && str_contains($sysDescr, 'switch'))) {
            return 'Réseau';
        }
        if (str_contains($hostname, 'server') || str_contains($hostname, 'srv') || 
            str_contains($sysDescr, 'linux')) {
            return 'Serveur';
        }
        if (str_contains($hostname, 'printer') || str_contains($hostname, 'print')) {
            return 'Imprimante';
        }
        if (str_contains($hostname, 'camera') || str_contains($hostname, 'cam')) {
            return 'Sécurité';
        }
        if (str_contains($sysDescr, 'windows')) {
            return 'Poste de travail';
        }
        
        return 'Autre';
    }
    
    /**
     * Get delete warning message
     */
    private function getDeleteWarning(): ?string
    {
        $devicesCount = $this->devices()->count();
        $unitesCount = $this->uniteMateriels()->count();
        
        if ($devicesCount > 0 && $unitesCount > 0) {
            return "Ce département contient {$devicesCount} appareil(s) et {$unitesCount} unité(s) matériel. Suppression impossible.";
        } elseif ($devicesCount > 0) {
            return "Ce département contient {$devicesCount} appareil(s). Suppression impossible.";
        } elseif ($unitesCount > 0) {
            return "Ce département contient {$unitesCount} unité(s) matériel. Suppression impossible.";
        }
        
        return null;
    }
    
    /**
     * Calculate department health score based on device availability
     */
    private function calculateHealthScore(): array
    {
        $devices = $this->devices;
        
        if ($devices->count() === 0) {
            return [
                'score' => 100,
                'status' => 'Aucun appareil',
                'color' => 'gray',
            ];
        }
        
        $onlineCount = $devices->where('is_alive', true)->count();
        $totalCount = $devices->count();
        $score = round(($onlineCount / $totalCount) * 100, 1);
        
        if ($score >= 95) {
            return ['score' => $score, 'status' => 'Excellent', 'color' => 'green'];
        } elseif ($score >= 80) {
            return ['score' => $score, 'status' => 'Bon', 'color' => 'blue'];
        } elseif ($score >= 60) {
            return ['score' => $score, 'status' => 'Moyen', 'color' => 'yellow'];
        } elseif ($score >= 40) {
            return ['score' => $score, 'status' => 'Faible', 'color' => 'orange'];
        } else {
            return ['score' => $score, 'status' => 'Critique', 'color' => 'red'];
        }
    }
}
