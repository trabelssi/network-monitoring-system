<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Services\SancellaDiscoveryService;
use App\Models\Device;
use Illuminate\Support\Facades\Log;

class MonitorDeviceStatus implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     * 
     * NOTE: Monitoring moved to Python service - Phase 2 (Step 1-8)
     * SancellaDiscoveryService retired 2026-07-29
     * This job is scheduled but no-op until Python replacement is deployed
     */
    public function handle(): void
    {
        // Device monitoring functionality moved to Python service
        // See: phase2-python-service branch, MIGRATION_LOG.md Entry 16
        // This job remains scheduled but dormant until Python service replacement
        
        Log::info('MonitorDeviceStatus: No-op - awaiting Python service replacement', [
            'total_devices' => Device::count()
        ]);
    }

    /**
     * Monitor individual device and create alerts for status changes
     */
    private function monitorDevice(Device $device, SancellaDiscoveryService $discoveryService)
    {
        try {
            // Store previous status before discovery
            $previousStatus = $device->is_alive;
            
            // Discover/update device status
            $discoveryService->discoverDevice($device->ip_address);
            
            // Refresh device to get updated status
            $device->refresh();
            $currentStatus = $device->is_alive;
            
            // Log status changes (alerts removed)
            if ($previousStatus !== $currentStatus) {
                Log::info('Device status changed', [
                    'device_id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'previous_status' => $previousStatus,
                    'current_status' => $currentStatus,
                    'change_time' => now()->toISOString()
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Device monitoring failed', [
                'device_id' => $device->id,
                'hostname' => $device->hostname,
                'ip_address' => $device->ip_address,
                'error' => $e->getMessage()
            ]);
        }
    }
}
