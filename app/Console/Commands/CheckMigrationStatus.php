<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CheckMigrationStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:migration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the status of academic optimization migration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== STEP 1 MIGRATION VERIFICATION ===');
        $this->line('');

        // Check if network tables were removed
        $networkTables = [
            'wireless_access_points',
            'wap_monitoring', 
            'interfaces',
            'network_topology',
            'device_neighbors',
            'groups',
            'vendors',
            'device_types'
        ];

        $this->info('1. Network Tables Removal Check:');
        foreach ($networkTables as $table) {
            $exists = Schema::hasTable($table);
            $status = $exists ? '❌ STILL EXISTS' : '✅ REMOVED';
            $this->line("   $table: $status");
        }

        // Check devices table structure
        $this->line('');
        $this->info('2. Devices Table Structure:');
        if (Schema::hasTable('devices')) {
            try {
                $columns = DB::select("PRAGMA table_info(devices)");
                $this->line("   Columns found:");
                foreach ($columns as $column) {
                    $this->line("     - {$column->name} ({$column->type})");
                }
            } catch (\Exception $e) {
                $this->error("   Error checking devices table: " . $e->getMessage());
            }
        } else {
            $this->error("   ❌ Devices table doesn't exist!");
        }

        // Check management tables are intact
        $this->line('');
        $this->info('3. Management Tables Integrity Check:');
        $managementTables = [
            'users',
            'projects', 
            'tasks',
            'interventions',
            'products',
            'notifications',
            'activity_logs'
        ];

        foreach ($managementTables as $table) {
            $exists = Schema::hasTable($table);
            $status = $exists ? '✅ PRESERVED' : '❌ MISSING';
            $this->line("   $table: $status");
        }

        $this->line('');
        $this->info('=== STEP 1 VERIFICATION COMPLETE ===');
    }
}
