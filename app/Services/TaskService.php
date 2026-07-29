<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class TaskService
{
    /**
     * Create a task from a device event (trap/syslog).
     *
     * Used by the event pipeline (Step 7) to automatically create tasks
     * when network devices send traps or syslog messages.
     *
     * @param Device $device The device that triggered the event
     * @param string $eventType Event type (e.g., 'link_down', 'device_reboot')
     * @param string $severity Event severity ('info', 'warning', 'critical')
     * @param string $details Event details/message
     * @return Task The created task
     */
    public function createFromDeviceEvent(
        Device $device,
        string $eventType,
        string $severity,
        string $details
    ): Task {
        // Map event severity to task priority
        $priority = $this->mapSeverityToPriority($severity);

        // Find first active admin user for assignment
        $adminUser = User::where('role', User::ROLE_ADMIN)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        // Fallback to any active user if no admin found
        if (!$adminUser) {
            $adminUser = User::where('is_active', true)
                ->orderBy('id')
                ->first();
        }

        // If still no user found, throw exception (shouldn't happen in production)
        if (!$adminUser) {
            throw new \RuntimeException('No active users found to assign task');
        }

        // Generate task name and description
        $taskName = $this->generateTaskName($device, $eventType);
        $taskDescription = $this->generateTaskDescription($device, $eventType, $severity, $details);

        // Set due date based on priority
        $dueDate = $this->calculateDueDate($priority);

        // Create the task
        $task = Task::create([
            'name' => $taskName,
            'description' => $taskDescription,
            'assigned_user_id' => $adminUser->id,
            'created_by' => $adminUser->id, // System-created tasks use assigned user as creator
            'updated_by' => $adminUser->id,
            'priority' => $priority,
            'due_date' => $dueDate,
            // status is set to 'pending' automatically by Task model boot method
        ]);

        return $task;
    }

    /**
     * Map event severity to task priority.
     *
     * @param string $severity 'info', 'warning', or 'critical'
     * @return string Task priority ('low', 'medium', 'high')
     */
    protected function mapSeverityToPriority(string $severity): string
    {
        return match(strtolower($severity)) {
            'critical' => 'high',
            'warning' => 'medium',
            'info' => 'low',
            default => 'medium',
        };
    }

    /**
     * Generate task name from device and event type.
     *
     * @param Device $device
     * @param string $eventType
     * @return string
     */
    protected function generateTaskName(Device $device, string $eventType): string
    {
        $deviceIdentifier = $device->hostname ?? $device->ip_address;
        $eventLabel = $this->humanizeEventType($eventType);

        return "{$eventLabel} - {$deviceIdentifier}";
    }

    /**
     * Generate task description from event details.
     *
     * @param Device $device
     * @param string $eventType
     * @param string $severity
     * @param string $details
     * @return string
     */
    protected function generateTaskDescription(
        Device $device,
        string $eventType,
        string $severity,
        string $details
    ): string {
        $deviceIdentifier = $device->hostname ?? $device->ip_address;
        $eventLabel = $this->humanizeEventType($eventType);
        
        $description = "**Automated Task - Device Event Detected**\n\n";
        $description .= "**Device:** {$deviceIdentifier}\n";
        $description .= "**IP Address:** {$device->ip_address}\n";
        $description .= "**Event Type:** {$eventLabel}\n";
        $description .= "**Severity:** " . ucfirst($severity) . "\n";
        $description .= "**Time:** " . now()->format('Y-m-d H:i:s') . "\n\n";
        $description .= "**Details:**\n{$details}\n\n";
        $description .= "---\n";
        $description .= "*This task was automatically created by the network monitoring system.*";

        return $description;
    }

    /**
     * Convert snake_case event type to human-readable label.
     *
     * @param string $eventType
     * @return string
     */
    protected function humanizeEventType(string $eventType): string
    {
        return ucwords(str_replace('_', ' ', $eventType));
    }

    /**
     * Calculate due date based on task priority.
     *
     * Critical: 4 hours
     * Medium: 24 hours
     * Low: 72 hours
     *
     * @param string $priority
     * @return Carbon
     */
    protected function calculateDueDate(string $priority): Carbon
    {
        return match($priority) {
            'high' => now()->addHours(4),
            'medium' => now()->addHours(24),
            'low' => now()->addHours(72),
            default => now()->addHours(24),
        };
    }
}
