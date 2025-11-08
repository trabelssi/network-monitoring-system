<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceStatusHistory;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceStatusHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = DeviceStatusHistory::with(['device.department', 'device.uniteMatériel']);

        // Filter by device
        if ($request->filled('device_id')) {
            $query->where('device_id', $request->device_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by department
        if ($request->filled('department')) {
            $query->whereHas('device.department', function($q) use ($request) {
                $q->where('id', $request->department);
            });
        }

        // Filter by unit
        if ($request->filled('unit')) {
            $query->whereHas('device.uniteMatériel', function($q) use ($request) {
                $q->where('id', $request->unit);
            });
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('changed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('changed_at', '<=', $request->date_to . ' 23:59:59');
        }

        // Search by device hostname or IP
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('device', function($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $request->get('sort', 'changed_at');
        $sortDirection = $request->get('direction', 'desc');
        
        $allowedSorts = ['changed_at', 'status', 'device_id'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('changed_at', 'desc');
        }

        $history = $query->paginate(50)->withQueryString();

        // Calculate stats
        $stats = [
            'total_entries' => DeviceStatusHistory::count(),
            'online_changes' => DeviceStatusHistory::where('status', 'online')->count(),
            'offline_changes' => DeviceStatusHistory::where('status', 'offline')->count(),
            'today_changes' => DeviceStatusHistory::whereDate('changed_at', today())->count(),
        ];

        $filters = $request->only([
            'device_id', 'status', 'department', 'unit', 
            'date_from', 'date_to', 'search', 'sort', 'direction'
        ]);
        
        // Ensure filters is an associative array (object)
        if (!is_array($filters) || array_is_list($filters)) {
            $filters = [];
        }

        return Inertia::render('DeviceHistory/Index', [
            'history' => $history,
            'filters' => $filters,
            'departments' => Department::all(),
            'uniteMateriels' => UniteMatériel::with('department')->get(),
            'stats' => $stats,
        ]);
    }

    public function show(Device $device, Request $request)
    {
        try {
            // Ensure device exists and is valid
            if (!$device || !$device->exists) {
                abort(404, 'Device not found');
            }

            $query = $device->statusHistory();

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->filled('date_from')) {
                $query->where('changed_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->where('changed_at', '<=', $request->date_to . ' 23:59:59');
            }

            // Sorting
            $sortField = $request->get('sort', 'changed_at');
            $sortDirection = $request->get('direction', 'desc');
            
            $allowedSorts = ['changed_at', 'status'];
            if (in_array($sortField, $allowedSorts)) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->orderBy('changed_at', 'desc');
            }

            $history = $query->paginate(50)->withQueryString();

            // Ensure history data is properly structured
            if (!$history) {
                $history = collect([])->paginate(50);
            }

            // Calculate device-specific stats
            $stats = [
                'total_changes' => $device->statusHistory()->count(),
                'online_changes' => $device->statusHistory()->where('status', 'online')->count(),
                'offline_changes' => $device->statusHistory()->where('status', 'offline')->count(),
                'last_change' => $device->statusHistory()->latest('changed_at')->first(),
                'current_status' => $device->is_alive ? 'online' : 'offline',
            ];

            // Log successful response for debugging
            \Log::info('DeviceStatusHistoryController show success', [
                'device_id' => $device->id,
                'history_count' => $history->count(),
                'total_count' => $history->total(),
                'filters' => $request->only(['status', 'date_from', 'date_to', 'sort', 'direction'])
            ]);

            $filters = $request->only(['status', 'date_from', 'date_to', 'sort', 'direction']);
            
            // Ensure filters is an associative array (object)
            if (!is_array($filters) || array_is_list($filters)) {
                $filters = [];
            }

            return Inertia::render('DeviceHistory/Show', [
                'device' => $device->load(['department', 'uniteMatériel']),
                'history' => $history,
                'filters' => $filters,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('DeviceStatusHistoryController show error: ' . $e->getMessage(), [
                'device_id' => $device->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            
            $filters = $request->only(['status', 'date_from', 'date_to', 'sort', 'direction']);
            
            // Ensure filters is an associative array (object)
            if (!is_array($filters) || array_is_list($filters)) {
                $filters = [];
            }
            
            // Return a safe fallback
            return Inertia::render('DeviceHistory/Show', [
                'device' => $device->load(['department', 'uniteMatériel']),
                'history' => collect([])->paginate(50),
                'filters' => $filters,
                'stats' => [
                    'total_changes' => 0,
                    'online_changes' => 0,
                    'offline_changes' => 0,
                    'last_change' => null,
                    'current_status' => 'unknown',
                ],
            ]);
        }
    }
}
