<?php

namespace App\Http\Controllers;

use App\Services\DeviceDiscoveryService;
use App\Services\AutoAssignmentService;
use App\Models\DiscoveryQueue;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Illuminate\Support\Facades\Log;

class DeviceDiscoveryController extends Controller
{
    protected $discoveryService;
    protected $autoAssignmentService;

    public function __construct(DeviceDiscoveryService $discoveryService, AutoAssignmentService $autoAssignmentService)
    {
        $this->discoveryService = $discoveryService;
        $this->autoAssignmentService = $autoAssignmentService;
    }

    /**
     * Show the device discovery interface
     */
    public function index(): Response
    {
        try {
            $stats = $this->discoveryService->getDiscoveryStats();
            $recentDiscoveries = DiscoveryQueue::recent(24)
                ->orderBy('discovered_at', 'desc')
                ->limit(50)
                ->get();

            // Sanitize the data to prevent UTF-8 issues
            $sanitizedDiscoveries = $recentDiscoveries->map(function ($discovery) {
                return [
                    'id' => $discovery->id,
                    'ip_address' => $discovery->ip_address,
                    'is_alive' => $discovery->is_alive,
                    'snmp_available' => $discovery->snmp_available,
                    'sys_descr' => $discovery->sys_descr ? mb_convert_encoding($discovery->sys_descr, 'UTF-8', 'UTF-8') : null,
                    'sys_name' => $discovery->sys_name ? mb_convert_encoding($discovery->sys_name, 'UTF-8', 'UTF-8') : null,
                    'sys_contact' => $discovery->sys_contact ? mb_convert_encoding($discovery->sys_contact, 'UTF-8', 'UTF-8') : null,
                    'sys_object_id' => $discovery->sys_object_id ? mb_convert_encoding($discovery->sys_object_id, 'UTF-8', 'UTF-8') : null,
                    'sys_location' => $discovery->sys_location ? mb_convert_encoding($discovery->sys_location, 'UTF-8', 'UTF-8') : null,
                    'discovery_status' => $discovery->discovery_status,
                    'discovered_at' => $discovery->discovered_at,
                    'created_at' => $discovery->created_at,
                    'updated_at' => $discovery->updated_at,
                    'error_message' => $discovery->error_message ? mb_convert_encoding($discovery->error_message, 'UTF-8', 'UTF-8') : null,
                ];
            });

            return Inertia::render('DeviceDiscovery/Index', [
                'stats' => $stats,
                'recentDiscoveries' => $sanitizedDiscoveries
            ]);
        } catch (\Exception $e) {
            Log::error('Error in DeviceDiscovery index: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Return a fallback response
            return Inertia::render('DeviceDiscovery/Index', [
                'stats' => ['total' => 0, 'pending' => 0, 'processed' => 0, 'failed' => 0, 'alive' => 0, 'snmp_available' => 0, 'recent_discoveries' => 0],
                'recentDiscoveries' => []
            ]);
        }
    }

    /**
     * Trigger discovery for a single IP address
     */
    public function discoverSingleIP(Request $request): JsonResponse
    {
        $request->validate([
            'ip_address' => 'required|ip'
        ]);

        try {
            $result = $this->discoveryService->discoverSingleIP($request->ip_address);
            
            if ($result['success']) {
                Log::info("Single IP discovery completed for {$request->ip_address}");
                return response()->json($result);
            } else {
                Log::warning("Single IP discovery failed for {$request->ip_address}: {$result['message']}");
                return response()->json($result, 400);
            }
            
        } catch (Exception $e) {
            Log::error("Single IP discovery error for {$request->ip_address}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Discovery failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trigger discovery for a subnet
     */
    public function discoverSubnet(Request $request): JsonResponse
    {
        $request->validate([
            'subnet' => 'required|string|regex:/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/'
        ]);

        try {
            $result = $this->discoveryService->discoverSubnet($request->subnet);
            
            if ($result['success']) {
                Log::info("Subnet discovery completed for {$request->subnet}");
                return response()->json($result);
            } else {
                Log::warning("Subnet discovery failed for {$request->subnet}: {$result['message']}");
                return response()->json($result, 400);
            }
            
        } catch (Exception $e) {
            Log::error("Subnet discovery error for {$request->subnet}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Discovery failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get discovery queue results
     */
    public function getQueueResults(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|in:pending,processed,failed',
            'limit' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1'
        ]);

        $query = DiscoveryQueue::query();
        
        // Filter by status if provided
        if ($request->status) {
            $query->where('discovery_status', $request->status);
        }
        
        // Order by discovery time (most recent first)
        $query->orderBy('discovered_at', 'desc');
        
        // Pagination
        $limit = $request->limit ?? 50;
        $page = $request->page ?? 1;
        
        $results = $query->paginate($limit, ['*'], 'page', $page);
        
        return response()->json([
            'success' => true,
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total()
            ]
        ]);
    }

    /**
     * Process auto-assignment for all pending devices
     */
    public function processAutoAssignment(): JsonResponse
    {
        try {
            Log::info("Auto-assignment process started");
            
            $result = $this->autoAssignmentService->processAutoAssignment();
            
            if ($result['success']) {
                Log::info("Auto-assignment completed successfully", $result['stats']);
                return response()->json($result);
            } else {
                Log::error("Auto-assignment failed: " . $result['message']);
                return response()->json($result, 500);
            }
            
        } catch (Exception $e) {
            Log::error("Auto-assignment error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Auto-assignment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get auto-assignment statistics
     */
    public function getAutoAssignmentStats(): JsonResponse
    {
        try {
            $stats = $this->autoAssignmentService->getPendingStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            Log::error("Failed to get auto-assignment stats: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve auto-assignment statistics'
            ], 500);
        }
    }

    /**
     * Get discovery statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->discoveryService->getDiscoveryStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            Log::error("Failed to get discovery stats: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics'
            ], 500);
        }
    }

    /**
     * Clear old discovery records
     */
    public function clearOldRecords(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'nullable|integer|min:1|max:365'
        ]);

        try {
            $days = $request->days ?? 7;
            $deletedCount = $this->discoveryService->clearOldRecords($days);
            
            Log::info("Cleared {$deletedCount} old discovery records older than {$days} days");
            
            return response()->json([
                'success' => true,
                'message' => "Cleared {$deletedCount} old discovery records",
                'deleted_count' => $deletedCount
            ]);
            
        } catch (Exception $e) {
            Log::error("Failed to clear old discovery records: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear old records'
            ], 500);
        }
    }

    /**
     * Get device details from discovery queue
     */
    public function show(string $id): Response
    {
        try {
            $discovery = DiscoveryQueue::findOrFail($id);
            
            // Get departments and units for manual assignment
            $departments = Department::all();
            $units = UniteMatériel::with('department')->get();
            
            return Inertia::render('DeviceDiscovery/Show', [
                'discovery' => $discovery,
                'departments' => $departments,
                'units' => $units
            ]);
            
        } catch (Exception $e) {
            abort(404, 'Discovery record not found');
        }
    }

    /**
     * Mark a discovery record as processed
     */
    public function markProcessed(string $id): JsonResponse
    {
        try {
            $discovery = DiscoveryQueue::findOrFail($id);
            $discovery->markAsProcessed();
            
            Log::info("Marked discovery record {$id} as processed");
            
            return response()->json([
                'success' => true,
                'message' => 'Discovery record marked as processed'
            ]);
            
        } catch (Exception $e) {
            Log::error("Failed to mark discovery record {$id} as processed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark discovery as processed'
            ], 500);
        }
    }

    /**
     * Delete a discovery record
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $discovery = DiscoveryQueue::findOrFail($id);
            $discovery->delete();
            
            Log::info("Deleted discovery record {$id}");
            
            return response()->json([
                'success' => true,
                'message' => 'Discovery record deleted successfully'
            ]);
            
        } catch (Exception $e) {
            Log::error("Failed to delete discovery record {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete discovery record'
            ], 500);
        }
    }
}
