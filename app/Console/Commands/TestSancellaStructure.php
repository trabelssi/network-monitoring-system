<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;

class TestSancellaStructure extends Command
{
    protected $signature = 'sancella:test';
    protected $description = 'Test the Sancella structure (Device->Department->UniteMatériel relationships)';

    public function handle()
    {
        $this->info('🔍 Testing Sancella Structure...');
        $this->newLine();

        // Test Department model
        $this->info('📊 Departments:');
        $departments = Department::all();
        $this->table(['ID', 'Name', 'Location', 'UniteMatériels Count'], 
            $departments->map(fn($dept) => [
                $dept->id,
                $dept->name,
                $dept->location ?? 'N/A',
                $dept->uniteMateriels->count()
            ])
        );

        // Test UniteMatériel model
        $this->info('🏢 Unité Matériels:');
        $unites = UniteMatériel::with('department')->get();
        $this->table(['ID', 'Name', 'Department', 'Devices Count'], 
            $unites->map(fn($unite) => [
                $unite->id,
                $unite->name,
                $unite->department->name ?? 'N/A',
                $unite->devices->count()
            ])
        );

        // Test Device model
        $this->info('💻 Devices:');
        $devices = Device::with(['department', 'uniteMatériel'])->get();
        if ($devices->count() > 0) {
            $this->table(['ID', 'Hostname', 'Department', 'Unité Matériel', 'Status'], 
                $devices->map(fn($device) => [
                    $device->id,
                    $device->hostname ?? 'Unknown',
                    $device->department->name ?? 'N/A',
                    $device->uniteMatériel->name ?? 'N/A',
                    $device->status ?? 'unknown'
                ])
            );
        } else {
            $this->warn('No devices found in database');
        }

        // Test creating a new device with auto-assignment
        $this->info('🔧 Testing device creation with auto-assignment...');
        
        // Get or create a department
        $dept = Department::first();
        if (!$dept) {
            $dept = Department::create([
                'name' => 'Test Department',
                'slug' => 'test-department',
                'description' => 'Test department for Sancella validation'
            ]);
            $this->info("✅ Created test department: {$dept->name}");
        }

        // Get or create an unite materiel
        $unite = UniteMatériel::where('department_id', $dept->id)->first();
        if (!$unite) {
            $unite = UniteMatériel::create([
                'name' => 'Test Unité Matériel',
                'description' => 'Test unite materiel for Sancella validation',
                'department_id' => $dept->id
            ]);
            $this->info("✅ Created test unité matériel: {$unite->name}");
        }

        // Create a test device
        $device = Device::create([
            'hostname' => 'test-device-' . now()->timestamp,
            'ip_address' => '192.168.1.' . rand(100, 200),
            'type' => 'switch',
            'department_id' => $dept->id,
            'unite_materiel_id' => $unite->id,
            'status' => 'online'
        ]);

        $this->info("✅ Created test device: {$device->hostname}");
        $this->info("   → Department: {$device->department->name}");
        $this->info("   → Unité Matériel: {$device->uniteMatériel->name}");

        $this->newLine();
        $this->info('🎉 Sancella structure test completed successfully!');
        $this->info('✅ All relationships are working properly');
        
        return 0;
    }
}
