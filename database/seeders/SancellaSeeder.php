<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\UniteMatériel;

class SancellaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create main departments (using firstOrCreate to avoid duplicates)
        $itDept = Department::firstOrCreate([
            'slug' => 'it-department'
        ], [
            'name' => 'IT Department',
            'description' => 'Information Technology Department',
            'city' => 'Building A',
            'ip_range' => '192.168.10.0/24',
        ]);
        
        $bureauDept = Department::firstOrCreate([
            'slug' => 'bureau-principal'
        ], [
            'name' => 'Bureau Principal',
            'description' => 'Main Administrative Offices',
            'city' => 'Building A - Floors 1-2',
            'ip_range' => '192.168.20.0/24',
        ]);
        
        $productionDept = Department::firstOrCreate([
            'slug' => 'ligne-production'
        ], [
            'name' => 'Ligne de Production',
            'description' => 'Manufacturing Production Line',
            'city' => 'Production Hall - Building B',
            'ip_range' => '192.168.30.0/24',
        ]);
        
        // Create equipment categories (using firstOrCreate to avoid duplicates)
        UniteMatériel::firstOrCreate([
            'name' => 'Équipements Réseau',
            'department_id' => $itDept->id,
        ], [
            'description' => 'Network switches, routers, firewalls',
            'auto_assignment_rules' => json_encode(['switch', 'router', 'firewall', 'cisco']),
        ]);
        
        UniteMatériel::firstOrCreate([
            'name' => 'Serveurs',
            'department_id' => $itDept->id,
        ], [
            'description' => 'Physical and virtual servers',
            'auto_assignment_rules' => json_encode(['server', 'linux', 'windows server']),
        ]);
        
        UniteMatériel::firstOrCreate([
            'name' => 'Unité Bureautique',
            'department_id' => $bureauDept->id,
        ], [
            'description' => 'Desktop PCs and workstations',
            'auto_assignment_rules' => json_encode(['pc', 'workstation', 'windows', 'desktop']),
        ]);
        
        UniteMatériel::firstOrCreate([
            'name' => 'Imprimantes',
            'department_id' => $bureauDept->id,
        ], [
            'description' => 'Printers and multifunction devices',
            'auto_assignment_rules' => json_encode(['printer', 'hp laserjet', 'canon', 'multifunction']),
        ]);
        
        UniteMatériel::firstOrCreate([
            'name' => 'Unité Production',
            'department_id' => $productionDept->id,
        ], [
            'description' => 'Production line equipment and PLCs',
            'auto_assignment_rules' => json_encode(['plc', 'industrial', 'production', 'siemens']),
        ]);
    }
}
