<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Services\SancellaDiscoveryService;

class DiscoverNetworkDevices implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $discoveryService = new SancellaDiscoveryService();
        
        // Discover all configured subnets
        $subnets = [
            '192.168.1.0/24',  // Office network
            '192.168.10.0/24', // IT Department
            '192.168.20.0/24', // Bureau Principal
            '192.168.30.0/24', // Production
        ];
        
        foreach ($subnets as $subnet) {
            $discoveryService->discoverSubnet($subnet);
        }
    }
}
