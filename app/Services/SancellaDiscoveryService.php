<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use Exception;

class SancellaDiscoveryService
{
    public function discoverSubnet($subnet = '192.168.1.0/24')
    {
        $ips = $this->generateIPsFromSubnet($subnet);
        
        foreach ($ips as $ip) {
            $this->discoverDevice($ip);
        }
    }
    
    public function discoverDevice($ip)
    {
        // Step 1: ICMP Ping
        $icmpStatus = $this->pingDevice($ip);
        if ($icmpStatus !== 'online') {
            return null; // Skip offline devices
        }
        
        // Step 2: SNMP Query
        $snmpData = $this->querySNMP($ip);
        
        // Step 3: Auto-classify
        $classification = $this->autoClassifyDevice($ip, $snmpData);
        
        // Step 4: Save or update device
        return $this->saveDevice($ip, $snmpData, $classification, $icmpStatus);
    }
    
    private function generateIPsFromSubnet($subnet)
    {
        list($network, $cidr) = explode('/', $subnet);
        $hosts = 2 ** (32 - $cidr) - 2; // Exclude network and broadcast
        $networkLong = ip2long($network);
        
        $ips = [];
        for ($i = 1; $i <= min($hosts, 254); $i++) { // Limit to reasonable scan size
            $ips[] = long2ip($networkLong + $i);
        }
        
        return $ips;
    }
    
    private function pingDevice($ip)
    {
        $command = PHP_OS_FAMILY === 'Windows' 
            ? "ping -n 1 -w 5000 $ip" 
            : "ping -c 1 -W 5 $ip";
            
        exec($command, $output, $returnCode);
        return $returnCode === 0 ? 'online' : 'offline';
    }
    
    private function querySNMP($ip)
    {
        try {
            // Check if SNMP extension is available
            if (!extension_loaded('snmp')) {
                return ['status' => 'unavailable', 'error' => 'SNMP extension not loaded'];
            }
            
            $session = new \SNMP(\SNMP::VERSION_2c, $ip, 'public');
            $session->timeout = 5000000; // 5 seconds
            $session->valueretrieval = SNMP_VALUE_PLAIN;
            
            return [
                'sys_name' => @$session->get('1.3.6.1.2.1.1.5.0'),
                'sys_descr' => @$session->get('1.3.6.1.2.1.1.1.0'),
                'sys_location' => @$session->get('1.3.6.1.2.1.1.6.0'),
                'status' => 'available'
            ];
        } catch (Exception $e) {
            return ['status' => 'unavailable', 'error' => $e->getMessage()];
        }
    }
    
    private function autoClassifyDevice($ip, $snmpData)
    {
        // Rule 1: Department by IP range
        $department = $this->getDepartmentByIP($ip);
        
        // Rule 2: Unité Matériel by device type
        $uniteMatériel = $this->getUniteMatérielByType($snmpData['sys_descr'] ?? '');
        
        return [
            'department_id' => $department ? $department->id : $this->getUnknownDepartment()->id,
            'unite_materiel_id' => $uniteMatériel ? $uniteMatériel->id : $this->getUnknownUniteMatériel()->id,
        ];
    }
    
    private function getDepartmentByIP($ip)
    {
        return Department::real()->get()->first(function ($dept) use ($ip) {
            return $dept->containsIP($ip);
        });
    }
    
    private function getUniteMatérielByType($sysDescr)
    {
        $deviceType = $this->detectDeviceType($sysDescr);
        
        return UniteMatériel::real()->get()->first(function ($unite) use ($deviceType) {
            return $unite->matchesDeviceType($deviceType);
        });
    }
    
    private function detectDeviceType($sysDescr)
    {
        $sysDescr = strtolower($sysDescr);
        
        if (str_contains($sysDescr, 'printer') || str_contains($sysDescr, 'hp laserjet')) {
            return 'printer';
        }
        if (str_contains($sysDescr, 'switch') || str_contains($sysDescr, 'cisco')) {
            return 'switch';
        }
        if (str_contains($sysDescr, 'server') || str_contains($sysDescr, 'linux')) {
            return 'server';
        }
        if (str_contains($sysDescr, 'windows') || str_contains($sysDescr, 'pc')) {
            return 'workstation';
        }
        
        return 'unknown';
    }
    
    private function getUnknownDepartment()
    {
        return Department::where('name', 'Unknown Department')->first();
    }
    
    private function getUnknownUniteMatériel()
    {
        return UniteMatériel::where('name', 'Unknown Unité Matériel')->first();
    }
    
    private function cleanSNMPValue($value)
    {
        if (!$value) return null;
        
        // Remove SNMP type indicators and clean up
        $cleaned = preg_replace('/^STRING:\s*/', '', $value);
        $cleaned = preg_replace('/^INTEGER:\s*/', '', $cleaned);
        $cleaned = trim($cleaned, '"');
        
        return $cleaned ?: null;
    }
    
    private function saveDevice($ip, $snmpData, $classification, $icmpStatus)
    {
        return Device::updateOrCreate(
            ['ip_address' => $ip],
            [
                'hostname' => $this->cleanSNMPValue($snmpData['sys_name'] ?? null) ?: "device-" . str_replace('.', '-', $ip),
                'unite_materiel_id' => $classification['unite_materiel_id'],
                'department_id' => $classification['department_id'],
                'type' => $this->detectDeviceType($snmpData['sys_descr'] ?? ''),
                'icmp_status' => $icmpStatus,
                'snmp_status' => $snmpData['status'],
                'snmp_sys_name' => $this->cleanSNMPValue($snmpData['sys_name'] ?? null),
                'snmp_sys_descr' => $this->cleanSNMPValue($snmpData['sys_descr'] ?? null),
                'snmp_sys_location' => $this->cleanSNMPValue($snmpData['sys_location'] ?? null),
                'last_seen' => now(),
                'auto_assigned' => true,
                'assignment_date' => now(),
            ]
        );
    }
}
