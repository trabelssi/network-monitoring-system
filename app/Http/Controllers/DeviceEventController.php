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
     * Handle incoming device events from Python service or Alertmanager webhook.
     *
     * POST /api/internal/device-events
     *
     * Supports two payload formats:
     *
     * 1. Python service (trap/syslog events):
     * {
     *   "device_id": 123,
     *   "event_type": "link_down",
     *   "severity": "critical",
     *   "message": "Interface GigabitEthernet0/1 down"
     * }
     *
     * 2. Alertmanager webhook (Prometheus alerts):
     * {
     *   "version": "4",
     *   "status": "firing|resolved",
     *   "alerts": [
     *     {
     *       "status": "firing|resolved",
     *       "labels": {"alertname": "DeviceDown", "device_id": "5", "severity": "critical"},
     *       "annotations": {"summary": "...", "description": "..."},
     *       "startsAt": "2026-07-30T10:00:00Z",
     *       "endsAt": "2026-07-30T10:15:00Z",
     *       "fingerprint": "abc123"
     *     }
     *   ]
     * }
     *
     * Protected by VerifyInternalApiToken middleware.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Detect payload type by presence of 'alerts' array
        if ($request->has('alerts') && is_array($request->input('alerts'))) {
            return $this->handleAlertmanagerWebhook($request);
        } else {
            return $this->handlePythonServiceEvent($request);
        }
    }

    /**
     * Handle Python service device event (original implementation).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    protected function handlePythonServiceEvent(Request $request)
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
     * Handle Alertmanager webhook (Prometheus alerts).
     *
     * Processes multiple alerts from a single webhook, creating one task per firing alert.
     * Resolved alerts are tracked but do not create tasks.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    protected function handleAlertmanagerWebhook(Request $request)
    {
        // Validate Alertmanager webhook envelope
        $validator = Validator::make($request->all(), [
            'version' => 'required|string',
            'groupKey' => 'nullable|string',
            'truncatedAlerts' => 'nullable|integer',
            'status' => 'required|string|in:firing,resolved',
            'receiver' => 'nullable|string',
            'groupLabels' => 'nullable|array',
            'commonLabels' => 'nullable|array',
            'commonAnnotations' => 'nullable|array',
            'externalURL' => 'nullable|string',
            
            // Alerts array validation
            'alerts' => 'required|array|min:1',
            'alerts.*.status' => 'required|string|in:firing,resolved',
            'alerts.*.labels' => 'required|array',
            'alerts.*.labels.alertname' => 'required|string',
            'alerts.*.labels.device_id' => 'nullable|string',
            'alerts.*.labels.severity' => 'nullable|string',
            'alerts.*.labels.hostname' => 'nullable|string',
            'alerts.*.annotations' => 'nullable|array',
            'alerts.*.startsAt' => 'required|string',
            'alerts.*.endsAt' => 'nullable|string',
            'alerts.*.generatorURL' => 'nullable|string',
            'alerts.*.fingerprint' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Tracking arrays for response
        $taskIds = [];
        $errors = [];
        $resolved = [];
        $processedCount = 0;
        $skippedResolvedCount = 0;
        $skippedErrorsCount = 0;

        // Process each alert
        foreach ($validated['alerts'] as $alert) {
            // Skip resolved alerts - only create tasks for firing alerts
            if ($alert['status'] === 'resolved') {
                $skippedResolvedCount++;
                $resolved[] = [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $alert['labels']['device_id'] ?? 'unknown',
                    'hostname' => $alert['labels']['hostname'] ?? null,
                    'resolved_at' => $alert['endsAt'] ?? $alert['startsAt'],
                ];
                continue;
            }

            // Extract and validate device_id from labels
            $deviceIdLabel = $alert['labels']['device_id'] ?? null;
            
            if (empty($deviceIdLabel)) {
                $skippedErrorsCount++;
                $errors[] = [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceIdLabel,
                    'reason' => 'device_id label missing or invalid',
                ];
                
                Log::warning('Alertmanager alert skipped: device_id missing', [
                    'alertname' => $alert['labels']['alertname'],
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                ]);
                
                continue;
            }

            $deviceId = (int) $deviceIdLabel;
            
            if ($deviceId <= 0) {
                $skippedErrorsCount++;
                $errors[] = [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceIdLabel,
                    'reason' => 'device_id label missing or invalid',
                ];
                
                Log::warning('Alertmanager alert skipped: invalid device_id', [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceIdLabel,
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                ]);
                
                continue;
            }

            // Find device in database
            $device = Device::find($deviceId);
            
            if (!$device) {
                $skippedErrorsCount++;
                $errors[] = [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceIdLabel,
                    'reason' => 'Device not found in database',
                ];
                
                Log::warning('Alertmanager alert skipped: device not found', [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceId,
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                ]);
                
                continue;
            }

            try {
                // Extract fields using confirmed mapping
                
                // Convert PascalCase alertname to snake_case for TaskService humanizer
                // DeviceDown → device_down, HighResponseTime → high_response_time
                $alertname = $alert['labels']['alertname'];
                $eventType = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $alertname));
                
                // Extract severity from labels (with fallback to 'warning')
                $severity = strtolower($alert['labels']['severity'] ?? 'warning');
                
                // Build message from annotations
                $message = $alert['annotations']['description'] 
                    ?? $alert['annotations']['summary'] 
                    ?? 'No details provided';
                
                // Append alert status and timing information
                $message .= "\n\n**Alert Status:** " . ucfirst($alert['status']);
                $message .= "\n**Alert Started:** " . $alert['startsAt'];
                
                if ($alert['status'] === 'resolved' && isset($alert['endsAt'])) {
                    $message .= "\n**Alert Resolved:** " . $alert['endsAt'];
                }

                // Log for duplicate detection awareness
                Log::info('Processing Alertmanager alert', [
                    'alertname' => $alertname,
                    'device_id' => $deviceId,
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                    'status' => $alert['status'],
                ]);

                // Note: No deduplication implemented for MVP
                // If repeat_interval fires, this will create a duplicate task
                // TODO: Future enhancement - check for existing open task by fingerprint
                // to prevent duplicates from repeat_interval (currently: 4h).
                // Requires adding alert_fingerprint column to tasks table.

                // Create task via TaskService (same as Python branch)
                $task = $this->taskService->createFromDeviceEvent(
                    $device,
                    $eventType,
                    $severity,
                    $message
                );

                // Send notification (same as Python branch)
                $this->sendNotification($task, $device, [
                    'event_type' => $eventType,
                    'severity' => $severity,
                ]);

                $taskIds[] = $task->id;
                $processedCount++;

                Log::info('Alertmanager alert processed successfully', [
                    'alertname' => $alertname,
                    'device_id' => $deviceId,
                    'task_id' => $task->id,
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                ]);

            } catch (\Exception $e) {
                $skippedErrorsCount++;
                $errors[] = [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceIdLabel,
                    'reason' => 'Task creation failed: ' . $e->getMessage(),
                ];
                
                Log::error('Failed to process Alertmanager alert', [
                    'alertname' => $alert['labels']['alertname'],
                    'device_id' => $deviceId,
                    'fingerprint' => $alert['fingerprint'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Build response with appropriate message
        $response = [
            'success' => true,
            'processed' => $processedCount,
            'skipped_resolved' => $skippedResolvedCount,
            'skipped_errors' => $skippedErrorsCount,
        ];

        // Determine message based on results
        if ($processedCount > 0 && $skippedErrorsCount > 0) {
            $response['message'] = 'Webhook processed with errors';
        } elseif ($processedCount > 0) {
            $response['message'] = 'Webhook processed successfully';
        } elseif ($skippedErrorsCount > 0) {
            $response['message'] = 'Webhook received but no valid alerts could be processed';
        } elseif ($skippedResolvedCount > 0) {
            $response['message'] = 'Webhook received - all alerts already resolved';
        } else {
            $response['message'] = 'Webhook received but contained no alerts';
        }

        // Include optional arrays only if non-empty
        if (!empty($taskIds)) {
            $response['task_ids'] = $taskIds;
        }

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        if (!empty($resolved)) {
            $response['resolved'] = $resolved;
        }

        return response()->json($response, 200);
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
