<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Services\TaskService;
use App\Notifications\GeneralNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DeviceEventController extends Controller
{
    protected TaskService $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    /**
     * Handle incoming device events from Python service.
     *
     * POST /api/internal/device-events
     *
     * Expected payload:
     * {
     *   "device_id": 123,
     *   "event_type": "link_down",
     *   "severity": "critical",
     *   "message": "Interface GigabitEthernet0/1 down"
     * }
     *
     * Protected by VerifyInternalApiToken middleware.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validate incoming payload
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|integer|exists:device,id',
            'event_type' => 'required|string|max:255',
            'severity' => 'required|string|in:info,warning,critical',
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Find the device
        $device = Device::find($validated['device_id']);

        if (!$device) {
            return response()->json([
                'error' => 'Device not found'
            ], 404);
        }

        try {
            // Create task via TaskService
            $task = $this->taskService->createFromDeviceEvent(
                $device,
                $validated['event_type'],
                $validated['severity'],
                $validated['message']
            );

            // Send notification to assigned user
            $this->sendNotification($task, $device, $validated);

            Log::info('Device event processed successfully', [
                'device_id' => $device->id,
                'event_type' => $validated['event_type'],
                'task_id' => $task->id,
            ]);

            return response()->json([
                'success' => true,
                'task_id' => $task->id,
                'message' => 'Device event processed successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to process device event', [
                'device_id' => $validated['device_id'],
                'event_type' => $validated['event_type'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to process device event',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification about the device event.
     *
     * @param \App\Models\Task $task
     * @param Device $device
     * @param array $eventData
     * @return void
     */
    protected function sendNotification($task, Device $device, array $eventData): void
    {
        $deviceIdentifier = $device->hostname ?? $device->ip_address;
        $eventLabel = ucwords(str_replace('_', ' ', $eventData['event_type']));

        $notificationData = [
            'title' => "Device Event: {$eventLabel}",
            'message' => "Device {$deviceIdentifier} triggered a {$eventData['severity']} event. A task has been created.",
            'action_url' => route('tasks.show', $task->id),
            'action_text' => 'View Task',
        ];

        // Notify the assigned user
        $task->assignedUser->notify(new GeneralNotification($notificationData));

        // Also notify all admin users (for critical events)
        if ($eventData['severity'] === 'critical') {
            $admins = User::where('role', User::ROLE_ADMIN)
                ->where('is_active', true)
                ->where('id', '!=', $task->assigned_user_id) // Don't double-notify assigned user
                ->get();

            foreach ($admins as $admin) {
                $admin->notify(new GeneralNotification($notificationData));
            }
        }
    }
}
