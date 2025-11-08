<?php

namespace Database\Factories;

use App\Models\UniteMatériel;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UniteMatériel>
 */
class UniteMatérielFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UniteMatériel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $unitTypes = [
            'Équipements Réseau',
            'Serveurs',
            'Postes de Travail',
            'Imprimantes',
            'Caméras de Surveillance',
            'Points d\'Accès WiFi',
            'Switches',
            'Routeurs',
            'Firewalls',
            'Storage',
            'UPS',
            'Équipements Audio/Vidéo',
        ];

        $descriptions = [
            'Unité contenant les équipements réseau principaux',
            'Serveurs de production et de test',
            'Ordinateurs de bureau et portables',
            'Imprimantes multifonctions et laser',
            'Système de vidéosurveillance',
            'Infrastructure WiFi',
            'Commutateurs réseau',
            'Équipements de routage',
            'Dispositifs de sécurité réseau',
            'Solutions de stockage',
            'Onduleurs et alimentation',
            'Équipements audiovisuels',
        ];

        $keywords = [
            'switch,router,firewall,cisco,juniper,hp network',
            'server,dell,hp proliant,linux,windows',
            'pc,desktop,laptop,windows,ubuntu',
            'printer,hp laserjet,canon,brother',
            'camera,surveillance,video,ip camera,dvr,nvr',
            'wifi,access point,wireless,802.11,cisco,aruba',
            'switch,commutateur,réseau,cisco,hp,aruba',
            'routeur,routage,internet,cisco,juniper,hp',
            'firewall,sécurité,protection,cisco,palo alto,fortinet',
            'storage,backup,nas,san,raid,disk,netapp,emc',
            'ups,onduleur,alimentation,power,apc,eaton',
            'audio,vidéo,multimédia,projecteur,écran,système son',
        ];

        return [
            'name' => $this->faker->randomElement($unitTypes) . ' - ' . $this->faker->randomElement(['Zone A', 'Zone B', 'Étage 1', 'Étage 2', 'Principal', 'Secondaire']),
            'description' => $this->faker->optional(0.7)->randomElement($descriptions),
            'keywords' => $this->faker->randomElement($keywords),
            'department_id' => Department::factory(),
        ];
    }

    /**
     * Indicate that the unité matériel is for network equipment.
     */
    public function network(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Équipements Réseau - ' . $this->faker->randomElement(['Principal', 'Secondaire', 'Zone A', 'Zone B']),
            'description' => 'Unité contenant les équipements réseau principaux (switches, routeurs, firewalls)',
        ]);
    }

    /**
     * Indicate that the unité matériel is for servers.
     */
    public function servers(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Serveurs - ' . $this->faker->randomElement(['Production', 'Test', 'Développement', 'Backup']),
            'description' => 'Unité contenant les serveurs de production et de test',
        ]);
    }

    /**
     * Indicate that the unité matériel is for workstations.
     */
    public function workstations(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Postes de Travail - ' . $this->faker->randomElement(['Étage 1', 'Étage 2', 'Open Space', 'Bureaux']),
            'description' => 'Ordinateurs de bureau et portables des employés',
        ]);
    }

    /**
     * Indicate that the unité matériel is unknown/default.
     */
    public function unknown(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Unknown Unité Matériel',
            'description' => 'Unité par défaut pour les appareils non classifiés',
        ]);
    }

    /**
     * Indicate that the unité matériel has no description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }
}
