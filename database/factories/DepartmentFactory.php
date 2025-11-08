<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Department::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $departmentNames = [
            'Informatique',
            'Ressources Humaines',
            'Comptabilité',
            'Marketing',
            'Commercial',
            'Production',
            'Logistique',
            'Qualité',
            'Recherche et Développement',
            'Administration',
            'Sécurité',
            'Maintenance',
        ];

        $descriptions = [
            'Gestion des systèmes informatiques et réseaux',
            'Gestion du personnel et des ressources humaines',
            'Gestion financière et comptable',
            'Promotion et communication',
            'Ventes et relations clients',
            'Fabrication et production',
            'Gestion des stocks et distribution',
            'Contrôle qualité des produits',
            'Innovation et développement produits',
            'Administration générale',
            'Sécurité des biens et des personnes',
            'Maintenance des équipements',
        ];

        $name = $this->faker->unique()->randomElement($departmentNames);
        $index = array_search($name, $departmentNames);
        
        return [
            'name' => $name,
            'description' => $this->faker->optional(0.8)->randomElement([$descriptions[$index]] ?? $descriptions),
        ];
    }

    /**
     * Indicate that the department is for IT.
     */
    public function it(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Informatique',
            'description' => 'Département informatique - Gestion des systèmes, réseaux et infrastructure IT',
        ]);
    }

    /**
     * Indicate that the department is for HR.
     */
    public function hr(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ressources Humaines',
            'description' => 'Gestion du personnel, recrutement et formation',
        ]);
    }

    /**
     * Indicate that the department is for production.
     */
    public function production(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Production',
            'description' => 'Chaîne de production et fabrication',
        ]);
    }

    /**
     * Indicate that the department is for administration.
     */
    public function administration(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Administration',
            'description' => 'Direction générale et administration',
        ]);
    }

    /**
     * Indicate that the department is unknown/default.
     */
    public function unknown(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Unknown Department',
            'description' => 'Département par défaut pour les appareils non classifiés',
        ]);
    }

    /**
     * Indicate that the department has no description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }

    /**
     * Department with a specific focus area.
     */
    public function withFocus(string $focus): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => "Département spécialisé dans: {$focus}",
        ]);
    }
}
