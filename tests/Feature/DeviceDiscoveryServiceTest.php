<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Device;
use App\Services\DeviceDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DeviceDiscoveryServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_icmp_only_logic_for_existing_devices()
    {
        $device = Device::factory()->create([
            'ip_address' => '127.0.0.1',
        ]);
        $service = new DeviceDiscoveryService();
        $result = $service->scanExistingDevice($device);
        $this->assertArrayHasKey('status', $result);
        $this->assertArrayHasKey('method', $result);
        $this->assertArrayHasKey('message', $result);
        $this->assertArrayHasKey('icmp_result', $result);
        $this->assertArrayNotHasKey('snmp_result', $result);
    }
} 