<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\DiscoveryQueue;

class DiscoveryQueueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample discovery records
        $sampleDiscoveries = [
            // Online devices with SNMP
            [
                'ip_address' => '192.168.1.10',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'HP LaserJet Pro M404n Printer',
                'sys_object_id' => '1.3.6.1.4.1.11.2.3.9.4.2.1.1.1.1',
                'sys_location' => 'IT Department - Printer Room',
                'discovered_at' => now()->subHours(2),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.20',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Cisco Catalyst 2960 Switch',
                'sys_object_id' => '1.3.6.1.4.1.9.1.516',
                'sys_location' => 'IT Department - Server Room',
                'discovered_at' => now()->subHours(3),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.30',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Dell PowerEdge R740 Server',
                'sys_object_id' => '1.3.6.1.4.1.674.10892.5.1.1.1.1.1.1',
                'sys_location' => 'IT Department - Data Center',
                'discovered_at' => now()->subHours(4),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.40',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Windows 10 Workstation',
                'sys_object_id' => '1.3.6.1.4.1.311.1.13.1.1.1.1.1.1',
                'sys_location' => 'Marketing Department - Floor 2',
                'discovered_at' => now()->subHours(5),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.50',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Ubuntu Linux Server 22.04',
                'sys_object_id' => '1.3.6.1.4.1.8072.3.2.10',
                'sys_location' => 'Engineering Department - Lab A',
                'discovered_at' => now()->subHours(6),
                'discovery_status' => 'pending'
            ],
            
            // Online devices without SNMP
            [
                'ip_address' => '192.168.1.60',
                'is_alive' => true,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(7),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.70',
                'is_alive' => true,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(8),
                'discovery_status' => 'pending'
            ],
            
            // Offline devices
            [
                'ip_address' => '192.168.1.80',
                'is_alive' => false,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(9),
                'discovery_status' => 'pending'
            ],
            [
                'ip_address' => '192.168.1.90',
                'is_alive' => false,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(10),
                'discovery_status' => 'pending'
            ],
            
            // Some processed discoveries
            [
                'ip_address' => '192.168.1.100',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'HP EliteDesk 800 G5',
                'sys_object_id' => '1.3.6.1.4.1.232.9.4.2.1.1.1.1.1',
                'sys_location' => 'Sales Department - Floor 1',
                'discovered_at' => now()->subHours(12),
                'discovery_status' => 'processed'
            ],
            [
                'ip_address' => '192.168.1.110',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Cisco ISR 4321 Router',
                'sys_object_id' => '1.3.6.1.4.1.9.1.516',
                'sys_location' => 'Network Operations Center',
                'discovered_at' => now()->subHours(15),
                'discovery_status' => 'processed'
            ],
            
            // Some failed discoveries
            [
                'ip_address' => '192.168.1.120',
                'is_alive' => false,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(18),
                'discovery_status' => 'failed',
                'error_message' => 'Connection timeout during SNMP query'
            ],
            [
                'ip_address' => '192.168.1.130',
                'is_alive' => false,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now()->subHours(20),
                'discovery_status' => 'failed',
                'error_message' => 'SNMP community string rejected'
            ]
        ];
        
        foreach ($sampleDiscoveries as $discovery) {
            DiscoveryQueue::create($discovery);
        }
        
        $this->command->info('Sample discovery records created successfully!');
    }
}
