<?php

namespace Database\Factories;

use App\Models\DiscoveryQueue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DiscoveryQueue>
 */
class DiscoveryQueueFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = DiscoveryQueue::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isAlive = $this->faker->boolean(80); // 80% chance of being alive
        $snmpAvailable = $isAlive && $this->faker->boolean(70); // 70% chance of SNMP if alive
        
        $deviceTypes = [
            'HP LaserJet Pro M404n Printer',
            'Cisco Catalyst 2960 Switch',
            'Dell PowerEdge R740 Server',
            'Windows 10 Workstation',
            'Ubuntu Linux Server',
            'HP EliteDesk 800 G5',
            'Cisco ISR 4321 Router',
            'HP ProLiant DL380 Gen10',
            'MacBook Pro (Intel)',
            'Ubuntu Desktop 22.04'
        ];
        
        $deviceNames = [
            'PRINTER-01',
            'SWITCH-CORE-01',
            'SERVER-WEB-01',
            'WS-JOHN-DOE',
            'SRV-LINUX-01',
            'PC-MARKETING-01',
            'ROUTER-EDGE-01',
            'SRV-DB-01',
            'MAC-ENGINEER-01',
            'UBUNTU-DEV-01'
        ];
        
        $contacts = [
            'admin@company.com',
            'network@company.com',
            'it-support@company.com',
            'helpdesk@company.com',
            'sysadmin@company.com',
            'tech@company.com',
            'support@company.com',
            'admin@company.com'
        ];
        
        $locations = [
            'IT Department - Server Room',
            'Marketing Department - Floor 2',
            'Sales Department - Floor 1',
            'HR Department - Floor 3',
            'Finance Department - Floor 4',
            'Engineering Department - Lab A',
            'Operations Department - Control Room',
            'Research Department - Lab B'
        ];
        
        return [
            'ip_address' => $this->faker->localIpv4(),
            'is_alive' => $isAlive,
            'snmp_available' => $snmpAvailable,
            'sys_descr' => $isAlive ? $this->faker->randomElement($deviceTypes) : null,
            'sys_name' => $snmpAvailable ? $this->faker->randomElement($deviceNames) : null,
            'sys_contact' => $snmpAvailable ? $this->faker->randomElement($contacts) : null,
            'sys_object_id' => $snmpAvailable ? $this->faker->regexify('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+') : null,
            'sys_location' => $snmpAvailable ? $this->faker->randomElement($locations) : null,
            'discovered_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'discovery_status' => $this->faker->randomElement(['pending', 'processed', 'failed']),
            'error_message' => $this->faker->optional(0.1)->sentence(),
        ];
    }

    /**
     * Indicate that the device is alive.
     */
    public function alive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alive' => true,
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
            'sys_descr' => null,
            'sys_name' => null,
            'sys_contact' => null,
            'sys_object_id' => null,
            'sys_location' => null,
        ]);
    }

    /**
     * Indicate that SNMP is available.
     */
    public function snmpAvailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'snmp_available' => true,
            'sys_descr' => $this->faker->randomElement([
                'HP LaserJet Pro M404n Printer',
                'Cisco Catalyst 2960 Switch',
                'Dell PowerEdge R740 Server',
                'Windows 10 Workstation'
            ]),
            'sys_name' => $this->faker->randomElement([
                'PRINTER-01',
                'SWITCH-CORE-01',
                'SERVER-WEB-01',
                'WS-JOHN-DOE'
            ]),
            'sys_contact' => $this->faker->randomElement([
                'admin@company.com',
                'network@company.com',
                'it-support@company.com'
            ]),
            'sys_object_id' => $this->faker->regexify('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+'),
            'sys_location' => $this->faker->randomElement([
                'IT Department - Server Room',
                'Marketing Department - Floor 2',
                'Sales Department - Floor 1'
            ]),
        ]);
    }

    /**
     * Indicate that the discovery is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'discovery_status' => 'pending',
        ]);
    }

    /**
     * Indicate that the discovery is processed.
     */
    public function processed(): static
    {
        return $this->state(fn (array $attributes) => [
            'discovery_status' => 'processed',
        ]);
    }

    /**
     * Indicate that the discovery failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'discovery_status' => 'failed',
            'error_message' => $this->faker->sentence(),
        ]);
    }

    /**
     * Generate a specific IP address.
     */
    public function withIP(string $ip): static
    {
        return $this->state(fn (array $attributes) => [
            'ip_address' => $ip,
        ]);
    }
}
