<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Device;
use App\Models\User;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

class DeviceEventApiTest extends TestCase
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
            'hostname' => 'test-router-01',
            'ip_address' => '192.168.1.1',
            'is_alive' => true,
        ]);
    }

    /** @test */
    public function it_creates_task_and_notification_with_valid_token()
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
            ->assertJsonStructure([
                'success',
                'task_id',
                'message'
            ]);

        // Verify task was created
        $this->assertDatabaseHas('tasks', [
            'name' => 'Link Down - test-router-01',
            'assigned_user_id' => $this->adminUser->id,
            'priority' => 'high',
            'status' => 'pending',
        ]);

        $task = Task::where('assigned_user_id', $this->adminUser->id)->first();
        $this->assertNotNull($task);
        $this->assertStringContainsString('192.168.1.1', $task->description);
        $this->assertStringContainsString('Interface GigabitEthernet0/1 down', $task->description);

        // Verify notification was sent
        Notification::assertSentTo(
            $this->adminUser,
            \App\Notifications\GeneralNotification::class
        );
    }

    /** @test */
    public function it_returns_401_when_token_is_missing()
    {
        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Test message',
        ];

        $response = $this->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(401)
            ->assertJson([
                'error' => 'Missing or invalid authorization header'
            ]);

        // Verify no task was created
        $this->assertDatabaseCount('tasks', 0);
    }

    /** @test */
    public function it_returns_401_when_token_is_invalid()
    {
        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Test message',
        ];

        $response = $this->withHeader('Authorization', 'Bearer wrong-token')
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(401)
            ->assertJson([
                'error' => 'Invalid API token'
            ]);

        // Verify no task was created
        $this->assertDatabaseCount('tasks', 0);
    }

    /** @test */
    public function it_returns_401_when_authorization_header_format_is_wrong()
    {
        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Test message',
        ];

        // Missing "Bearer " prefix
        $response = $this->withHeader('Authorization', $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(401)
            ->assertJson([
                'error' => 'Missing or invalid authorization header'
            ]);
    }

    /** @test */
    public function it_returns_422_when_device_id_is_missing()
    {
        $payload = [
            // device_id missing
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Test message',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_id']);
    }

    /** @test */
    public function it_returns_422_when_device_id_does_not_exist()
    {
        $payload = [
            'device_id' => 99999, // Non-existent device
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Test message',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_id']);
    }

    /** @test */
    public function it_returns_422_when_severity_is_invalid()
    {
        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'invalid-severity', // Invalid value
            'message' => 'Test message',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['severity']);
    }

    /** @test */
    public function it_returns_422_when_required_fields_are_missing()
    {
        $payload = []; // All fields missing

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_id', 'event_type', 'severity', 'message']);
    }

    /** @test */
    public function it_maps_severity_to_correct_priority()
    {
        Notification::fake();

        // Test critical -> high
        $this->postDeviceEvent('critical');
        $this->assertDatabaseHas('tasks', ['priority' => 'high']);
        Task::truncate();

        // Test warning -> medium
        $this->postDeviceEvent('warning');
        $this->assertDatabaseHas('tasks', ['priority' => 'medium']);
        Task::truncate();

        // Test info -> low
        $this->postDeviceEvent('info');
        $this->assertDatabaseHas('tasks', ['priority' => 'low']);
    }

    /** @test */
    public function it_notifies_all_admins_for_critical_events()
    {
        Notification::fake();

        // Create additional admin users
        $admin2 = User::factory()->create(['role' => User::ROLE_ADMIN, 'is_active' => true]);
        $admin3 = User::factory()->create(['role' => User::ROLE_ADMIN, 'is_active' => true]);
        $regularUser = User::factory()->create(['role' => User::ROLE_USER, 'is_active' => true]);

        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'link_down',
            'severity' => 'critical',
            'message' => 'Critical event',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        // All admins should be notified
        Notification::assertSentTo(
            [$this->adminUser, $admin2, $admin3],
            \App\Notifications\GeneralNotification::class
        );

        // Regular user should NOT be notified
        Notification::assertNotSentTo(
            $regularUser,
            \App\Notifications\GeneralNotification::class
        );
    }

    /** @test */
    public function it_only_notifies_assigned_user_for_non_critical_events()
    {
        Notification::fake();

        // Create additional admin users
        $admin2 = User::factory()->create(['role' => User::ROLE_ADMIN, 'is_active' => true]);

        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'config_change',
            'severity' => 'info',
            'message' => 'Configuration changed',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);

        // Only assigned user (first admin) should be notified
        Notification::assertSentTo(
            $this->adminUser,
            \App\Notifications\GeneralNotification::class
        );

        // Other admins should NOT be notified for non-critical
        Notification::assertNotSentTo(
            $admin2,
            \App\Notifications\GeneralNotification::class
        );
    }

    /** @test */
    public function it_includes_device_details_in_task_description()
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
        
        $this->assertStringContainsString('test-router-01', $task->description);
        $this->assertStringContainsString('192.168.1.1', $task->description);
        $this->assertStringContainsString('Device Reboot', $task->description);
        $this->assertStringContainsString('Warning', $task->description);
        $this->assertStringContainsString('Device rebooted unexpectedly', $task->description);
    }

    /** @test */
    public function task_service_creates_task_with_correct_due_dates()
    {
        $taskService = new TaskService();

        // Critical = 4 hours
        $task1 = $taskService->createFromDeviceEvent(
            $this->testDevice,
            'link_down',
            'critical',
            'Test'
        );
        $this->assertTrue($task1->due_date->between(now()->addHours(3)->addMinutes(59), now()->addHours(4)->addMinute()));

        // Warning = 24 hours
        $task2 = $taskService->createFromDeviceEvent(
            $this->testDevice,
            'link_down',
            'warning',
            'Test'
        );
        $this->assertTrue($task2->due_date->between(now()->addHours(23)->addMinutes(59), now()->addHours(24)->addMinute()));

        // Info = 72 hours
        $task3 = $taskService->createFromDeviceEvent(
            $this->testDevice,
            'link_down',
            'info',
            'Test'
        );
        $this->assertTrue($task3->due_date->between(now()->addHours(71)->addMinutes(59), now()->addHours(72)->addMinute()));
    }

    /**
     * Helper method to post a device event with given severity.
     */
    protected function postDeviceEvent(string $severity): void
    {
        $payload = [
            'device_id' => $this->testDevice->id,
            'event_type' => 'test_event',
            'severity' => $severity,
            'message' => 'Test message',
        ];

        $this->withHeader('Authorization', 'Bearer ' . $this->validToken)
            ->postJson('/api/internal/device-events', $payload);
    }
}
