<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\PingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PingDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:ping {--device-id= : Ping specific device by ID} {--all : Ping all devices} {--cleanup : Clean up old history records}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ping devices and update their status, recording changes in history';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $pingService = new PingService();
        
        if ($this->option('cleanup')) {
            $deletedCount = $pingService->cleanupOldHistory(90); // Keep 90 days
            $this->info("Cleaned up {$deletedCount} old history records");
            return 0;
        }

        if ($deviceId = $this->option('device-id')) {
            $device = Device::find($deviceId);
            if (!$device) {
                $this->error("Device with ID {$deviceId} not found");
                return 1;
            }

            $this->info("Pinging device: {$device->hostname} ({$device->ip_address})");
            $result = $pingService->pingDevice($device);
            
            if ($result['status_changed']) {
                $this->info("Status changed from {$result['old_status']} to {$result['new_status']}");
            } else {
                $this->info("Status remains {$result['new_status']}");
            }
            
            return 0;
        }

        if ($this->option('all')) {
            $this->info("Starting to ping all devices...");
            
            $devices = Device::all();
            $totalDevices = $devices->count();
            $this->info("Found {$totalDevices} devices to ping");
            
            $bar = $this->output->createProgressBar($totalDevices);
            $bar->start();
            
            $results = $pingService->pingMultipleDevices();
            
            $statusChanges = 0;
            $errors = 0;
            
            foreach ($results as $result) {
                if (isset($result['error'])) {
                    $errors++;
                } elseif ($result['status_changed']) {
                    $statusChanges++;
                }
                $bar->advance();
            }
            
            $bar->finish();
            $this->newLine();
            
            $this->info("Ping completed:");
            $this->info("- Total devices: {$totalDevices}");
            $this->info("- Status changes: {$statusChanges}");
            $this->info("- Errors: {$errors}");
            
            return 0;
        }

        // Default: ping devices that haven't been pinged recently
        $this->info("Pinging devices that haven't been pinged recently...");
        
        $devices = Device::where('last_seen', '<', now()->subMinutes(10))
            ->orWhereNull('last_seen')
            ->get();
        
        if ($devices->isEmpty()) {
            $this->info("No devices need pinging at this time");
            return 0;
        }
        
        $totalDevices = $devices->count();
        $this->info("Found {$totalDevices} devices that need pinging");
        
        $bar = $this->output->createProgressBar($totalDevices);
        $bar->start();
        
        $results = $pingService->pingMultipleDevices($devices->pluck('id')->toArray());
        
        $statusChanges = 0;
        $errors = 0;
        
        foreach ($results as $result) {
            if (isset($result['error'])) {
                $errors++;
            } elseif ($result['status_changed']) {
                $statusChanges++;
            }
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        
        $this->info("Ping completed:");
        $this->info("- Total devices pinged: {$totalDevices}");
        $this->info("- Status changes: {$statusChanges}");
        $this->info("- Errors: {$errors}");
        
        return 0;
    }
}
