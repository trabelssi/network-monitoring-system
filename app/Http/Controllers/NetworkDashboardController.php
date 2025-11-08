<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NetworkDashboardController extends Controller
{
    public function index()
    {
        $stats = $this->getNetworkStats();
        $unknownDevices = $this->getUnknownDevices();
        $recentDiscoveries = $this->getRecentDiscoveries();
        $departmentBreakdown = $this->getDepartmentBreakdown();
        $networkTopology = $this->getNetworkTopology();
        
        return Inertia::render('Network/Dashboard', [
            'stats' => $stats,
            'unknownDevices' => $unknownDevices,
            'recentDiscoveries' => $recentDiscoveries,
            'departmentBreakdown' => $departmentBreakdown,
            'networkTopology' => $networkTopology,
        ]);
    }
    
    private function getNetworkStats()
    {
        $totalDevices = Device::count();
        $onlineDevices = Device::where('is_alive', true)->count();
        $offlineDevices = Device::where('is_alive', false)->count();
        
        // Count devices that need classification (missing department OR unit OR both)
        // First, get the IDs of Unknown Department and Unknown Unit
        $unknownDepartmentId = Department::where('name', 'Unknown Department')->value('id');
        $unknownUnitId = UniteMatériel::where('name', 'Unknown Unité Matériel')->value('id');
        
        $unknownDevices = Device::where(function($query) use ($unknownDepartmentId, $unknownUnitId) {
            $query->whereNull('department_id')
                  ->orWhereNull('unit_id')
                  ->orWhere('department_id', $unknownDepartmentId)
                  ->orWhere('unit_id', $unknownUnitId);
        })->count();
        
        $assignedDevices = Device::whereNotNull('department_id')->whereNotNull('unit_id')->count();
        
        // Count auto-assigned devices (devices that have SNMP data and are properly assigned)
        $devicesWithSnmp = Device::whereNotNull('sys_descr')
            ->whereNotNull('department_id')
            ->whereNotNull('unit_id')
            ->where('department_id', '!=', $unknownDepartmentId)
            ->where('unit_id', '!=', $unknownUnitId)
            ->count();
        
        return [
            'total_devices' => $totalDevices,
            'online_devices' => $onlineDevices,
            'offline_devices' => $offlineDevices,
            'unknown_devices' => $unknownDevices,
            'assigned_devices' => $assignedDevices,
            'unassigned_devices' => $totalDevices - $assignedDevices,
            'auto_assigned_devices' => $devicesWithSnmp,
            'departments_count' => Department::count(),
            'equipment_units_count' => UniteMatériel::count(),
            'online_percentage' => $totalDevices > 0 ? round(($onlineDevices / $totalDevices) * 100, 1) : 0,
        ];
    }
    
    private function getUnknownDevices()
    {
        // Get the IDs of Unknown Department and Unknown Unit
        $unknownDepartmentId = Department::where('name', 'Unknown Department')->value('id');
        $unknownUnitId = UniteMatériel::where('name', 'Unknown Unité Matériel')->value('id');
        
        return Device::with(['uniteMatériel.department'])
            ->where(function($query) use ($unknownDepartmentId, $unknownUnitId) {
                $query->whereNull('department_id')
                      ->orWhereNull('unit_id')
                      ->orWhere('department_id', $unknownDepartmentId)
                      ->orWhere('unit_id', $unknownUnitId);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'status' => $device->is_alive ? 'online' : 'offline',
                    'snmp_available' => $device->snmp_available,
                    'sys_descr' => $device->sys_descr,
                    'department' => $device->department?->name ?? 'Unassigned',
                    'equipment_unit' => $device->uniteMatériel?->name ?? 'Unassigned',
                    'created_at' => $device->created_at,
                    'assignment_path' => $device->getFullAssignmentPath(),
                ];
            });
    }
    
    private function getRecentDiscoveries()
    {
        return Device::with(['uniteMatériel.department'])
            ->where('created_at', '>=', now()->subHours(24))
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'status' => $device->is_alive ? 'online' : 'offline',
                    'snmp_available' => $device->snmp_available,
                    'department' => $device->department?->name ?? 'Unassigned',
                    'equipment_unit' => $device->uniteMatériel?->name ?? 'Unassigned',
                    'is_assigned' => $device->department_id && $device->unit_id,
                    'created_at' => $device->created_at,
                    'is_unknown' => !$device->department_id || !$device->unit_id,
                ];
            });
    }
    
    private function getDepartmentBreakdown()
    {
        return Department::withCount([
            'devices',
            'devices as online_devices_count' => function($q) {
                $q->where('is_alive', true);
            },
            'devices as offline_devices_count' => function($q) {
                $q->where('is_alive', false);
            },
            'devices as unassigned_devices_count' => function($q) {
                $q->whereNull('unit_id');
            }
        ])
        ->with('uniteMateriels:id,name,department_id')
        ->get()
        ->map(function ($department) {
            return [
                'id' => $department->id,
                'name' => $department->name,
                'description' => $department->description,
                'devices_count' => $department->devices_count,
                'online_devices_count' => $department->online_devices_count,
                'offline_devices_count' => $department->offline_devices_count,
                'unassigned_devices_count' => $department->unassigned_devices_count,
                'equipment_units' => $department->uniteMateriels,
                'health_percentage' => $department->devices_count > 0 
                    ? round(($department->online_devices_count / $department->devices_count) * 100, 1) 
                    : 100,
            ];
        });
    }
    
    private function getNetworkTopology()
    {
        // Group devices by IP subnet for network topology view
        $devices = Device::with(['uniteMatériel.department'])
            ->where('is_alive', true)
            ->get();
            
        $topology = [];
        
        foreach ($devices as $device) {
            if (!$device->ip_address) continue;
            
            // Extract subnet (assuming /24)
            $ipParts = explode('.', $device->ip_address);
            if (count($ipParts) >= 3) {
                $subnet = implode('.', array_slice($ipParts, 0, 3)) . '.0/24';
                
                if (!isset($topology[$subnet])) {
                    $topology[$subnet] = [
                        'subnet' => $subnet,
                        'devices' => [],
                        'department' => $device->department?->name ?? 'Unknown',
                        'device_count' => 0,
                        'online_count' => 0,
                    ];
                }
                
                $topology[$subnet]['devices'][] = [
                    'id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'status' => $device->is_alive ? 'online' : 'offline',
                    'equipment_unit' => $device->uniteMatériel?->name,
                ];
                
                $topology[$subnet]['device_count']++;
                if ($device->is_alive) {
                    $topology[$subnet]['online_count']++;
                }
            }
        }
        
        return array_values($topology);
    }
    
    public function getDevicesByDepartment(Department $department)
    {
        $devices = Device::with(['uniteMatériel'])
            ->where('department_id', $department->id)
            ->orderBy('is_alive', 'desc')
            ->orderBy('hostname')
            ->get();
            
        return response()->json([
            'department' => $department,
            'devices' => $devices,
            'stats' => [
                'total' => $devices->count(),
                'online' => $devices->where('is_alive', true)->count(),
                'offline' => $devices->where('is_alive', false)->count(),
                'unassigned' => $devices->whereNull('unit_id')->count(),
            ]
        ]);
    }
    
    public function getSubnetDetails($subnet)
    {
        // Decode the subnet parameter
        $subnet = urldecode($subnet);
        
        // Extract IP range for subnet query
        $subnetBase = str_replace('/24', '', $subnet);
        $subnetPattern = str_replace('.0', '.%', $subnetBase);
        
        $devices = Device::with(['uniteMatériel.department'])
            ->where('ip_address', 'like', $subnetPattern)
            ->orderBy('ip_address')
            ->get();
            
        return response()->json([
            'subnet' => $subnet,
            'devices' => $devices,
            'stats' => [
                'total' => $devices->count(),
                'online' => $devices->where('is_alive', true)->count(),
                'offline' => $devices->where('is_alive', false)->count(),
            ]
        ]);
    }
}
