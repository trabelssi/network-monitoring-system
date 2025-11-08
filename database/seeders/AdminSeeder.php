<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        User::updateOrCreate(
            ['email' => 'tri000419@gmail.com'],
            [
                'name' => 'admin',
                'password' => bcrypt('123.321A'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'traa10795@gmail.com'],
            [
                'name' => 'amine',
                'password' => bcrypt('123.321A'),
                'email_verified_at' => now(),
            ]
        );
    }
}