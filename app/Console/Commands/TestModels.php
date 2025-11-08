<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;

class TestModels extends Command
{
    protected $signature = 'test:models';
    protected $description = 'Test the updated models and relationships';

    public function handle()
    {
        $this->info('🔍 Testing Updated Models and Relationships...');
        $this->newLine();

        try {
            // Test Department creation
            $this->info('1. Testing Department model...');
            $dept = Department::create([
                'name' => 'IT Department',
                'description' => 'Information Technology Department'
            ]);
            $this->info("✅ Department created: {$dept->name} (ID: {$dept->id})");

            // Test UniteMatériel creation
            $this->info('2. Testing UniteMatériel model...');
            $unite = UniteMatériel::create([
                'name' => 'Network Equipment',
                'description' => 'Network switches and routers',
                'department_id' => $dept->id
            ]);
            $this->info("✅ UniteMatériel created: {$unite->name} (ID: {$unite->id})");

            // Test Device creation
            $this->info('3. Testing Device model...');
            $device = Device::create([
                'hostname' => 'test-switch-01',
                'ip_address' => '192.168.1.100',
                'is_alive' => true,
                'snmp_available' => true,
                'sys_descr' => 'Cisco Switch',
                'department_id' => $dept->id,
                'unit_id' => $unite->id,
                'user_name' => 'admin',
                'asset_number' => 'AST-001'
            ]);
            $this->info("✅ Device created: {$device->hostname} (ID: {$device->id})");

            // Test relationships
            $this->info('4. Testing relationships...');
            
            // Device -> Department
            $deviceDept = $device->department;
            $this->info("✅ Device->Department: {$deviceDept->name}");
            
            // Device -> UniteMatériel
            $deviceUnite = $device->uniteMatériel;
            $this->info("✅ Device->UniteMatériel: {$deviceUnite->name}");
            
            // Department -> Devices
            $deptDevices = $dept->devices;
            $this->info("✅ Department->Devices count: {$deptDevices->count()}");
            
            // Department -> UniteMatériels
            $deptUnites = $dept->uniteMateriels;
            $this->info("✅ Department->UniteMatériels count: {$deptUnites->count()}");
            
            // UniteMatériel -> Department
            $uniteDept = $unite->department;
            $this->info("✅ UniteMatériel->Department: {$uniteDept->name}");
            
            // UniteMatériel -> Devices
            $uniteDevices = $unite->devices;
            $this->info("✅ UniteMatériel->Devices count: {$uniteDevices->count()}");

            // Test helper methods
            $this->info('5. Testing helper methods...');
            $this->info("✅ Device status: {$device->status}");
            $this->info("✅ Device isAlive: " . ($device->isAlive() ? 'true' : 'false'));
            $this->info("✅ Device full path: {$device->getFullAssignmentPath()}");

            $this->newLine();
            $this->info('🎉 All model tests passed successfully!');
            $this->info('✅ Database structure and relationships are working correctly');

        } catch (\Exception $e) {
            $this->error('❌ Test failed: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
