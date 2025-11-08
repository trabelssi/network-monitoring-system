<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks temporarily
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing departments
        Department::truncate();
        
        // Re-enable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        // Create exactly 5 departments as specified
        $departments = [
            [
                'name' => 'Informatique',
                'description' => 'Département des technologies de l\'information et de la communication',
            ],
            [
                'name' => 'Ressources Humaines',
                'description' => 'Département des ressources humaines et de la gestion du personnel',
            ],
            [
                'name' => 'Production',
                'description' => 'Département de production et de fabrication',
            ],
            [
                'name' => 'Administration',
                'description' => 'Département administratif et de gestion',
            ],
            [
                'name' => 'Unknown Department',
                'description' => 'Département par défaut pour les éléments non classifiés',
            ],
        ];

        foreach ($departments as $departmentData) {
            Department::create($departmentData);
        }

        $this->command->info('🏢 Created 5 departments successfully');
        $this->command->info('   - Informatique');
        $this->command->info('   - Ressources Humaines');
        $this->command->info('   - Production');
        $this->command->info('   - Administration');
        $this->command->info('   - Unknown Department');
    }
}
