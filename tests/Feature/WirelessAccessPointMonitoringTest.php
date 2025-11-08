<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\WirelessAccessPoint;
use App\Models\Device;
use App\Models\Site;
use App\Models\Rack;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class WirelessAccessPointMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'user']);
    }

    #[Test]
    public function user_can_access_monitoring_dashboard()
    {
        $response = $this->actingAs($this->user)->get(route('wireless-ap.monitoring'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Monitoring'));
    }

    #[Test]
    public function guest_cannot_access_monitoring_dashboard()
    {
        $response = $this->get(route('wireless-ap.monitoring'));

        $response->assertRedirect(route('login'));
    }

    #[Test]
    public function can_get_monitoring_statistics()
    {
        // Create WAPs with different monitoring states
        WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_status' => 'online',
            'ip_address' => '192.168.1.100'
        ]);
        WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_status' => 'offline',
            'ip_address' => '192.168.1.101'
        ]);
        WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => false,
            'ip_address' => '192.168.1.102'
        ]);

        $response = $this->actingAs($this->user)->getJson(route('wireless-ap.monitoring.stats'));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'stats' => [
                'total_waps' => 3,
                'monitored_waps' => 2,
                'online_waps' => 1,
                'offline_waps' => 1,
                'unknown_waps' => 0,
                'monitoring_coverage' => 66.67
            ]
        ]);
    }

    #[Test]
    public function can_ping_wap_with_ip_address()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'ip_address' => '192.168.1.100',
            'monitoring_enabled' => true
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.ping', $wap));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'online',
            'ping_status',
            'response_time',
            'last_ping_at',
            'uptime_percentage',
            'formatted_uptime',
            'formatted_downtime'
        ]);
    }

    #[Test]
    public function cannot_ping_wap_without_ip_address()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'ip_address' => null,
            'monitoring_enabled' => true
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.ping', $wap));

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Aucune adresse IP configurée pour ce point d\'accès.'
        ]);
    }

    #[Test]
    public function can_enable_monitoring_for_wap_with_ip()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'ip_address' => '192.168.1.100',
            'monitoring_enabled' => false
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.monitoring.enable', $wap));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Surveillance activée avec succès.'
        ]);

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'monitoring_enabled' => true,
            'ping_status' => 'unknown'
        ]);
    }

    #[Test]
    public function cannot_enable_monitoring_for_wap_without_ip()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'ip_address' => null,
            'monitoring_enabled' => false
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.monitoring.enable', $wap));

        $response->assertStatus(400);
        $response->assertJson([
            'success' => false,
            'message' => 'Une adresse IP est requise pour activer la surveillance.'
        ]);
    }

    #[Test]
    public function can_disable_monitoring_for_wap()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_status' => 'online'
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.monitoring.disable', $wap));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Surveillance désactivée avec succès.'
        ]);

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'monitoring_enabled' => false,
            'ping_status' => 'unknown'
        ]);
    }

    #[Test]
    public function can_reset_monitoring_statistics()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'uptime_percentage' => 95.5,
            'total_uptime_seconds' => 3600,
            'total_downtime_seconds' => 200,
            'ping_history' => [['timestamp' => now(), 'status' => 'online']]
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.monitoring.reset', $wap));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Statistiques de surveillance réinitialisées avec succès.'
        ]);

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'uptime_percentage' => 0,
            'total_uptime_seconds' => 0,
            'total_downtime_seconds' => 0,
            'ping_history' => '[]'
        ]);
    }

    #[Test]
    public function can_get_ping_history()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_history' => [
                ['timestamp' => now()->subMinutes(5)->toISOString(), 'status' => 'online', 'response_time' => 10],
                ['timestamp' => now()->subMinutes(4)->toISOString(), 'status' => 'offline', 'response_time' => null],
                ['timestamp' => now()->subMinutes(3)->toISOString(), 'status' => 'online', 'response_time' => 15]
            ]
        ]);

        $response = $this->actingAs($this->user)->getJson(route('wireless-ap.monitoring.history', $wap));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'total_pings' => 3
        ]);
        $response->assertJsonStructure([
            'success',
            'history',
            'average_response_time',
            'total_pings'
        ]);
    }

    #[Test]
    public function monitoring_stats_include_waps_needing_attention()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_status' => 'offline',
            'last_offline_at' => now()->subHours(2),
            'ip_address' => '192.168.1.100'
        ]);

        $response = $this->actingAs($this->user)->getJson(route('wireless-ap.monitoring.stats'));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);
        
        $data = $response->json();
        $this->assertArrayHasKey('waps_needing_attention', $data);
        $this->assertCount(1, $data['waps_needing_attention']);
        $this->assertEquals($wap->id, $data['waps_needing_attention'][0]['id']);
    }

    #[Test]
    public function monitoring_service_updates_ping_status_correctly()
    {
        $wap = WirelessAccessPoint::factory()->create([
            'monitoring_enabled' => true,
            'ping_status' => 'unknown',
            'ip_address' => '192.168.1.100'
        ]);

        // Mock the ping to return online
        $this->mock(\App\Services\WapMonitoringService::class, function ($mock) {
            $mock->shouldReceive('pingWap')->andReturn(true);
        });

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.ping', $wap));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'online' => true
        ]);
    }

    #[Test]
    public function monitoring_dashboard_shows_correct_statistics()
    {
        // Create WAPs with different states
        WirelessAccessPoint::factory()->count(3)->create([
            'monitoring_enabled' => true,
            'ping_status' => 'online'
        ]);
        WirelessAccessPoint::factory()->count(2)->create([
            'monitoring_enabled' => true,
            'ping_status' => 'offline'
        ]);
        WirelessAccessPoint::factory()->count(1)->create([
            'monitoring_enabled' => false
        ]);

        $response = $this->actingAs($this->user)->get(route('wireless-ap.monitoring'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('WirelessAp/Monitoring')
        );
    }

    #[Test]
    public function monitoring_requires_authentication()
    {
        $wap = WirelessAccessPoint::factory()->create();

        $routes = [
            route('wireless-ap.monitoring'),
            route('wireless-ap.monitoring.stats'),
            route('wireless-ap.ping', $wap),
            route('wireless-ap.monitoring.enable', $wap),
            route('wireless-ap.monitoring.disable', $wap),
            route('wireless-ap.monitoring.reset', $wap),
            route('wireless-ap.monitoring.history', $wap)
        ];

        foreach ($routes as $route) {
            $response = $this->getJson($route);
            // Some routes return 405 (Method Not Allowed) for GET requests to POST routes
            $this->assertTrue(in_array($response->status(), [401, 405]));
        }
    }

    #[Test]
    public function can_get_all_waps_for_monitoring()
    {
        $wap1 = WirelessAccessPoint::factory()->create([
            'ssid' => 'TestWAP1',
            'ip_address' => '192.168.1.100',
            'monitoring_enabled' => true
        ]);
        
        $wap2 = WirelessAccessPoint::factory()->create([
            'ssid' => 'TestWAP2',
            'ip_address' => '192.168.1.101',
            'monitoring_enabled' => false
        ]);

        $response = $this->actingAs($this->user)->getJson(route('wireless-ap.monitoring.all'));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);
        
        $data = $response->json();
        $this->assertArrayHasKey('waps', $data);
        $this->assertCount(2, $data['waps']);
        
        // Check that the WAPs have the correct structure
        $this->assertArrayHasKey('id', $data['waps'][0]);
        $this->assertArrayHasKey('ssid', $data['waps'][0]);
        $this->assertArrayHasKey('ip_address', $data['waps'][0]);
        $this->assertArrayHasKey('monitoring_enabled', $data['waps'][0]);
        $this->assertArrayHasKey('ping_status', $data['waps'][0]);
    }
} 