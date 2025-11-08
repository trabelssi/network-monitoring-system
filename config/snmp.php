<?php

return [
    'community' => env('SNMP_COMMUNITY', 'public'),
    'oid' => env('SNMP_OID', '1.3.6.1.2.1.1.1.0'),
    'timeout' => env('SNMP_TIMEOUT', 1),
    'retries' => env('SNMP_RETRIES', 2),
    'port' => env('SNMP_PORT', 161),
    'version' => env('SNMP_VERSION', 'v2c'),
    
    'communities' => [
        'public',
        'private',
        'community',
    ],
    
    'common_oids' => [
        'system_description' => '1.3.6.1.2.1.1.1.0',
        'system_object_id' => '1.3.6.1.2.1.1.2.0',
        'system_uptime' => '1.3.6.1.2.1.1.3.0',
        'system_contact' => '1.3.6.1.2.1.1.4.0',
        'system_name' => '1.3.6.1.2.1.1.5.0',
        'system_location' => '1.3.6.1.2.1.1.6.0',
        'system_services' => '1.3.6.1.2.1.1.7.0',
    ],
    
    'device_patterns' => [
        'cisco' => [
            'patterns' => ['cisco ios', 'cisco nx-os', 'cisco ios xe'],
            'vendor' => 'Cisco',
            'default_type' => 'router',
        ],
        'juniper' => [
            'patterns' => ['juniper', 'junos'],
            'vendor' => 'Juniper',
            'default_type' => 'router',
        ],
        'fortinet' => [
            'patterns' => ['fortigate', 'fortinet'],
            'vendor' => 'Fortinet',
            'default_type' => 'firewall',
        ],
        'palo alto' => [
            'patterns' => ['palo alto', 'pan-os'],
            'vendor' => 'Palo Alto',
            'default_type' => 'firewall',
        ],
        'hp' => [
            'patterns' => ['hp procurve', 'hp officejet'],
            'vendor' => 'HP',
            'default_type' => 'switch',
        ],
        'ubiquiti' => [
            'patterns' => ['ubiquiti', 'airmax'],
            'vendor' => 'Ubiquiti',
            'default_type' => 'access_point',
        ],
    ],
]; 