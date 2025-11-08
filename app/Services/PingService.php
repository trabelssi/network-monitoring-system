<?php

namespace App\Services;

use App\Models\Device;
use App\Models\DeviceStatusHistory;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PingService
{
    /**
     * Ping a single device and update status
     */
    public function pingDevice(Device $device): array
    {
        $oldStatus = $device->is_alive;
        $newStatus = $this->performPing($device->ip_address);
        
        $statusChanged = $oldStatus !== $newStatus;
        
        // Update device status
        $device->update([
            'is_alive' => $newStatus,
            'last_seen' => $newStatus ? now() : $device->last_seen,
        ]);
        
        // Record status change in history if it changed
        if ($statusChanged) {
            $this->recordStatusChange($device, $newStatus ? 'online' : 'offline');
            
            Log::info("Device status changed", [
                'device_id' => $device->id,
                'hostname' => $device->hostname,
                'ip_address' => $device->ip_address,
                'old_status' => $oldStatus ? 'online' : 'offline',
                'new_status' => $newStatus ? 'online' : 'offline',
            ]);
        }
        
        return [
            'device_id' => $device->id,
            'hostname' => $device->hostname,
            'ip_address' => $device->ip_address,
            'old_status' => $oldStatus ? 'online' : 'offline',
            'new_status' => $newStatus ? 'online' : 'offline',
            'status_changed' => $statusChanged,
            'ping_successful' => $newStatus,
        ];
    }
    
    /**
     * Ping multiple devices
     */
    public function pingMultipleDevices(array $deviceIds = null): array
    {
        $query = Device::query();
        
        if ($deviceIds) {
            $query->whereIn('id', $deviceIds);
        }
        
        $devices = $query->get();
        $results = [];
        
        foreach ($devices as $device) {
            try {
                $results[] = $this->pingDevice($device);
            } catch (\Exception $e) {
                Log::error("Failed to ping device", [
                    'device_id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'error' => $e->getMessage(),
                ]);
                
                $results[] = [
                    'device_id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip_address' => $device->ip_address,
                    'error' => $e->getMessage(),
                    'ping_successful' => false,
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Perform actual ping operation
     */
    private function performPing(string $ipAddress): bool
    {
        // Windows ping command
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $command = "ping -n 1 -w 1000 " . escapeshellarg($ipAddress);
        } else {
            // Linux/Unix ping command
            $command = "ping -c 1 -W 1 " . escapeshellarg($ipAddress);
        }
        
        exec($command, $output, $returnCode);
        
        // Check if ping was successful
        return $returnCode === 0;
    }
    
    /**
     * Record status change in history
     */
    private function recordStatusChange(Device $device, string $status): void
    {
        DeviceStatusHistory::create([
            'device_id' => $device->id,
            'status' => $status,
            'changed_at' => now(),
        ]);
    }
    
    /**
     * Get ping statistics for a device
     */
    public function getDevicePingStats(Device $device, int $days = 7): array
    {
        $history = $device->statusHistory()
            ->where('changed_at', '>=', now()->subDays($days))
            ->orderBy('changed_at')
            ->get();
        
        $totalChanges = $history->count();
        $onlineChanges = $history->where('status', 'online')->count();
        $offlineChanges = $history->where('status', 'offline')->count();
        
        // Calculate uptime percentage
        $uptimePercentage = $totalChanges > 0 ? ($onlineChanges / $totalChanges) * 100 : 0;
        
        return [
            'total_changes' => $totalChanges,
            'online_changes' => $onlineChanges,
            'offline_changes' => $offlineChanges,
            'uptime_percentage' => round($uptimePercentage, 2),
            'last_change' => $history->last(),
            'current_status' => $device->is_alive ? 'online' : 'offline',
        ];
    }
    
    /**
     * Clean up old history records
     */
    public function cleanupOldHistory(int $daysToKeep = 90): int
    {
        $cutoffDate = now()->subDays($daysToKeep);
        
        $deletedCount = DeviceStatusHistory::where('changed_at', '<', $cutoffDate)->delete();
        
        Log::info("Cleaned up old device status history", [
            'deleted_count' => $deletedCount,
            'cutoff_date' => $cutoffDate->toDateString(),
        ]);
        
        return $deletedCount;
    }
}
