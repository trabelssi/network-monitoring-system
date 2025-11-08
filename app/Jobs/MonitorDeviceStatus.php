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
     */
    public function handle(): void
    {
        $discoveryService = new SancellaDiscoveryService();
        
        // Monitor all known devices
        Device::chunk(50, function ($devices) use ($discoveryService) {
            foreach ($devices as $device) {
                $this->monitorDevice($device, $discoveryService);
            }
        });

        Log::info('Device status monitoring completed', [
            'monitored_devices' => Device::count()
        ]);
    }

    /**
     * Monitor individual device and create alerts for status changes
     */
    private function monitorDevice(Device $device, SancellaDiscoveryService $discoveryService)
    {
        try {
            // Store previous status before discovery
            $previousStatus = $device->icmp_status;
            
            // Discover/update device status
            $discoveryService->discoverDevice($device->ip_address);
            
            // Refresh device to get updated status
            $device->refresh();
            $currentStatus = $device->icmp_status;
            
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
