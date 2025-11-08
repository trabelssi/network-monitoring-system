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

class WirelessAccessPointTest extends TestCase
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
    public function admin_can_view_wap_index()
    {
        $response = $this->actingAs($this->admin)->get(route('wireless-ap.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Index'));
    }

    #[Test]
    public function user_can_view_wap_index()
    {
        $response = $this->actingAs($this->user)->get(route('wireless-ap.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Index'));
    }

    #[Test]
    public function guest_cannot_view_wap_index()
    {
        $response = $this->get(route('wireless-ap.index'));

        $response->assertRedirect(route('login'));
    }

    #[Test]
    public function admin_can_view_wap_create_form()
    {
        $response = $this->actingAs($this->admin)->get(route('wireless-ap.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Create'));
    }

    #[Test]
    public function user_can_view_wap_create_form()
    {
        $response = $this->actingAs($this->user)->get(route('wireless-ap.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Create'));
    }

    #[Test]
    public function admin_can_create_wap()
    {
        $wapData = [
            'ssid' => 'TestWAP',
            'mac_address' => '00:11:22:33:44:55',
            'ip_address' => '192.168.1.100',
            'status' => 'active',
            'description' => 'Test WAP description'
        ];

        $response = $this->actingAs($this->admin)->post(route('wireless-ap.store'), $wapData);

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('wireless_access_points', [
            'ssid' => 'TestWAP',
            'mac_address' => '00:11:22:33:44:55',
            'ip_address' => '192.168.1.100'
        ]);
    }

    #[Test]
    public function user_can_create_wap()
    {
        $wapData = [
            'ssid' => 'UserWAP',
            'mac_address' => 'AA:BB:CC:DD:EE:FF',
            'ip_address' => '192.168.1.101',
            'status' => 'active',
            'description' => 'User created WAP'
        ];

        $response = $this->actingAs($this->user)->post(route('wireless-ap.store'), $wapData);

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('wireless_access_points', [
            'ssid' => 'UserWAP',
            'mac_address' => 'AA:BB:CC:DD:EE:FF'
        ]);
    }

    #[Test]
    public function wap_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->admin)->post(route('wireless-ap.store'), []);

        $response->assertSessionHasErrors(['ssid']);
    }

    #[Test]
    public function wap_creation_validates_unique_ssid()
    {
        WirelessAccessPoint::create([
            'ssid' => 'ExistingWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)->post(route('wireless-ap.store'), [
            'ssid' => 'ExistingWAP',
            'status' => 'active'
        ]);

        $response->assertSessionHasErrors(['ssid']);
    }

    #[Test]
    public function wap_creation_validates_mac_address_format()
    {
        $response = $this->actingAs($this->admin)->post(route('wireless-ap.store'), [
            'ssid' => 'TestWAP',
            'mac_address' => 'invalid-mac',
            'status' => 'active'
        ]);

        $response->assertSessionHasErrors(['mac_address']);
    }

    #[Test]
    public function wap_creation_validates_ip_address_format()
    {
        $response = $this->actingAs($this->admin)->post(route('wireless-ap.store'), [
            'ssid' => 'TestWAP',
            'ip_address' => 'invalid-ip',
            'status' => 'active'
        ]);

        $response->assertSessionHasErrors(['ip_address']);
    }

    #[Test]
    public function admin_can_view_wap_edit_form()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)->get(route('wireless-ap.edit', $wap));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Edit'));
    }

    #[Test]
    public function user_can_view_wap_edit_form()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)->get(route('wireless-ap.edit', $wap));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Edit'));
    }

    #[Test]
    public function admin_can_update_wap()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'OldSSID',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)->put(route('wireless-ap.update', $wap), [
            'ssid' => 'UpdatedSSID',
            'status' => 'inactive',
            'description' => 'Updated description'
        ]);

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'ssid' => 'UpdatedSSID',
            'status' => 'inactive'
        ]);
    }

    #[Test]
    public function user_can_update_wap()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)->put(route('wireless-ap.update', $wap), [
            'ssid' => 'UserUpdatedSSID',
            'status' => 'active'
        ]);

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('wireless_access_points', [
            'id' => $wap->id,
            'ssid' => 'UserUpdatedSSID'
        ]);
    }

    #[Test]
    public function admin_can_view_wap_details()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)->get(route('wireless-ap.show', $wap));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Show'));
    }

    #[Test]
    public function user_can_view_wap_details()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)->get(route('wireless-ap.show', $wap));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('WirelessAp/Show'));
    }

    #[Test]
    public function admin_can_delete_wap()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)->delete(route('wireless-ap.destroy', $wap));

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('wireless_access_points', ['id' => $wap->id]);
    }

    #[Test]
    public function user_cannot_delete_wap()
    {
        $wap = WirelessAccessPoint::create([
            'ssid' => 'TestWAP',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)->delete(route('wireless-ap.destroy', $wap));

        $response->assertRedirect(route('wireless-ap.index'));
        $response->assertSessionHas('error');
    }

    #[Test]
    public function admin_can_bulk_delete_waps()
    {
        $waps = collect([
            WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']),
            WirelessAccessPoint::create(['ssid' => 'WAP2', 'status' => 'active']),
            WirelessAccessPoint::create(['ssid' => 'WAP3', 'status' => 'active'])
        ]);

        $response = $this->actingAs($this->admin)->postJson(route('wireless-ap.bulk-destroy'), [
            'ids' => $waps->pluck('id')->toArray()
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        foreach ($waps as $wap) {
            $this->assertSoftDeleted('wireless_access_points', ['id' => $wap->id]);
        }
    }

    #[Test]
    public function user_cannot_bulk_delete_waps()
    {
        $waps = collect([
            WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']),
            WirelessAccessPoint::create(['ssid' => 'WAP2', 'status' => 'active'])
        ]);

        $response = $this->actingAs($this->user)->postJson(route('wireless-ap.bulk-destroy'), [
            'ids' => $waps->pluck('id')->toArray()
        ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function admin_can_export_waps()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'status' => 'active']);

        $response = $this->actingAs($this->admin)->get(route('wireless-ap.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition');
    }

    #[Test]
    public function user_can_export_waps()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']);

        $response = $this->actingAs($this->user)->get(route('wireless-ap.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition');
    }

    #[Test]
    public function wap_index_supports_search()
    {
        WirelessAccessPoint::create(['ssid' => 'SearchableWAP', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'OtherWAP', 'status' => 'active']);

        $response = $this->actingAs($this->admin)->get(route('wireless-ap.index', ['search' => 'Searchable']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('WirelessAp/Index')
        );
    }

    #[Test]
    public function wap_index_supports_status_filter()
    {
        WirelessAccessPoint::create(['ssid' => 'WAP1', 'status' => 'active']);
        WirelessAccessPoint::create(['ssid' => 'WAP2', 'status' => 'inactive']);

        $response = $this->actingAs($this->admin)->get(route('wireless-ap.index', ['status' => 'active']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('WirelessAp/Index')
        );
    }
} 