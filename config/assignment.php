<?php

return [
    /*
    |--------------------------------------------------------------------------
    | IP Range to Site Assignment Rules
    |--------------------------------------------------------------------------
    |
    | Define IP ranges and their corresponding site assignments.
    | Format: 'ip_range/cidr' => ['name' => 'Site Name', 'description' => '...']
    |
    */
    'ip_ranges' => [
        '192.168.1.0/24' => [
            'name' => 'Headquarters',
            'description' => 'Main office headquarters',
            'location' => 'Building A, Floor 1-3'
        ],
        '192.168.2.0/24' => [
            'name' => 'Branch Office 1',
            'description' => 'First branch office',
            'location' => 'Building B, Remote Site'
        ],
        '192.168.3.0/24' => [
            'name' => 'Branch Office 2',
            'description' => 'Second branch office',
            'location' => 'Building C, Remote Site'
        ],
        '10.0.0.0/24' => [
            'name' => 'Data Center',
            'description' => 'Primary data center',
            'location' => 'DC1, Server Room'
        ],
        '172.16.0.0/24' => [
            'name' => 'Management Network',
            'description' => 'Network management infrastructure',
            'location' => 'NOC, Management Room'
        ],
        '192.168.100.0/24' => [
            'name' => 'Test Laboratory',
            'description' => 'Testing and development environment',
            'location' => 'Lab Building, Floor 2'
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Device Type to Rack Assignment Rules
    |--------------------------------------------------------------------------
    |
    | Map device types to their preferred rack names.
    | Racks will be auto-created if they don't exist.
    |
    */
    'rack_assignment' => [
        'switch' => 'NETWORK-RACK-A',
        'router' => 'NETWORK-RACK-B',
        'server' => 'SERVER-RACK-01',
        'firewall' => 'SECURITY-RACK',
        'storage' => 'STORAGE-RACK',
        'ups' => 'INFRASTRUCTURE-RACK',
        'pdu' => 'INFRASTRUCTURE-RACK',
        'unknown' => 'MIXED-RACK'
    ],

    /*
    |--------------------------------------------------------------------------
    | Assignment Priority Rules
    |--------------------------------------------------------------------------
    |
    | Define priority order for assignment rules when conflicts occur.
    |
    */
    'priority' => [
        'ip_range',         // IP-based assignment has highest priority
        'hostname_pattern', // Hostname patterns second
        'snmp_data',        // SNMP data third
        'device_type'       // Device type fallback
    ],

    /*
    |--------------------------------------------------------------------------
    | Rack Configuration
    |--------------------------------------------------------------------------
    |
    | Standard rack configurations and sizing rules.
    |
    */
    'rack_config' => [
        'default_height' => 42, // Standard 42U rack
        'max_devices_per_rack' => 40, // Leave some space
        'thermal_zones' => [
            'bottom' => [1, 14],    // Cool zone (network equipment)
            'middle' => [15, 28],   // Warm zone (servers)
            'top' => [29, 42]       // Hot zone (power equipment)
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Device Size Standards (Rack Units)
    |--------------------------------------------------------------------------
    |
    | Standard rack unit requirements for different device types.
    |
    */
    'device_sizes' => [
        'switch' => 1,      // 1U
        'router' => 1,      // 1U
        'server' => 2,      // 2U (average)
        'firewall' => 1,    // 1U
        'storage' => 4,     // 4U (average)
        'ups' => 2,         // 2U
        'pdu' => 1,         // 1U
        'unknown' => 1      // 1U (safe default)
    ],

    /*
    |--------------------------------------------------------------------------
    | Hostname Patterns
    |--------------------------------------------------------------------------
    |
    | Regular expressions for hostname-based classification.
    |
    */
    'hostname_patterns' => [
        'switch' => '/^sw[-_]/',
        'router' => '/^rt[-_]/',
        'server' => '/^srv[-_]/',
        'firewall' => '/^fw[-_]/',
        'storage' => '/^(nas|san|storage)[-_]/',
        'wireless' => '/^ap[-_]/',
        'printer' => '/^pr[-_]/'
    ],

    /*
    |--------------------------------------------------------------------------
    | Assignment Exclusions
    |--------------------------------------------------------------------------
    |
    | IP addresses or patterns to exclude from automatic assignment.
    |
    */
    'exclusions' => [
        'ip_patterns' => [
            '/\.1$/',       // Gateway addresses (*.*.*.1)
            '/\.254$/',     // DHCP servers (*.*.*.254)
            '/\.255$/'      // Broadcast addresses
        ],
        'hostname_patterns' => [
            '/^temp[-_]/',  // Temporary devices
            '/^test[-_]/',  // Test devices (unless in test lab)
            '/^old[-_]/'    // Old/decommissioned devices
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Control assignment logging detail level.
    |
    */
    'logging' => [
        'enabled' => true,
        'level' => 'info',  // debug, info, warning, error
        'log_successful_assignments' => true,
        'log_failed_assignments' => true,
        'log_summary_stats' => true
    ]
];
