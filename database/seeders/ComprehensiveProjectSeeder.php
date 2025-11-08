<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Product;
use App\Models\Task;
use App\Models\Intervention;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class ComprehensiveProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Machine names for projects
        $machineNames = [
            'Machine de Production Alpha',
            'Machine de Production Beta', 
            'Machine de Production Gamma',
            'Machine de Production Delta',
            'Machine de Production Epsilon'
        ];

        // Product names for each machine
        $productNames = [
            ['Composant Électronique A1', 'Composant Électronique A2', 'Composant Électronique A3'],
            ['Pièce Mécanique B1', 'Pièce Mécanique B2'],
            ['Module Hydraulique C1', 'Module Hydraulique C2', 'Module Hydraulique C3'],
            ['Élément Pneumatique D1', 'Élément Pneumatique D2'],
            ['Système Robotique E1', 'Système Robotique E2', 'Système Robotique E3']
        ];

        // Task descriptions
        $taskDescriptions = [
            'Maintenance préventive',
            'Contrôle qualité',
            'Réparation urgente',
            'Inspection technique',
            'Calibrage des instruments',
            'Nettoyage approfondi',
            'Remplacement de pièces',
            'Test de performance',
            'Mise à jour logicielle',
            'Vérification sécurité'
        ];

        // Intervention descriptions
        $interventionDescriptions = [
            'Intervention réalisée avec succès, machine opérationnelle',
            'Problème résolu, tests effectués',
            'Maintenance effectuée selon procédure',
            'Réparation complétée, contrôle qualité OK',
            'Calibrage terminé, paramètres ajustés',
            'Nettoyage effectué, équipement désinfecté',
            'Pièces remplacées, fonctionnement vérifié',
            'Tests de performance concluants',
            'Mise à jour installée avec succès',
            'Contrôle sécurité validé'
        ];

        // Arabic names written in French transliteration
        $arabicNames = [
            'Ahmed Mohamed',
            'Fatima Ali', 
            'Mohamed Abdallah',
            'Aicha Hassan',
            'Ali Ahmed',
            'Khadija Mahmoud',
            'Abderrahmane Youssef',
            'Zeinab Omar',
            'Youssef Ibrahim',
            'Maryam Salem',
            'Hassan Abdelaziz',
            'Nour El Houda',
            'Omar Khalid',
            'Sara Ahmed',
            'Ibrahim Mohamed',
            'Houda Abdallah',
            'Khalid Hossam',
            'Rokaya Youssef',
            'Salem Omar',
            'Amina Mohamed'
        ];

        // Create 20 additional users (members) - only if they don't exist
        $users = collect();
        for ($i = 1; $i <= 20; $i++) {
            $email = "membre{$i}@sancella.com";
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $arabicNames[$i - 1],
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'role' => 'user',
                    'is_active' => true,
                ]);
                $this->command->info("Créé utilisateur: {$user->name}");
            } else {
                // Update existing user with Arabic name
                $user->update(['name' => $arabicNames[$i - 1]]);
                $this->command->info("Mis à jour utilisateur: {$user->name}");
            }
            $users->push($user);
        }

        // Get existing admin user to assign as creator
        $adminUser = User::where('role', 'admin')->first();
        if (!$adminUser) {
            // Check if admin@sancella.com already exists
            $adminUser = User::where('email', 'admin@sancella.com')->first();
            if (!$adminUser) {
                $adminUser = User::create([
                    'name' => 'Administrateur Principal',
                    'email' => 'admin@sancella.com',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'role' => 'admin',
                    'is_active' => true,
                ]);
                $this->command->info("Créé administrateur: {$adminUser->name}");
            } else {
                // Update existing user to admin role
                $adminUser->update(['role' => 'admin']);
                $this->command->info("Mis à jour utilisateur existant vers admin: {$adminUser->name}");
            }
        } else {
            $this->command->info("Administrateur existant: {$adminUser->name}");
        }

        // Track tasks that should have today's date
        $todayTasksCount = 0;
        $todayTasksMax = 5;
        $allTasks = collect();

        // Create 5 projects (machines)
        for ($i = 0; $i < 5; $i++) {
            // Select 4 random members for this project
            $projectMembers = $users->random(4);
            $memberIds = $projectMembers->pluck('id')->toArray();
            
            $project = Project::create([
                'name' => $machineNames[$i],
                'description' => "Machine de production industrielle pour la fabrication de composants spécialisés. Équipement haute performance nécessitant une maintenance régulière.",
                'reference' => "MACH-" . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'created_by' => $adminUser->id,
                'updated_by' => $adminUser->id,
                'members' => json_encode($memberIds), // Store member IDs as JSON
            ]);

            $this->command->info("Créé projet: {$project->name}");

            // Create 2-3 products for each project
            $productsForProject = $productNames[$i];
            foreach ($productsForProject as $productName) {
                $product = Product::create([
                    'name' => $productName,
                    'project_id' => $project->id,
                ]);

                $this->command->info("  Créé produit: {$product->name}");

                // Create 2 tasks for each product
                for ($taskNum = 1; $taskNum <= 2; $taskNum++) {
                    $randomDescription = $taskDescriptions[array_rand($taskDescriptions)];
                    $assignedUser = $projectMembers->random(); // Assign to one of the project members
                    
                    // Determine if this task should have today's date
                    $shouldBeToday = $todayTasksCount < $todayTasksMax && rand(0, 1);
                    if ($shouldBeToday) {
                        $todayTasksCount++;
                        $dueDate = Carbon::today();
                    } else {
                        // Random date within the last 30 days or next 30 days
                        $dueDate = Carbon::now()->addDays(rand(-30, 30));
                    }

                    $task = Task::create([
                        'name' => "{$randomDescription} - {$product->name}",
                        'description' => "Tâche de {$randomDescription} pour le produit {$product->name}. Cette intervention nécessite une attention particulière et doit être réalisée selon les procédures établies.",
                        'assigned_user_id' => $assignedUser->id,
                        'created_by' => $adminUser->id,
                        'updated_by' => $adminUser->id,
                        'priority' => ['low', 'medium', 'high'][rand(0, 2)],
                        'due_date' => $dueDate,
                    ]);

                    // Associate task with product
                    $product->tasks()->attach($task->id);
                    
                    // Add 2-3 random observers from the project members (excluding the assigned user)
                    $availableObservers = $projectMembers->reject(function($member) use ($assignedUser) {
                        return $member->id === $assignedUser->id;
                    });
                    
                    $observerCount = rand(2, 3);
                    $selectedObservers = $availableObservers->random(min($observerCount, $availableObservers->count()));
                    
                    // Attach observers to the task
                    foreach ($selectedObservers as $observer) {
                        $task->observers()->attach($observer->id);
                    }
                    
                    $observerNames = $selectedObservers->pluck('name')->implode(', ');
                    $allTasks->push($task);

                    $this->command->info("    Créé tâche: {$task->name}" . ($shouldBeToday ? " (AUJOURD'HUI)" : "") . " - Observateurs: {$observerNames}");
                }
            }
        }

        // Create 1 intervention for each task with random rating
        $statuses = ['approved', 'rejected'];
        $ratings = [1, 2, 3, 4, 5]; // Numeric ratings 1-5
        $ratingComments = [
            'approved' => [
                'Excellent travail, intervention conforme aux attentes',
                'Très bonne exécution, procédures respectées',
                'Travail de qualité, délais respectés',
                'Intervention réussie, équipement opérationnel',
                'Performance satisfaisante, contrôles validés'
            ],
            'rejected' => [
                'Intervention incomplète, nécessite reprise',
                'Procédures non respectées, travail à refaire',
                'Qualité insuffisante, corrections nécessaires',
                'Non-conformité détectée, intervention rejetée',
                'Standards de sécurité non respectés'
            ]
        ];

        foreach ($allTasks as $task) {
            $status = $statuses[array_rand($statuses)];
            $rating = $ratings[array_rand($ratings)]; // Numeric rating
            $randomIntervention = $interventionDescriptions[array_rand($interventionDescriptions)];
            $ratingComment = $ratingComments[$status][array_rand($ratingComments[$status])];
            
            // Get the assigned user for this task
            $assignedUser = $task->assignedUser;

            $intervention = Intervention::create([
                'task_id' => $task->id,
                'user_id' => $assignedUser->id,
                'description' => $randomIntervention,
                'status' => $status,
                'action_time' => Carbon::now()->subDays(rand(0, 7)), // Random time within last week
                'rating' => $rating, // Numeric rating
                'rating_comment' => $ratingComment,
                'rejection_comment' => $status === 'rejected' ? $ratingComment : null,
            ]);

            $this->command->info("      Créé intervention pour tâche {$task->name}: {$status} (rating: {$rating})");
        }

        $this->command->info("Seeding terminé!");
        $this->command->info("- 5 projets (machines) créés");
        $this->command->info("- " . Product::count() . " produits créés");
        $this->command->info("- " . $allTasks->count() . " tâches créées (dont {$todayTasksCount} pour aujourd'hui)");
        $this->command->info("- " . Intervention::count() . " interventions créées");
        $this->command->info("- 20 utilisateurs membres créés avec des noms arabes en français");
        $this->command->info("- Chaque projet a 4 membres assignés");
        $this->command->info("- Chaque tâche a 2-3 observateurs assignés");
    }
}
