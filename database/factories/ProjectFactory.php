<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $image = fake()->imageUrl(640, 480, 'projects');
        $imagePath = str_replace('https://via.placeholder.com/', '', $image);

        return [
            'name' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'reference' => fake()->word(),
            'members' => User::factory()->count(3)->create()->pluck('id')->join(','),
            'image_path' => $imagePath,
            'created_by' => User::factory(),
            'updated_by' => User::factory(),
        ];
    }
}
