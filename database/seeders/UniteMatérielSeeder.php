<?php

namespace Database\Seeders;

use App\Models\UniteMatériel;
use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UniteMatérielSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks temporarily
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing units
        UniteMatériel::truncate();
        
        // Re-enable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        // Ensure we have departments
        $departments = Department::all();
        if ($departments->isEmpty()) {
            $this->command->warn('Please run DepartmentSeeder first');
            return;
        }
        
        // Get department references
        $informatique = $departments->where('name', 'Informatique')->first();
        $ressourcesHumaines = $departments->where('name', 'Ressources Humaines')->first();
        $production = $departments->where('name', 'Production')->first();
        $administration = $departments->where('name', 'Administration')->first();
        $unknownDepartment = $departments->where('name', 'Unknown Department')->first();
        
        // Define units with descriptions and keywords for each department
        $unitsData = [
            // Informatique Department
            [
                'name' => 'Équipements Réseau',
                'description' => 'Unité contenant les équipements réseau principaux (switches, routeurs, firewalls)',
                'keywords' => 'switch,router,firewall,cisco,juniper,hp network',
                'department_id' => $informatique->id,
            ],
            [
                'name' => 'Serveurs',
                'description' => 'Unité contenant les serveurs de production, test et développement',
                'keywords' => 'server,dell,hp proliant,linux,windows,vmware',
                'department_id' => $informatique->id,
            ],
            [
                'name' => 'Postes de Travail',
                'description' => 'Ordinateurs de bureau et portables des employés IT',
                'keywords' => 'pc,desktop,laptop,windows,ubuntu,linux,apple',
                'department_id' => $informatique->id,
            ],
            [
                'name' => 'Imprimantes',
                'description' => 'Imprimantes multifonctions et laser pour l\'équipe IT',
                'keywords' => 'printer,hp laserjet,canon,brother,multifonction',
                'department_id' => $informatique->id,
            ],
            [
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour les appareils non classifiés en IT',
                'keywords' => 'inconnu,non classifié,défaut,générique,it',
                'department_id' => $informatique->id,
            ],
            
            // Ressources Humaines Department
            [
                'name' => 'Équipements Réseau',
                'description' => 'Équipements réseau pour le département RH',
                'keywords' => 'switch,router,network,rh,ressources humaines',
                'department_id' => $ressourcesHumaines->id,
            ],
            [
                'name' => 'Serveurs',
                'description' => 'Serveurs dédiés aux applications RH et gestion du personnel',
                'keywords' => 'server,rh,ressources humaines,personnel,gestion',
                'department_id' => $ressourcesHumaines->id,
            ],
            [
                'name' => 'Postes de Travail',
                'description' => 'Ordinateurs pour les employés du département RH',
                'keywords' => 'pc,desktop,laptop,rh,ressources humaines,personnel',
                'department_id' => $ressourcesHumaines->id,
            ],
            [
                'name' => 'Imprimantes',
                'description' => 'Imprimantes pour la gestion des documents RH',
                'keywords' => 'printer,rh,ressources humaines,documents,contrats',
                'department_id' => $ressourcesHumaines->id,
            ],
            [
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour les appareils non classifiés en RH',
                'keywords' => 'inconnu,non classifié,défaut,générique,rh',
                'department_id' => $ressourcesHumaines->id,
            ],
            
            // Production Department
            [
                'name' => 'Équipements Réseau',
                'description' => 'Équipements réseau pour la production et la fabrication',
                'keywords' => 'switch,router,network,production,fabrication,industrie',
                'department_id' => $production->id,
            ],
            [
                'name' => 'Serveurs',
                'description' => 'Serveurs de contrôle de production et de gestion des processus',
                'keywords' => 'server,production,fabrication,contrôle,processus,scada',
                'department_id' => $production->id,
            ],
            [
                'name' => 'Postes de Travail',
                'description' => 'Ordinateurs pour les opérateurs de production',
                'keywords' => 'pc,desktop,laptop,production,opérateur,fabrication',
                'department_id' => $production->id,
            ],
            [
                'name' => 'Imprimantes',
                'description' => 'Imprimantes pour la production et la documentation',
                'keywords' => 'printer,production,fabrication,documents,étiquettes',
                'department_id' => $production->id,
            ],
            [
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour les appareils non classifiés en production',
                'keywords' => 'inconnu,non classifié,défaut,générique,production',
                'department_id' => $production->id,
            ],
            
            // Administration Department
            [
                'name' => 'Équipements Réseau',
                'description' => 'Équipements réseau pour l\'administration générale',
                'keywords' => 'switch,router,network,administration,gestion',
                'department_id' => $administration->id,
            ],
            [
                'name' => 'Serveurs',
                'description' => 'Serveurs administratifs et de gestion',
                'keywords' => 'server,administration,gestion,comptabilité,finance',
                'department_id' => $administration->id,
            ],
            [
                'name' => 'Postes de Travail',
                'description' => 'Ordinateurs pour le personnel administratif',
                'keywords' => 'pc,desktop,laptop,administration,gestion,comptabilité',
                'department_id' => $administration->id,
            ],
            [
                'name' => 'Imprimantes',
                'description' => 'Imprimantes pour l\'administration et la comptabilité',
                'keywords' => 'printer,administration,comptabilité,finance,documents',
                'department_id' => $administration->id,
            ],
            [
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour les appareils non classifiés en administration',
                'keywords' => 'inconnu,non classifié,défaut,générique,administration',
                'department_id' => $administration->id,
            ],
            
            // Unknown Department
            [
                'name' => 'Équipements Réseau',
                'description' => 'Équipements réseau non classifiés',
                'keywords' => 'switch,router,network,non classifié,inconnu',
                'department_id' => $unknownDepartment->id,
            ],
            [
                'name' => 'Serveurs',
                'description' => 'Serveurs non classifiés',
                'keywords' => 'server,non classifié,inconnu,défaut',
                'department_id' => $unknownDepartment->id,
            ],
            [
                'name' => 'Postes de Travail',
                'description' => 'Ordinateurs non classifiés',
                'keywords' => 'pc,desktop,laptop,non classifié,inconnu,défaut',
                'department_id' => $unknownDepartment->id,
            ],
            [
                'name' => 'Imprimantes',
                'description' => 'Imprimantes non classifiées',
                'keywords' => 'printer,non classifié,inconnu,défaut',
                'department_id' => $unknownDepartment->id,
            ],
            [
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour tous les appareils non classifiés',
                'keywords' => 'inconnu,non classifié,défaut,générique,par défaut',
                'department_id' => $unknownDepartment->id,
            ],
        ];
        
        // Create all units
        foreach ($unitsData as $unitData) {
            UniteMatériel::create($unitData);
        }
        
        $this->command->info('✅ Created 25 UniteMatériels successfully (5 units × 5 departments)');
        $this->command->info('   - Informatique: 5 units');
        $this->command->info('   - Ressources Humaines: 5 units');
        $this->command->info('   - Production: 5 units');
        $this->command->info('   - Administration: 5 units');
        $this->command->info('   - Unknown Department: 5 units');
        $this->command->info('');
        $this->command->info('Each unit includes:');
        $this->command->info('   - Descriptive name');
        $this->command->info('   - Detailed description');
        $this->command->info('   - Relevant keywords for auto-classification');
    }
}
