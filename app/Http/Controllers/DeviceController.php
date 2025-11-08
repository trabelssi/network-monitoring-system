<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use App\Http\Requests\StoreDeviceRequest;
use App\Http\Requests\UpdateDeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Services\PingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        $query = Device::with(['uniteMatériel', 'department']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_alive', $request->status === 'online');
        }

        // Filter by department
        if ($request->filled('department')) {
            $query->where('department_id', $request->department);
        }

        // Search by hostname or IP
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        // Filter for unknown devices
        if ($request->boolean('unknown')) {
            $query->whereHas('uniteMatériel', function($q) {
                $q->where('name', 'Unknown Unité Matériel')
                  ->whereHas('department', function($dept) {
                      $dept->where('name', 'Unknown Department');
                  });
            });
        }

                // Sorting options
        $sortField = $request->get('sort', 'hostname');
        $sortDirection = $request->get('direction', 'asc');
        
        $allowedSorts = ['hostname', 'ip_address', 'is_alive', 'last_seen', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('hostname');
        }

        $devices = $query->paginate(50)
            ->withQueryString();

        // Calculate stats
        $stats = [
            'total' => Device::count(),
            'online' => Device::where('is_alive', true)->count(),
            'offline' => Device::where('is_alive', false)->count(),
            'unknown' => Device::whereHas('uniteMatériel', function($q) {
                $q->where('name', 'Unknown Unité Matériel')
                  ->whereHas('department', function($dept) {
                      $dept->where('name', 'Unknown Department');
                  });
            })->count()
        ];

        return Inertia::render('Device/Index', [
            'devices' => $devices->through(fn($device) => new DeviceResource($device)),
            'filters' => $request->only([
                'status', 'department', 'search', 
                'sort', 'direction', 'unknown'
            ]),
            'departments' => Department::all(),
            'uniteMateriels' => UniteMatériel::with('department')->get(),
            'stats' => $stats,
        ]);
    }

    public function export(Request $request)
    {
        $query = Device::with(['uniteMatériel', 'department', 'alerts' => function($q) {
            $q->whereNull('resolved_at');
        }]);

        // Apply the same filters as index method
        if ($request->filled('status')) {
            $query->where('icmp_status', $request->status);
        }

        if ($request->filled('department')) {
            $query->whereHas('uniteMatériel', function($q) use ($request) {
                $q->where('department_id', $request->department);
            });
        }

        if ($request->boolean('unknown')) {
            $query->whereHas('uniteMatériel', function($q) {
                $q->where('name', 'Unknown Unité Matériel')
                  ->orWhereHas('department', function($dept) {
                      $dept->where('name', 'Unknown Department');
                  });
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('asset_number', 'like', "%{$search}%");
            });
        }

        $devices = $query->get();

        $csv = "Hostname,IP Address,Asset Number,Department,Unité Matériel,Device Type,Status,SNMP Version,Last Seen,Active Alerts,Description\n";
        
        foreach ($devices as $device) {
            $csv .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s","%s","%d","%s"' . "\n",
                $device->hostname ?: '',
                $device->ip_address ?: '',
                $device->asset_number ?: '',
                $device->uniteMatériel->department->name ?? '',
                $device->uniteMatériel->name ?? '',
                $device->device_type ?: '',
                $device->icmp_status ?: '',
                $device->snmp_version ?: '',
                $device->last_seen ? $device->last_seen->format('Y-m-d H:i:s') : '',
                $device->alerts->count(),
                str_replace('"', '""', $device->description ?: '')
            );
        }

        $filename = 'sancella_devices_export_' . now()->format('Y_m_d_H_i_s') . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
    
    public function create()
    {
        return Inertia::render('Device/Create', [
            'departments' => Department::all(),
            'uniteMateriels' => UniteMatériel::with('department')->get(),
        ]);
    }
    
    public function store(StoreDeviceRequest $request)
    {
        $validated = $request->validated();
        
        // Ensure manually created devices are marked as not auto-assigned
        $validated['auto_assigned'] = false;

        Device::create($validated);

        return redirect()->route('devices.index')->with('success', 'Appareil créé avec succès');
    }
    
    public function show(Device $device)
    {
        $device->load(['uniteMatériel', 'department']);
        
        return Inertia::render('Device/Show', [
            'device' => new DeviceResource($device),
        ]);
    }
    
    public function edit(Device $device)
    {
        return Inertia::render('Device/Edit', [
            'device' => $device,
            'departments' => Department::all(),
            'uniteMateriels' => UniteMatériel::with('department')->get(),
        ]);
    }

    
    public function update(UpdateDeviceRequest $request, Device $device)
    {
        $validated = $request->validated();
        
        // When manually updating a device, mark it as not auto-assigned
        $validated['auto_assigned'] = false;
        
        $device->update($validated);
        return redirect()->back()->with('success', 'Appareil mis à jour avec succès');
    }
    
    public function destroy(Device $device)
    {
        $device->delete();
        return redirect()->route('devices.index')->with('success', 'Appareil supprimé avec succès');
    }
    
    public function classify(Request $request, Device $device)
    {
        $validated = $request->validate([
            'unite_materiel_id' => 'required|exists:unite_materiel,id',
            'user_name' => 'nullable|string|max:255',
            'asset_number' => 'nullable|string|max:50',
        ]);
        
        // Get the selected unite_materiel with its department
        $uniteMatériel = UniteMatériel::with('department')->find($validated['unite_materiel_id']);
        
        // Update device with correct column names
        $device->update([
            'unit_id' => $validated['unite_materiel_id'],
            'department_id' => $uniteMatériel->department_id,
            'user_name' => $validated['user_name'],
            'asset_number' => $validated['asset_number'],
            'auto_assigned' => false, // Mark as manually classified
        ]);
        
        return redirect()->back()->with('success', 'Device classified successfully!');
    }

    public function bulkClassify(Request $request)
    {
        $validated = $request->validate([
            'device_ids' => 'required|array',
            'device_ids.*' => 'exists:device,id',
            'unite_materiel_id' => 'required|exists:unite_materiel,id',
        ]);
        
        // Get the selected unite_materiel with its department
        $uniteMatériel = UniteMatériel::with('department')->find($validated['unite_materiel_id']);
        
        Device::whereIn('id', $validated['device_ids'])
            ->update([
                'unit_id' => $validated['unite_materiel_id'],
                'department_id' => $uniteMatériel->department_id,
                'auto_assigned' => false, // Mark as manually classified
            ]);
        
        return redirect()->back()->with('success', count($validated['device_ids']) . ' devices classified successfully!');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'device_ids' => 'required|array',
            'device_ids.*' => 'exists:device,id',
        ]);
        
        $count = Device::whereIn('id', $validated['device_ids'])->count();
        Device::whereIn('id', $validated['device_ids'])->delete();
        
        return redirect()->back()->with('success', "{$count} devices deleted successfully!");
    }

    public function getUnknownDevices()
    {
        $unknownDevices = Device::whereHas('uniteMatériel', function($q) {
            $q->where('name', 'Unknown Unité Matériel')
              ->orWhereHas('department', function($dept) {
                  $dept->where('name', 'Unknown Department');
              });
        })
        ->with(['uniteMatériel', 'department'])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return Inertia::render('Device/Unknown', [
            'devices' => $unknownDevices,
            'departments' => Department::where('name', '!=', 'Unknown Department')->get(),
            'uniteMateriels' => UniteMatériel::where('name', '!=', 'Unknown Unité Matériel')
                ->with('department')
                ->get(),
        ]);
    }

    public function quickClassify(Request $request, Device $device)
    {
        $validated = $request->validate([
            'unite_materiel_id' => 'required|exists:unite_materiel,id',
        ]);
        
        // Get the selected unite_materiel with its department
        $uniteMatériel = UniteMatériel::with('department')->find($validated['unite_materiel_id']);
        
        $device->update([
            'unit_id' => $validated['unite_materiel_id'],
            'department_id' => $uniteMatériel->department_id,
        ]);
        
        return redirect()->back()->with('success', 'Device classified successfully!');
    }

    /**
     * Ping a specific device
     */
    public function ping(Device $device, Request $request)
    {
        try {
            $pingService = new PingService();
            $result = $pingService->pingDevice($device);
            
            if ($result['status_changed']) {
                $message = "Statut de l'équipement changé de {$result['old_status']} à {$result['new_status']}";
            } else {
                $message = "Équipement pingé avec succès. Le statut reste {$result['new_status']}";
            }
            
            // Check if it's an AJAX request
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $result
                ]);
            }
            
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            $errorMessage = 'Échec du ping de l\'équipement: ' . $e->getMessage();
            
            // Check if it's an AJAX request
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage
                ], 500);
            }
            
            return redirect()->back()->with('error', $errorMessage);
        }
    }

    /**
     * Get ping statistics for a device
     */
    public function pingStats(Device $device)
    {
        try {
            $pingService = new PingService();
            $stats = $pingService->getDevicePingStats($device, 7);
            
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
} 