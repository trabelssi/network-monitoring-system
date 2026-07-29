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
     * 
     * NOTE: Discovery moved to Python service - Phase 2 (Step 1-8)
     * SancellaDiscoveryService retired 2026-07-29
     * This job is scheduled but no-op until Python replacement is deployed
     */
    public function handle(): void
    {
        // Discovery functionality moved to Python service
        // See: phase2-python-service branch, MIGRATION_LOG.md Entry 16
        // This job remains scheduled but dormant until Python service replacement
        
        \Illuminate\Support\Facades\Log::info('DiscoverNetworkDevices: No-op - awaiting Python service replacement');
    }
}
