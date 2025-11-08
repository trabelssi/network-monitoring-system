<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WapMonitoringService;
use App\Models\WirelessAccessPoint;

class MonitorWaps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'waps:monitor {--all : Monitor all WAPs regardless of monitoring_enabled status}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor all Wireless Access Points';

    /**
     * Execute the console command.
     */
    public function handle(WapMonitoringService $monitoringService)
    {
        $this->info('Starting WAP monitoring...');

        if ($this->option('all')) {
            $waps = WirelessAccessPoint::whereNotNull('ip_address')->get();
            $this->info("Monitoring all {$waps->count()} WAPs with IP addresses...");
        } else {
            $waps = WirelessAccessPoint::monitoringEnabled()->get();
            $this->info("Monitoring {$waps->count()} enabled WAPs...");
        }

        if ($waps->isEmpty()) {
            $this->warn('No WAPs to monitor.');
            return 0;
        }

        $progressBar = $this->output->createProgressBar($waps->count());
        $progressBar->start();

        $results = [
            'total' => $waps->count(),
            'online' => 0,
            'offline' => 0,
            'errors' => 0
        ];

        foreach ($waps as $wap) {
            try {
                $isOnline = $monitoringService->pingWap($wap);
                if ($isOnline) {
                    $results['online']++;
                } else {
                    $results['offline']++;
                }
            } catch (\Exception $e) {
                $results['errors']++;
                $this->error("Error monitoring WAP {$wap->ssid}: " . $e->getMessage());
            }
            
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Display results
        $this->info('Monitoring completed!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total WAPs', $results['total']],
                ['Online', $results['online']],
                ['Offline', $results['offline']],
                ['Errors', $results['errors']],
                ['Uptime %', $results['total'] > 0 ? round(($results['online'] / $results['total']) * 100, 2) . '%' : '0%']
            ]
        );

        return 0;
    }
} 