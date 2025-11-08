<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Device>
 */
class DeviceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Device::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hostname' => $this->faker->unique()->domainWord() . '-' . $this->faker->numberBetween(1, 999),
            'ip_address' => $this->faker->localIpv4(),
            'is_alive' => $this->faker->boolean(70), // 70% chance of being alive
            'snmp_available' => $this->faker->boolean(60), // 60% chance of SNMP being available
            'sys_descr' => $this->faker->optional()->randomElement([
                'Cisco IOS Software',
                'Linux Ubuntu Server',
                'Windows Server',
                'HP ProLiant Server',
                'Dell PowerEdge Server',
                'Juniper Networks Device'
            ]),
            'sys_object_id' => $this->faker->optional()->regexify('1\.3\.6\.1\.4\.1\.[0-9]+\.[0-9]+\.[0-9]+'),
            'sys_location' => $this->faker->optional()->randomElement([
                'Data Center',
                'Office Building',
                'Server Room',
                'Network Closet',
                'Reception Desk',
                'Conference Room'
            ]),
            'department_id' => Department::factory(),
            'unit_id' => UniteMatériel::factory(),
            'user_name' => $this->faker->optional()->name(),
            'asset_number' => $this->faker->optional()->regexify('AST[0-9]{6}'),
            'last_seen' => $this->faker->optional()->dateTimeThisMonth(),
        ];
    }

    /**
     * Indicate that the device is online.
     */
    public function online(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alive' => true,
            'snmp_available' => true,
            'last_seen' => now(),
        ]);
    }

    /**
     * Indicate that the device is offline.
     */
    public function offline(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alive' => false,
            'snmp_available' => false,
        ]);
    }

    /**
     * Indicate that the device has SNMP available.
     */
    public function withSnmp(): static
    {
        return $this->state(fn (array $attributes) => [
            'snmp_available' => true,
            'sys_descr' => 'Cisco IOS Software',
            'sys_object_id' => '1.3.6.1.4.1.9.1.1',
        ]);
    }

    /**
     * Indicate that the device is a network device.
     */
    public function networkDevice(): static
    {
        return $this->state(fn (array $attributes) => [
            'hostname' => 'sw-' . $this->faker->numberBetween(1, 99),
            'sys_descr' => 'Cisco IOS Software',
            'is_alive' => true,
            'snmp_available' => true,
        ]);
    }
} 