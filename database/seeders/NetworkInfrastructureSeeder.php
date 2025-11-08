<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\UniteMatériel;
use App\Models\Device;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NetworkInfrastructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder creates a complete network infrastructure with departments, units, and devices.
     */
    public function run(): void
    {
        $this->command->info('🏗️  Creating comprehensive network infrastructure...');
        
        // Step 1: Create Departments
        $this->command->info('📁 Creating departments...');
        $this->call(DepartmentSeeder::class);
        
        // Step 2: Create UniteMatériels
        $this->command->info('📦 Creating unité matériels...');
        $this->call(UniteMatérielSeeder::class);
        
        // Step 3: Create Devices
        $this->command->info('💻 Creating devices...');
        $this->call(DeviceSeeder::class);
        
        $this->command->info('✅ Network infrastructure created successfully!');
        
        // Display statistics
        $this->displayStatistics();
    }
    
    /**
     * Display creation statistics
     */
    private function displayStatistics(): void
    {
        $departmentsCount = Department::count();
        $unitsCount = UniteMatériel::count();
        $devicesCount = Device::count();
        $onlineDevices = Device::where('is_alive', true)->count();
        $offlineDevices = Device::where('is_alive', false)->count();
        
        $this->command->table(
            ['Entity', 'Count', 'Details'],
            [
                ['Departments', $departmentsCount, 'Including IT, HR, Production, etc.'],
                ['Unité Matériels', $unitsCount, 'Network, Server, Workstation units'],
                ['Devices (Total)', $devicesCount, 'All network devices'],
                ['├─ Online', $onlineDevices, 'Active devices'],
                ['└─ Offline', $offlineDevices, 'Inactive devices'],
            ]
        );
        
        $this->command->info('🎯 Infrastructure is ready for testing and development!');
        $this->command->info('🔗 All three models (Department → UniteMatériel → Device) are properly linked.');
    }
}
