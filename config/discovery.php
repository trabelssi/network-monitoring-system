<?php

return [
    'snmp' => [
        'communities' => ['public', 'private'],
        'timeout' => 1,
        'retries' => 2,
        'version' => SNMP::VERSION_2c, // Fixed: Using proper SNMP version constant
    ],
    
    'device_types' => [
        'network' => [
            'patterns' => [
                'cisco ios' => ['vendor' => 'Cisco', 'type' => 'router', 'os' => 'IOS'],
                'cisco nx-os' => ['vendor' => 'Cisco', 'type' => 'switch', 'os' => 'NX-OS'],
                'juniper' => ['vendor' => 'Juniper', 'type' => 'router', 'os' => 'JunOS'],
                'arista' => ['vendor' => 'Arista', 'type' => 'switch', 'os' => 'EOS'],
                'fortigate' => ['vendor' => 'Fortinet', 'type' => 'firewall', 'os' => 'FortiOS'],
                'palo alto' => ['vendor' => 'Palo Alto', 'type' => 'firewall', 'os' => 'PAN-OS'],
            ],
        ],
        'infrastructure' => [
            'patterns' => [
                'windows' => ['type' => 'server', 'os' => 'Windows'],
                'linux' => ['type' => 'server', 'os' => 'Linux'],
                'vmware' => ['type' => 'hypervisor', 'os' => 'ESXi'],
                'xenserver' => ['type' => 'hypervisor', 'os' => 'XenServer'],
            ],
        ],
        'endpoints' => [
            'patterns' => [
                'printer' => ['type' => 'printer'],
                'camera' => ['type' => 'camera'],
                'ups' => ['type' => 'ups'],
            ],
        ],
    ],
    
    'subnets' => [
        'office' => '192.168.1.0/24',
        'servers' => '10.0.0.0/24',
        'management' => '172.16.0.0/24',
    ],
    
    'exclude' => [
        'ips' => [
            '192.168.1.1',  // Gateway
            '192.168.1.254', // DHCP Server
        ],
        'ranges' => [
            '192.168.1.100-192.168.1.200', // DHCP Range
        ],
    ],
]; 