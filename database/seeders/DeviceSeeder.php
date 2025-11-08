<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have departments and units
        $departments = Department::all();
        $uniteMateriels = UniteMatériel::all();
        
        if ($departments->isEmpty() || $uniteMateriels->isEmpty()) {
            $this->command->warn('Please run DepartmentSeeder and UniteMatérielSeeder first');
            return;
        }
        
        // Get specific departments and units for organized seeding
        $itDepartment = $departments->where('name', 'Informatique')->first() ?? $departments->first();
        $networkUnit = $uniteMateriels->where('name', 'like', '%Réseau%')->first() ?? $uniteMateriels->first();
        $serverUnit = $uniteMateriels->where('name', 'like', '%Serveur%')->first() ?? $uniteMateriels->first();
        $workstationUnit = $uniteMateriels->where('name', 'like', '%Poste%')->first() ?? $uniteMateriels->first();
        
        // Create network devices (switches and routers)
        Device::factory(5)->networkDevice()->create([
            'department_id' => $itDepartment->id,
            'unit_id' => $networkUnit->id,
            'hostname' => function() { return 'sw-' . fake()->numberBetween(1, 99); },
            'sys_descr' => 'Cisco Switch',
            'is_alive' => true,
            'snmp_available' => true,
        ]);
        
        Device::factory(2)->create([
            'department_id' => $itDepartment->id,
            'unit_id' => $networkUnit->id,
            'hostname' => function() { return 'rt-' . fake()->numberBetween(1, 99); },
            'sys_descr' => 'Cisco Router',
            'is_alive' => true,
            'snmp_available' => true,
        ]);
        
        // Create servers
        Device::factory(3)->create([
            'department_id' => $itDepartment->id,
            'unit_id' => $serverUnit->id,
            'hostname' => function() { return 'srv-' . fake()->word(); },
            'sys_descr' => 'Linux Server',
            'is_alive' => true,
            'snmp_available' => false,
        ]);
        
        // Create workstations for each department
        foreach ($departments as $department) {
            $departmentUnit = $uniteMateriels->where('department_id', $department->id)->first() ?? $workstationUnit;
            
            Device::factory(rand(2, 5))->create([
                'department_id' => $department->id,
                'unit_id' => $departmentUnit->id,
                'hostname' => function() { return 'pc-' . fake()->numberBetween(1, 999); },
                'sys_descr' => 'Windows Workstation',
                'is_alive' => fake()->boolean(80), // 80% chance of being online
                'snmp_available' => false,
            ]);
        }
        
        // Create some printers and cameras
        Device::factory(3)->create([
            'department_id' => $itDepartment->id,
            'unit_id' => $uniteMateriels->random()->id,
            'hostname' => function() { return 'pr-' . fake()->numberBetween(1, 99); },
            'sys_descr' => 'Network Printer',
            'is_alive' => true,
            'snmp_available' => true,
        ]);
        
        Device::factory(2)->create([
            'department_id' => $itDepartment->id,
            'unit_id' => $uniteMateriels->random()->id,
            'hostname' => function() { return 'cam-' . fake()->numberBetween(1, 99); },
            'sys_descr' => 'IP Camera',
            'is_alive' => fake()->boolean(70),
            'snmp_available' => false,
        ]);
        
        $this->command->info('📱 Created devices across all departments and units');
    }
}
