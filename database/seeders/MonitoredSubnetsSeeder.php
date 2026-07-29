<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MonitoredSubnetsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Populates monitored_subnets with values from the original
     * hardcoded array in app/Jobs/DiscoverNetworkDevices.php
     * 
     * Original values (from git commit 161aef07, initial commit):
     * - 192.168.1.0/24  // Office network
     * - 192.168.10.0/24 // IT Department
     * - 192.168.20.0/24 // Bureau Principal
     * - 192.168.30.0/24 // Production
     */
    public function run(): void
    {
        $subnets = [
            [
                'subnet' => '192.168.1.0/24',
                'name' => 'Office network',
                'enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subnet' => '192.168.10.0/24',
                'name' => 'IT Department',
                'enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subnet' => '192.168.20.0/24',
                'name' => 'Bureau Principal',
                'enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subnet' => '192.168.30.0/24',
                'name' => 'Production',
                'enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('monitored_subnets')->insert($subnets);
    }
}
