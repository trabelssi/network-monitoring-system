<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Device;
use App\Models\User;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class DeviceEventDualPayloadTest extends TestCase
{
    use RefreshDatabase;

    protected string $validToken = 'test-internal-api-token-12345';
    protected User $adminUser;
    protected Device $testDevice;

    protected function setUp(): void
    {
        parent::setUp();

        // Set internal API token for tests
        config(['services.internal_api.token' => $this->validToken]);

        // Create admin user
        $this->adminUser = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'is_active' => true,
        ]);

        // Create test device
        $this->testDevice = Device::factory()->create([
            'hostname' => 'test-switch-01',
            'ip_address' => '10.0.1.5',
            'is_alive' => true,
        ]);
    }

    // ==================== DETECTION LOGIC TESTS ====================

    /** @test */
    public function python_payload_is_routed_to_python_branch()
    {
        Notification::fake();

        $pythonPayload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Interface down',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $pythonPayload);

        // Python branch returns task_id (singular), not task_ids (array)
        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'task_id',  // Not task_ids
                'message'
            ])
            ->assertJsonMissing(['processed', 'skipped_resolved', 'skipped_errors']);
    }

    /** @test */
    public function alertmanager_payload_is_routed_to_alertmanager_branch()
    {
        Notification::fake();

        $alertmanagerPayload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => [
                        'description' => 'Device test-switch-01 is down',
                    ],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $alertmanagerPayload);

        // Alertmanager branch returns processed/skipped counters and task_ids array
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'processed',
                'skipped_resolved',
                'skipped_errors',
                'message',
                'task_ids',
            ])
            ->assertJsonMissing(['task_id']);  // Not task_id (singular)
    }

    /** @test */
    public function payload_with_alerts_string_is_not_routed_to_alertmanager_branch()
    {
        Notification::fake();

        // Malicious payload trying to spoof Alertmanager with alerts as string
        // Should route to Python branch, then fail validation because required fields missing
        $spoofPayload = [
            'alerts' => 'not-an-array',  // Not an array, so routes to Python branch
            // Missing required Python fields: device_id, event_type, severity, message
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $spoofPayload);

        // Should route to Python branch (alerts not an array), then fail validation
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_id', 'event_type', 'severity', 'message']);
    }

    // ==================== PYTHON BRANCH REGRESSION TESTS ====================

    /** @test */
    public function python_branch_still_creates_task_with_correct_parameters()
    {
        Notification::fake();

        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Interface GigabitEthernet0/1 down',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Device event processed successfully'
            ])
            ->assertJsonStructure(['success', 'task_id', 'message']);

        // Verify task created with exact same logic as before
        $this->assertDatabaseHas('tasks', [
            'name' => 'Link Down - test-switch-01',
            'assigned_user_id' => $this->adminUser->id,
            'priority' => 'high',  // critical maps to high
            'status' => 'pending',
        ]);

        $task = Task::first();
        $this->assertStringContainsString('test-switch-01', $task->description);
        $this->assertStringContainsString('10.0.1.5', $task->description);
        $this->assertStringContainsString('Link Down', $task->description);
        $this->assertStringContainsString('Critical', $task->description);
        $this->assertStringContainsString('Interface GigabitEthernet0/1 down', $task->description);
    }

    /** @test */
    public function python_branch_still_calls_task_service_with_same_arguments()
    {
        Notification::fake();

        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'device_reboot',
            'severity' => 'warning',
            'message' => 'Device rebooted unexpectedly',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $task = Task::first();

        // Verify TaskService was called with correct args (verifiable via task data)
        $this->assertEquals('Device Reboot - test-switch-01', $task->name);
        $this->assertEquals('medium', $task->priority);  // warning maps to medium
        $this->assertStringContainsString('Device Reboot', $task->description);
        $this->assertStringContainsString('Warning', $task->description);
        $this->assertStringContainsString('Device rebooted unexpectedly', $task->description);
    }

    /** @test */
    public function python_branch_still_notifies_admins_for_critical_severity()
    {
        Notification::fake();

        $admin2 = User::factory()->create(['role' => User::ROLE_ADMIN, 'is_active' => true]);

        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Critical event',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        // All admins should be notified (same behavior as before)
        Notification::assertSentTo(
            [$this->adminUser, $admin2],
            \App\Notifications\GeneralNotification::class
        );
    }

    // ==================== ALERTMANAGER HAPPY PATH TESTS ====================

    /** @test */
    public function alertmanager_webhook_with_one_firing_alert_creates_one_task()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => [
                        'description' => 'Device test-switch-01 (ID: ' . $this->testDevice->id . ') has been unreachable for more than 5 minutes.',
                    ],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'processed' => 1,
                'skipped_resolved' => 0,
                'skipped_errors' => 0,
                'message' => 'Webhook processed successfully',
            ])
            ->assertJsonStructure(['task_ids'])
            ->assertJsonCount(1, 'task_ids');

        // Verify task was created
        $this->assertDatabaseCount('tasks', 1);
        $task = Task::first();

        $this->assertEquals('Device Down - test-switch-01', $task->name);
        $this->assertEquals('high', $task->priority);  // critical maps to high
        $this->assertEquals($this->adminUser->id, $task->assigned_user_id);
        $this->assertStringContainsString('Device test-switch-01', $task->description);
        $this->assertStringContainsString('has been unreachable', $task->description);
        $this->assertStringContainsString('**Alert Status:** Firing', $task->description);
        $this->assertStringContainsString('**Alert Started:** 2026-07-30T10:00:00Z', $task->description);
    }

    /** @test */
    public function alertmanager_webhook_returns_task_ids_array()
    {
        Notification::fake();

        $device2 = Device::factory()->create(['hostname' => 'test-router-02', 'ip_address' => '10.0.1.10']);

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Device 1 down'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'HighResponseTime',
                        'device_id' => (string) $device2->id,
                        'severity' => 'warning',
                    ],
                    'annotations' => ['description' => 'Device 2 slow'],
                    'startsAt' => '2026-07-30T10:05:00Z',
                    'fingerprint' => 'def456',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'processed' => 2,
                'skipped_resolved' => 0,
                'skipped_errors' => 0,
            ])
            ->assertJsonCount(2, 'task_ids');

        $this->assertDatabaseCount('tasks', 2);

        $taskIds = $response->json('task_ids');
        $this->assertCount(2, $taskIds);
        $this->assertTrue(is_int($taskIds[0]));
        $this->assertTrue(is_int($taskIds[1]));
    }

    // ==================== ALERTMANAGER RESOLVED ALERT TESTS ====================

    /** @test */
    public function alertmanager_webhook_skips_resolved_alert_without_creating_task()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'resolved',
            'alerts' => [
                [
                    'status' => 'resolved',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => [
                        'description' => 'Device test-switch-01 is back online',
                    ],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'endsAt' => '2026-07-30T10:15:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'processed' => 0,
                'skipped_resolved' => 1,
                'skipped_errors' => 0,
                'message' => 'Webhook received - all alerts already resolved',
            ])
            ->assertJsonMissing(['task_ids'])  // Omitted when empty
            ->assertJsonMissing(['errors'])    // Omitted when empty
            ->assertJsonStructure(['resolved']);

        // Verify NO task was created
        $this->assertDatabaseCount('tasks', 0);

        // Verify resolved alert appears in resolved[] array
        $resolved = $response->json('resolved');
        $this->assertCount(1, $resolved);
        $this->assertEquals('DeviceDown', $resolved[0]['alertname']);
        $this->assertEquals((string) $this->testDevice->id, $resolved[0]['device_id']);
        $this->assertEquals('test-switch-01', $resolved[0]['hostname']);
        $this->assertEquals('2026-07-30T10:15:00Z', $resolved[0]['resolved_at']);

        // Verify NO notification was sent
        Notification::assertNothingSent();
    }

    /** @test */
    public function alertmanager_webhook_tracks_resolved_alerts_in_resolved_array_not_errors_array()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'resolved',
                    'labels' => [
                        'alertname' => 'HighResponseTime',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'warning',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => ['description' => 'Response time back to normal'],
                    'startsAt' => '2026-07-30T09:00:00Z',
                    'endsAt' => '2026-07-30T09:30:00Z',
                    'fingerprint' => 'xyz789',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'processed' => 0,
                'skipped_resolved' => 1,
                'skipped_errors' => 0,  // NOT incremented
            ])
            ->assertJsonMissing(['errors'])  // Errors array not present
            ->assertJsonStructure(['resolved']);

        $this->assertDatabaseCount('tasks', 0);
    }

    // ==================== ALERTMANAGER ERROR PATH TESTS ====================

    /** @test */
    public function alertmanager_webhook_skips_alert_with_missing_device_id()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        // device_id missing
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Some device is down'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'processed' => 0,
                'skipped_resolved' => 0,
                'skipped_errors' => 1,
                'message' => 'Webhook received but no valid alerts could be processed',
            ])
            ->assertJsonMissing(['task_ids'])
            ->assertJsonMissing(['resolved'])
            ->assertJsonStructure(['errors']);

        $this->assertDatabaseCount('tasks', 0);

        $errors = $response->json('errors');
        $this->assertCount(1, $errors);
        $this->assertEquals('DeviceDown', $errors[0]['alertname']);
        $this->assertStringContainsString('device_id label missing or invalid', $errors[0]['reason']);
    }

    /** @test */
    public function alertmanager_webhook_skips_alert_with_invalid_device_id()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => 'not-a-number',  // Invalid
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Device down'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'processed' => 0,
                'skipped_errors' => 1,
            ])
            ->assertJsonStructure(['errors']);

        $this->assertDatabaseCount('tasks', 0);

        $errors = $response->json('errors');
        $this->assertEquals('not-a-number', $errors[0]['device_id']);
        $this->assertStringContainsString('device_id label missing or invalid', $errors[0]['reason']);
    }

    /** @test */
    public function alertmanager_webhook_skips_alert_with_nonexistent_device()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => '99999',  // Does not exist in DB
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Device down'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'processed' => 0,
                'skipped_errors' => 1,
            ])
            ->assertJsonStructure(['errors']);

        $this->assertDatabaseCount('tasks', 0);

        $errors = $response->json('errors');
        $this->assertEquals('DeviceDown', $errors[0]['alertname']);
        $this->assertEquals('99999', $errors[0]['device_id']);
        $this->assertEquals('Device not found in database', $errors[0]['reason']);
    }

    // ==================== ALERTMANAGER MIXED BATCH TESTS ====================

    /** @test */
    public function alertmanager_webhook_handles_mixed_batch_with_firing_resolved_and_error()
    {
        Notification::fake();

        $device2 = Device::factory()->create(['hostname' => 'test-router-02']);

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                // Alert 1: Firing (should create task)
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => ['description' => 'Device 1 is down'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
                // Alert 2: Resolved (should skip, no task)
                [
                    'status' => 'resolved',
                    'labels' => [
                        'alertname' => 'HighResponseTime',
                        'device_id' => (string) $device2->id,
                        'severity' => 'warning',
                        'hostname' => 'test-router-02',
                    ],
                    'annotations' => ['description' => 'Device 2 response time recovered'],
                    'startsAt' => '2026-07-30T09:00:00Z',
                    'endsAt' => '2026-07-30T09:30:00Z',
                    'fingerprint' => 'def456',
                ],
                // Alert 3: Error - device not found (should skip, log error)
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => '99999',  // Does not exist
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Device 3 is down'],
                    'startsAt' => '2026-07-30T10:05:00Z',
                    'fingerprint' => 'ghi789',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'processed' => 1,           // Only firing alert with valid device
                'skipped_resolved' => 1,    // Resolved alert
                'skipped_errors' => 1,      // Device not found
                'message' => 'Webhook processed with errors',
            ])
            ->assertJsonStructure(['task_ids', 'resolved', 'errors'])
            ->assertJsonCount(1, 'task_ids')
            ->assertJsonCount(1, 'resolved')
            ->assertJsonCount(1, 'errors');

        // Verify only 1 task created (for firing alert with valid device)
        $this->assertDatabaseCount('tasks', 1);
        $task = Task::first();
        $this->assertEquals('Device Down - test-switch-01', $task->name);

        // Verify resolved array
        $resolved = $response->json('resolved');
        $this->assertEquals('HighResponseTime', $resolved[0]['alertname']);
        $this->assertEquals((string) $device2->id, $resolved[0]['device_id']);

        // Verify errors array
        $errors = $response->json('errors');
        $this->assertEquals('DeviceDown', $errors[0]['alertname']);
        $this->assertEquals('99999', $errors[0]['device_id']);
        $this->assertEquals('Device not found in database', $errors[0]['reason']);
    }

    /** @test */
    public function alertmanager_webhook_message_priority_logic_is_correct()
    {
        Notification::fake();

        // Case 1: processed > 0 && skipped_errors > 0
        $payload1 = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                ['status' => 'firing', 'labels' => ['alertname' => 'Test', 'device_id' => (string) $this->testDevice->id, 'severity' => 'critical'], 'annotations' => ['description' => 'test'], 'startsAt' => '2026-07-30T10:00:00Z'],
                ['status' => 'firing', 'labels' => ['alertname' => 'Test', 'device_id' => '99999', 'severity' => 'critical'], 'annotations' => ['description' => 'test'], 'startsAt' => '2026-07-30T10:00:00Z'],
            ],
        ];
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload1);
        $response1->assertJson(['message' => 'Webhook processed with errors']);
        Task::truncate();

        // Case 2: processed > 0 (no errors)
        $payload2 = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                ['status' => 'firing', 'labels' => ['alertname' => 'Test', 'device_id' => (string) $this->testDevice->id, 'severity' => 'critical'], 'annotations' => ['description' => 'test'], 'startsAt' => '2026-07-30T10:00:00Z'],
            ],
        ];
        $response2 = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload2);
        $response2->assertJson(['message' => 'Webhook processed successfully']);
        Task::truncate();

        // Case 3: skipped_errors > 0 (no processed)
        $payload3 = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                ['status' => 'firing', 'labels' => ['alertname' => 'Test', 'device_id' => '99999', 'severity' => 'critical'], 'annotations' => ['description' => 'test'], 'startsAt' => '2026-07-30T10:00:00Z'],
            ],
        ];
        $response3 = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload3);
        $response3->assertJson(['message' => 'Webhook received but no valid alerts could be processed']);

        // Case 4: skipped_resolved > 0 (no processed, no errors)
        $payload4 = [
            'version' => '4',
            'status' => 'resolved',
            'alerts' => [
                ['status' => 'resolved', 'labels' => ['alertname' => 'Test', 'device_id' => (string) $this->testDevice->id, 'severity' => 'critical'], 'annotations' => ['description' => 'test'], 'startsAt' => '2026-07-30T10:00:00Z', 'endsAt' => '2026-07-30T10:15:00Z'],
            ],
        ];
        $response4 = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload4);
        $response4->assertJson(['message' => 'Webhook received - all alerts already resolved']);
    }

    // ==================== PASCALCASE CONVERSION TESTS ====================

    /** @test */
    public function alertmanager_converts_pascalcase_alertname_to_snake_case_for_task_name()
    {
        Notification::fake();

        $testCases = [
            ['alertname' => 'DeviceDown', 'expected_snake_case' => 'device_down', 'expected_task_name' => 'Device Down - test-switch-01'],
            ['alertname' => 'HighResponseTime', 'expected_snake_case' => 'high_response_time', 'expected_task_name' => 'High Response Time - test-switch-01'],
        ];

        foreach ($testCases as $testCase) {
            $payload = [
                'version' => '4',
                'status' => 'firing',
                'alerts' => [
                    [
                        'status' => 'firing',
                        'labels' => [
                            'alertname' => $testCase['alertname'],
                            'device_id' => (string) $this->testDevice->id,
                            'severity' => 'warning',
                        ],
                        'annotations' => ['description' => 'Test alert'],
                        'startsAt' => '2026-07-30T10:00:00Z',
                        'fingerprint' => 'test123',
                    ],
                ],
            ];

            $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
                ->postJson('/api/internal/device-events', $payload);

            $task = Task::latest()->first();
            $this->assertEquals($testCase['expected_task_name'], $task->name, 
                "PascalCase '{$testCase['alertname']}' should convert to snake_case '{$testCase['expected_snake_case']}' and humanize to '{$testCase['expected_task_name']}'");

            Task::truncate();
        }
    }

    /** @test */
    public function alertmanager_task_description_includes_alert_metadata()
    {
        Notification::fake();

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                        'hostname' => 'test-switch-01',
                    ],
                    'annotations' => [
                        'description' => 'Device test-switch-01 (ID: ' . $this->testDevice->id . ') has been unreachable for more than 5 minutes.',
                    ],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'endsAt' => '2026-07-30T10:15:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $task = Task::first();

        // Verify alert metadata is included in task description
        $this->assertStringContainsString('Device test-switch-01', $task->description);
        $this->assertStringContainsString('has been unreachable for more than 5 minutes', $task->description);
        $this->assertStringContainsString('**Alert Status:** Firing', $task->description);
        $this->assertStringContainsString('**Alert Started:** 2026-07-30T10:00:00Z', $task->description);
    }

    /** @test */
    public function alertmanager_notifies_admins_for_critical_alerts()
    {
        Notification::fake();

        $admin2 = User::factory()->create(['role' => User::ROLE_ADMIN, 'is_active' => true]);

        $payload = [
            'version' => '4',
            'status' => 'firing',
            'alerts' => [
                [
                    'status' => 'firing',
                    'labels' => [
                        'alertname' => 'DeviceDown',
                        'device_id' => (string) $this->testDevice->id,
                        'severity' => 'critical',
                    ],
                    'annotations' => ['description' => 'Critical alert'],
                    'startsAt' => '2026-07-30T10:00:00Z',
                    'fingerprint' => 'abc123',
                ],
            ],
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        // All admins should be notified for critical alerts
        Notification::assertSentTo(
            [$this->adminUser, $admin2],
            \App\Notifications\GeneralNotification::class
        );
    }
}
