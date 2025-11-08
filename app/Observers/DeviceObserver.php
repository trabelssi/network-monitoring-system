<?php

namespace App\Observers;

use App\Models\Device;
use App\Models\User;
use App\Notifications\GeneralNotification;
use Illuminate\Support\Facades\Log;

class DeviceObserver
{
    /**
     * Handle the Device "updated" event.
     */
    public function updated(Device $device)
    {
        // Check if is_alive status changed (this represents online/offline)
        if ($device->isDirty('is_alive')) {
            $oldStatus = $device->getOriginal('is_alive') ? 'online' : 'offline';
            $newStatus = $device->is_alive ? 'online' : 'offline';
            
            // Only notify for meaningful status changes
            if ($oldStatus !== $newStatus) {
                $this->notifyAdminsOfStatusChange($device, $oldStatus, $newStatus);
            }
        }
    }

    /**
     * Notify admin users of device status change
     */
    private function notifyAdminsOfStatusChange(Device $device, $oldStatus, $newStatus)
    {
        try {
            // Get all admin users
            $adminUsers = User::where('role', 'admin')->get();
            
            // Create notification message
            $statusIcon = $newStatus === 'online' ? '🟢' : '🔴';
            $statusText = $newStatus === 'online' ? 'EN LIGNE' : 'HORS LIGNE';
            $deviceName = $device->hostname ?? $device->ip_address;
            
            $title = "Changement de statut d'équipement";
            $message = "{$statusIcon} L'équipement {$deviceName} ({$device->ip_address}) est maintenant {$statusText}";
            $actionUrl = route('devices.show', $device->id);
            $actionText = "Voir l'équipement";
            
            // Send notification to each admin using GeneralNotification directly
            foreach ($adminUsers as $admin) {
                $admin->notify(new GeneralNotification([
                    'title' => $title,
                    'message' => $message,
                    'action_url' => $actionUrl,
                    'action_text' => $actionText
                ]));
            }
            
            Log::info('Device status change notifications sent', [
                'device_id' => $device->id,
                'device_name' => $deviceName,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'admin_count' => $adminUsers->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send device status change notifications', [
                'device_id' => $device->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
