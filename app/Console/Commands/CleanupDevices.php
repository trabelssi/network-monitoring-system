<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\DeviceDiscovery;
use App\Models\DeviceSnmpSetting;
use App\Models\DeviceIcmpSetting;
use App\Models\DeviceSnmpDetail;
use App\Models\DeviceInterface;
use App\Models\DeviceNeighbour;

class CleanupDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:cleanup {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up all devices and keep only the 5 seeded devices';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $totalDevices = Device::count();
        $this->info("Current total devices: {$totalDevices}");

        if (!$this->option('force')) {
            if (!$this->confirm('This will delete ALL devices and related data. Are you sure?')) {
                $this->info('Operation cancelled.');
                return;
            }
        }

        $this->info('Starting cleanup...');

        // Delete all related data first
        $this->info('Deleting device discoveries...');
        DeviceDiscovery::truncate();

        $this->info('Deleting device SNMP settings...');
        DeviceSnmpSetting::truncate();

        $this->info('Deleting device ICMP settings...');
        DeviceIcmpSetting::truncate();

        $this->info('Deleting device SNMP details...');
        DeviceSnmpDetail::truncate();

        $this->info('Deleting device interfaces...');
        DeviceInterface::truncate();

        $this->info('Deleting device neighbours...');
        DeviceNeighbour::truncate();

        // Delete all devices
        $this->info('Deleting all devices...');
        Device::truncate();

        $this->info('Cleanup completed!');

        // Reseed with only the 5 devices
        $this->info('Reseeding with 5 devices...');
        $this->call('db:seed', ['--class' => 'DeviceSeeder']);

        $newTotal = Device::count();
        $this->info("New total devices: {$newTotal}");

        $this->info('✅ Cleanup and reseed completed successfully!');
    }
}
