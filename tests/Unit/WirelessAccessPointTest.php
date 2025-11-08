<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\WirelessAccessPoint;
use App\Models\Device;
use App\Models\Site;
use App\Models\Rack;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class WirelessAccessPointTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function wap_has_device_relationship()
    {
        $device = Device::factory()->create();
        $wap = WirelessAccessPoint::factory()->create(['device_id' => $device->id]);

        $this->assertInstanceOf(Device::class, $wap->device);
        $this->assertEquals($device->id, $wap->device->id);
    }

    #[Test]
    public function wap_has_site_relationship()
    {
        $site = Site::factory()->create();
        $wap = WirelessAccessPoint::factory()->create(['site_id' => $site->id]);

        $this->assertInstanceOf(Site::class, $wap->site);
        $this->assertEquals($site->id, $wap->site->id);
    }

    #[Test]
    public function wap_has_rack_relationship()
    {
        $rack = Rack::factory()->create();
        $wap = WirelessAccessPoint::factory()->create(['rack_id' => $rack->id]);

        $this->assertInstanceOf(Rack::class, $wap->rack);
        $this->assertEquals($rack->id, $wap->rack->id);
    }

    #[Test]
    public function wap_can_be_created_with_minimal_data()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);
    }

    #[Test]
    public function wap_supports_soft_deletes()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $wap->delete();

        $this->assertSoftDeleted('wireless_access_points', ['id' => $wap->id]);
        $this->assertDatabaseHas('wireless_access_points', ['id' => $wap->id]);
    }

    #[Test]
    public function by_status_scope_filters_correctly()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'status' => 'inactive']);
        WirelessAccessPoint::create(['ssid' => 'WAP3', 'status' => 'active']);

        $activeWaps = WirelessAccessPoint::byStatus('active')->get();
        $inactiveWaps = WirelessAccessPoint::byStatus('inactive')->get();

        $this->assertEquals(2, $activeWaps->count());
        $this->assertEquals(1, $inactiveWaps->count());
        $this->assertTrue($activeWaps->every(fn($wap) => $wap->status === 'active'));
        $this->assertTrue($inactiveWaps->every(fn($wap) => $wap->status === 'inactive'));
    }

    #[Test]
    public function by_site_scope_filters_correctly()
    {
        $site1 = Site::factory()->create();
        $site2 = Site::factory()->create();

        WirelessAccessPoint::create(['ssid' => 'WAP1', 'site_id' => $site1->id]);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'site_id' => $site2->id]);
        WirelessAccessPoint::create(['ssid' => 'WAP3', 'site_id' => $site1->id]);

        $site1Waps = WirelessAccessPoint::bySite($site1->id)->get();
        $site2Waps = WirelessAccessPoint::bySite($site2->id)->get();

        $this->assertEquals(2, $site1Waps->count());
        $this->assertEquals(1, $site2Waps->count());
        $this->assertTrue($site1Waps->every(fn($wap) => $wap->site_id === $site1->id));
        $this->assertTrue($site2Waps->every(fn($wap) => $wap->site_id === $site2->id));
    }

    #[Test]
    public function by_device_scope_filters_correctly()
    {
        $device1 = Device::factory()->create();
        $device2 = Device::factory()->create();

        WirelessAccessPoint::create(['ssid' => 'WAP1', 'device_id' => $device1->id]);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'device_id' => $device2->id]);
        WirelessAccessPoint::create(['ssid' => 'WAP3', 'device_id' => $device1->id]);

        $device1Waps = WirelessAccessPoint::byDevice($device1->id)->get();
        $device2Waps = WirelessAccessPoint::byDevice($device2->id)->get();

        $this->assertEquals(2, $device1Waps->count());
        $this->assertEquals(1, $device2Waps->count());
        $this->assertTrue($device1Waps->every(fn($wap) => $wap->device_id === $device1->id));
        $this->assertTrue($device2Waps->every(fn($wap) => $wap->device_id === $device2->id));
    }

    #[Test]
    public function search_scope_finds_by_ssid()
    {
        WirelessAccessPoint::create(['ssid' => 'OfficeWAP', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'GuestWAP', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'AdminWAP', 'status' => 'active']);

        $results = WirelessAccessPoint::search('Office')->get();

        $this->assertEquals(1, $results->count());
        $this->assertEquals('OfficeWAP', $results->first()->ssid);
    }

    #[Test]
    public function search_scope_finds_by_description()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'description' => 'Office area access point', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'description' => 'Guest area access point', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP3', 'description' => 'Admin area access point', 'status' => 'active']);

        $results = WirelessAccessPoint::search('Office')->get();

        $this->assertEquals(1, $results->count());
        $this->assertEquals('WAP1', $results->first()->ssid);
    }

    #[Test]
    public function search_scope_finds_by_mac_address()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'mac_address' => '00:11:22:33:44:55', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'mac_address' => 'AA:BB:CC:DD:EE:FF', 'status' => 'active']);

        $results = WirelessAccessPoint::search('00:11:22')->get();

        $this->assertEquals(1, $results->count());
        $this->assertEquals('WAP1', $results->first()->ssid);
    }

    #[Test]
    public function search_scope_finds_by_ip_address()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'ip_address' => '192.168.1.100', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'ip_address' => '192.168.2.100', 'status' => 'active']);

        $results = WirelessAccessPoint::search('192.168.1')->get();

        $this->assertEquals(1, $results->count());
        $this->assertEquals('WAP1', $results->first()->ssid);
    }

    #[Test]
    public function search_scope_is_case_insensitive()
    {
        WirelessAccessPoint::create(['ssid' => 'OfficeWAP', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'GuestWAP', 'status' => 'active']);

        $results = WirelessAccessPoint::search('office')->get();

        $this->assertEquals(1, $results->count());
        $this->assertEquals('OfficeWAP', $results->first()->ssid);
    }

    #[Test]
    public function search_scope_returns_empty_for_no_matches()
    {
        WirelessAccessPoint::create(['ssid' => 'OfficeWAP', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'GuestWAP', 'status' => 'active']);

        $results = WirelessAccessPoint::search('NonExistent')->get();

        $this->assertEquals(0, $results->count());
    }

    #[Test]
    public function wap_factory_creates_valid_data()
    {
        $wap = WirelessAccessPoint::factory()->create();

        $this->assertNotEmpty($wap->ssid);
        $this->assertNotEmpty($wap->mac_address);
        $this->assertNotEmpty($wap->ip_address);
        $this->assertContains($wap->status, ['active', 'inactive', 'maintenance']);
    }

    #[Test]
    public function wap_factory_states_work_correctly()
    {
        $activeWap = WirelessAccessPoint::factory()->active()->create();
        $inactiveWap = WirelessAccessPoint::factory()->inactive()->create();
        $maintenanceWap = WirelessAccessPoint::factory()->maintenance()->create();

        $this->assertEquals('active', $activeWap->status);
        $this->assertEquals('inactive', $inactiveWap->status);
        $this->assertEquals('maintenance', $maintenanceWap->status);
    }

    #[Test]
    public function wap_factory_without_relationships_works()
    {
        $wap = WirelessAccessPoint::factory()
            ->withoutDevice()
            ->withoutSite()
            ->withoutRack()
            ->create();

        $this->assertNull($wap->device_id);
        $this->assertNull($wap->site_id);
        $this->assertNull($wap->rack_id);
    }
} 