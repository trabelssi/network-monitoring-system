<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Task;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Intervention>
 */
class InterventionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'approved', 'rejected']);
        return [
            'user_id' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'task_id' => Task::inRandomOrder()->first()?->id ?? Task::factory(),
            'action_time' => fake()->dateTimeThisMonth(),
            'description' => fake()->paragraphs(3, true),
            'status' => $status,
            'image_path' => fake()->optional()->imageUrl(),
            'rejection_comment' => $status === 'rejected' ? fake()->paragraph() : null,
            'rejection_image_path' => $status === 'rejected' ? fake()->optional()->imageUrl() : null,
            'rating_comment' => $status === 'approved' ? fake()->paragraph() : null,
        ];
    }
}
