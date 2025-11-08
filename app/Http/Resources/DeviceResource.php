<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class DeviceResource extends JsonResource
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
            'hostname' => $this->hostname,
            'ip_address' => $this->ip_address,
            'is_alive' => $this->is_alive,
            'snmp_available' => $this->snmp_available,
            'sys_descr' => $this->sys_descr,
            'sys_object_id' => $this->sys_object_id,
            'sys_location' => $this->sys_location,
            'sys_contact' => $this->sys_contact,
            'asset_number' => $this->asset_number,
            'user_name' => $this->user_name,
            'department_id' => $this->department_id,
            'unit_id' => $this->unit_id,
            'auto_assigned' => $this->auto_assigned,
            'last_seen' => $this->last_seen,
            'created_at' => $this->created_at ? (new Carbon($this->created_at))->format('Y-m-d H:i:s') : null,
            'updated_at' => $this->updated_at ? (new Carbon($this->updated_at))->format('Y-m-d H:i:s') : null,
            
            // Human readable dates
            'last_seen_human' => $this->last_seen ? (new Carbon($this->last_seen))->diffForHumans() : 'Jamais vu',
            'created_at_human' => $this->created_at ? (new Carbon($this->created_at))->diffForHumans() : null,
            'updated_at_human' => $this->updated_at ? (new Carbon($this->updated_at))->diffForHumans() : null,
            
            // Status indicators
            'status' => $this->is_alive ? 'En ligne' : 'Hors ligne',
            'status_color' => $this->is_alive ? 'green' : 'red',
            'status_icon' => $this->is_alive ? 'CheckCircleIcon' : 'XCircleIcon',
            
            // Relationships
            'unite_materiel' => $this->whenLoaded('uniteMatériel', function () {
                return [
                    'id' => $this->uniteMatériel->id,
                    'name' => $this->uniteMatériel->name,
                    'description' => $this->uniteMatériel->description,
                ];
            }),
            
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'description' => $this->department->description,
                ];
            }),
            
            // Full path for hierarchical display
            'full_path' => $this->when(
                $this->relationLoaded('department') && $this->relationLoaded('uniteMatériel'),
                function () {
                    $departmentName = $this->department?->name ?? 'Unknown Department';
                    $unitName = $this->uniteMatériel?->name ?? 'Unknown Unit';
                    $hostname = $this->hostname ?? 'Unknown Device';
                    return $departmentName . ' → ' . $unitName . ' → ' . $hostname;
                }
            ),
            
            // Network information
            'network_info' => [
                'ip_class' => $this->getIpClass(),
                'is_private_ip' => $this->isPrivateIp(),
                'ip_version' => $this->ip_address && filter_var($this->ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) ? 'IPv4' : 
                               ($this->ip_address && filter_var($this->ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) ? 'IPv6' : 'Invalid'),
            ],
            
            // Device type indicators (based on sys_descr or hostname)
            'device_type' => $this->getDeviceType(),
            'device_category' => $this->getDeviceCategory(),
            
            // SNMP status
            'snmp_status' => $this->snmp_available ? 'Disponible' : 'Indisponible',
            'snmp_color' => $this->snmp_available ? 'blue' : 'gray',
            
            // Uptime calculation (if last_seen is available)
            'uptime_status' => $this->getUptimeStatus(),
            
            // Status history summary
            'status_history_summary' => $this->whenLoaded('statusHistory', function () {
                $recentHistory = $this->statusHistory()->latest('changed_at')->take(5)->get();
                return [
                    'total_changes' => $this->statusHistory()->count(),
                    'online_changes' => $this->statusHistory()->where('status', 'online')->count(),
                    'offline_changes' => $this->statusHistory()->where('status', 'offline')->count(),
                    'last_change' => $recentHistory->first(),
                    'recent_changes' => $recentHistory,
                ];
            }),
        ];
    }
    
    /**
     * Get IP address class (A, B, C)
     */
    private function getIpClass(): ?string
    {
        if (!$this->ip_address) return null;
        
        // Validate IP address format first
        if (!filter_var($this->ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return null;
        }
        
        $parts = explode('.', $this->ip_address);
        if (count($parts) !== 4) return null;
        
        // Safely convert to integer with validation
        $firstOctet = filter_var($parts[0], FILTER_VALIDATE_INT);
        if ($firstOctet === false || $firstOctet < 0 || $firstOctet > 255) {
            return null;
        }
        
        if ($firstOctet >= 1 && $firstOctet <= 126) return 'A';
        if ($firstOctet >= 128 && $firstOctet <= 191) return 'B';
        if ($firstOctet >= 192 && $firstOctet <= 223) return 'C';
        
        return 'Other';
    }
    
    /**
     * Check if IP is private
     */
    private function isPrivateIp(): bool
    {
        if (!$this->ip_address) return false;
        
        // Validate IP address first
        if (!filter_var($this->ip_address, FILTER_VALIDATE_IP)) {
            return false;
        }
        
        return filter_var($this->ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE) === false;
    }
    
    /**
     * Determine device type based on hostname or sys_descr
     */
    private function getDeviceType(): string
    {
        $hostname = strtolower($this->hostname ?? '');
        $sysDescr = strtolower($this->sys_descr ?? '');
        
        // Check hostname patterns
        if (str_contains($hostname, 'switch') || str_contains($hostname, 'sw')) return 'Switch';
        if (str_contains($hostname, 'router') || str_contains($hostname, 'rtr')) return 'Routeur';
        if (str_contains($hostname, 'server') || str_contains($hostname, 'srv')) return 'Serveur';
        if (str_contains($hostname, 'printer') || str_contains($hostname, 'print')) return 'Imprimante';
        if (str_contains($hostname, 'camera') || str_contains($hostname, 'cam')) return 'Caméra';
        if (str_contains($hostname, 'ap') || str_contains($hostname, 'wifi')) return 'Point d\'accès WiFi';
        
        // Check sys_descr patterns
        if (str_contains($sysDescr, 'cisco') && str_contains($sysDescr, 'switch')) return 'Switch Cisco';
        if (str_contains($sysDescr, 'cisco') && str_contains($sysDescr, 'router')) return 'Routeur Cisco';
        if (str_contains($sysDescr, 'windows')) return 'Poste Windows';
        if (str_contains($sysDescr, 'linux')) return 'Serveur Linux';
        
        return 'Inconnu';
    }
    
    /**
     * Get device category
     */
    private function getDeviceCategory(): string
    {
        $type = $this->getDeviceType();
        
        if (in_array($type, ['Switch', 'Switch Cisco', 'Routeur', 'Routeur Cisco', 'Point d\'accès WiFi'])) {
            return 'Réseau';
        }
        if (in_array($type, ['Serveur', 'Serveur Linux'])) {
            return 'Serveur';
        }
        if (in_array($type, ['Poste Windows'])) {
            return 'Poste de travail';
        }
        if ($type === 'Imprimante') {
            return 'Périphérique';
        }
        if ($type === 'Caméra') {
            return 'Sécurité';
        }
        
        return 'Autre';
    }
    
    /**
     * Get uptime status based on last_seen
     */
    private function getUptimeStatus(): array
    {
        if (!$this->last_seen) {
            return [
                'status' => 'Inconnu',
                'color' => 'gray',
                'message' => 'Jamais vu en ligne',
            ];
        }
        
        try {
            $lastSeen = new Carbon($this->last_seen);
            $hoursAgo = $lastSeen->diffInHours(now());
            
            if ($this->is_alive) {
                return [
                    'status' => 'En ligne',
                    'color' => 'green',
                    'message' => 'Dernière activité: ' . $lastSeen->diffForHumans(),
                ];
            }
            
            if ($hoursAgo < 1) {
                return [
                    'status' => 'Récemment hors ligne',
                    'color' => 'yellow',
                    'message' => 'Hors ligne depuis ' . $lastSeen->diffForHumans(),
                ];
            }
            
            if ($hoursAgo < 24) {
                return [
                    'status' => 'Hors ligne',
                    'color' => 'orange',
                    'message' => 'Hors ligne depuis ' . $lastSeen->diffForHumans(),
                ];
            }
            
            return [
                'status' => 'Longtemps hors ligne',
                'color' => 'red',
                'message' => 'Hors ligne depuis ' . $lastSeen->diffForHumans(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'Erreur',
                'color' => 'gray',
                'message' => 'Erreur lors du calcul du statut',
            ];
        }
    }
}
