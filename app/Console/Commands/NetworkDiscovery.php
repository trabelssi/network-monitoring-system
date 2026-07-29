<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SancellaDiscoveryService;

class NetworkDiscovery extends Command
{
    protected $signature = 'network:discover
        {--subnet= : Subnet to scan (e.g., 192.168.1.0/24)}
        {--range= : IP range to scan (e.g., 192.168.1.1-192.168.1.254)}
        {--all : Scan all configured subnets}';

    protected $description = 'Discover new network devices';

    /**
     * Handle the discovery command
     * 
     * NOTE: Discovery moved to Python service - Phase 2 (Step 1-8)
     * SancellaDiscoveryService retired 2026-07-29
     * This command is available but no-op until Python replacement is deployed
     */
    public function handle(SancellaDiscoveryService $discovery)
    {
        // Discovery functionality moved to Python service
        // See: phase2-python-service branch, MIGRATION_LOG.md Entry 16
        // Command remains available but dormant until Python service replacement
        
        $this->warn('Network discovery has been moved to the Python service (Phase 2).');
        $this->info('This command is currently dormant and will be re-enabled once the Python service is deployed.');
        $this->info('See MIGRATION_LOG.md Entry 16 for details.');
        
        return 0;
    }

    private function discoverAllSubnets(SancellaDiscoveryService $discovery)
    {
        $subnets = config('discovery.subnets', []);
        $this->info('Starting discovery of all configured subnets...');

        $total = 0;
        foreach ($subnets as $name => $subnet) {
            $this->info("\nScanning $name subnet ($subnet)");
            $devices = $discovery->discoverSubnet($subnet);
            $total += count($devices);
            $this->displayDiscoveredDevices($devices);
        }

        $this->info("\nDiscovery complete. Found $total new devices.");
    }

    private function discoverSubnet(SancellaDiscoveryService $discovery, string $subnet)
    {
        $this->info("Starting discovery of subnet $subnet");
        $devices = $discovery->discoverSubnet($subnet);
        $this->displayDiscoveredDevices($devices);
    }

    private function discoverRange(SancellaDiscoveryService $discovery, string $start, string $end)
    {
        $this->info("Starting discovery of range $start to $end");
        $devices = $discovery->discoverRange($start, $end);
        $this->displayDiscoveredDevices($devices);
    }

    private function displayDiscoveredDevices(array $devices)
    {
        if (empty($devices)) {
            $this->info('No new devices found.');
            return;
        }

        $this->info("\nDiscovered " . count($devices) . " new devices:");
        $this->table(
            ['IP', 'Hostname', 'Type', 'Vendor', 'OS', 'Method'],
            collect($devices)->map(fn($d) => [
                $d->ip_address,
                $d->hostname,
                $d->type,
                $d->vendor ?? 'N/A',
                $d->os ?? 'N/A',
                $d->discoveries->first()->method
            ])
        );
    }
} 