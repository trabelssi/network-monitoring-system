<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Facades\Log;

class DeviceStatusService
{
    /**
     * Ping a device and update its status
     */
    public function pingDevice(Device $device): bool
    {
        if (!$device->ip_address) {
            $this->updateDeviceStatus($device, 'unknown');
            return false;
        }

        try {
            $isOnline = $this->ping($device->ip_address);
            $status = $isOnline ? 'online' : 'offline';
            $this->updateDeviceStatus($device, $status);
            return $isOnline;
        } catch (\Exception $e) {
            Log::error("Error pinging device {$device->hostname}: " . $e->getMessage());
            $this->updateDeviceStatus($device, 'unknown');
            return false;
        }
    }

    /**
     * Ping all devices and update their status
     */
    public function pingAllDevices(): void
    {
        $devices = Device::where('enabled', true)->get();
        
        foreach ($devices as $device) {
            $this->pingDevice($device);
        }
    }

    /**
     * Update device status and last ping time
     */
    private function updateDeviceStatus(Device $device, string $status): void
    {
        $device->update([
            'status' => $status,
            'last_ping' => now(),
        ]);
    }

    /**
     * Perform actual ping operation
     */
    private function ping(string $ipAddress): bool
    {
        // Use different ping methods based on OS
        if (PHP_OS_FAMILY === 'Windows') {
            return $this->pingWindows($ipAddress);
        } else {
            return $this->pingUnix($ipAddress);
        }
    }

    /**
     * Ping on Windows systems
     */
    private function pingWindows(string $ipAddress): bool
    {
        $command = "ping -n 1 -w 1000 " . escapeshellarg($ipAddress);
        exec($command, $output, $returnCode);
        
        return $returnCode === 0;
    }

    /**
     * Ping on Unix/Linux systems
     */
    private function pingUnix(string $ipAddress): bool
    {
        $command = "ping -c 1 -W 1 " . escapeshellarg($ipAddress) . " 2>/dev/null";
        exec($command, $output, $returnCode);
        
        return $returnCode === 0;
    }

    /**
     * Get device status summary
     */
    public function getStatusSummary(): array
    {
        $total = Device::count();
        $online = Device::where('status', 'online')->count();
        $offline = Device::where('status', 'offline')->count();
        $unknown = Device::where('status', 'unknown')->count();

        return [
            'total' => $total,
            'online' => $online,
            'offline' => $offline,
            'unknown' => $unknown,
            'uptime_percentage' => $total > 0 ? round(($online / $total) * 100, 2) : 0,
        ];
    }
} 