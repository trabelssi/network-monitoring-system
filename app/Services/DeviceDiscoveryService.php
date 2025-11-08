<?php

namespace App\Services;

use App\Models\DiscoveryQueue;
use Exception;
use Illuminate\Support\Facades\Log;

class DeviceDiscoveryService
{
    protected $snmpCommunity = 'public';
    protected $snmpTimeout = 5000000; // 5 seconds in microseconds
    protected $maxConcurrentPings = 10; // Limit concurrent operations

    /**
     * Discover devices from a single IP address
     */
    public function discoverSingleIP(string $ip): array
    {
        try {
            $discoveryResult = $this->discoverDevice($ip);
            
            if ($discoveryResult) {
                $this->storeInQueue($discoveryResult);
                return [
                    'success' => true,
                    'message' => "Device discovered at {$ip}",
                    'data' => $discoveryResult
                ];
            }
            
            return [
                'success' => false,
                'message' => "No device found at {$ip}",
                'data' => null
            ];
            
        } catch (Exception $e) {
            Log::error("Discovery failed for IP {$ip}: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Discovery failed: " . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Discover devices from a subnet
     */
    public function discoverSubnet(string $subnet): array
    {
        try {
            $ips = $this->generateIPsFromSubnet($subnet);
            $results = [];
            $discoveredCount = 0;
            
            Log::info("Starting subnet discovery for {$subnet}, scanning " . count($ips) . " IPs");
            
            // Process IPs in batches to avoid overwhelming the system
            $batches = array_chunk($ips, $this->maxConcurrentPings);
            
            foreach ($batches as $batch) {
                $batchResults = $this->processIPBatch($batch);
                $results = array_merge($results, $batchResults);
                
                // Small delay between batches
                usleep(100000); // 0.1 second
            }
            
            $discoveredCount = count(array_filter($results, fn($r) => $r['is_alive']));
            
            Log::info("Subnet discovery completed. Found {$discoveredCount} alive devices out of " . count($ips) . " IPs");
            
            return [
                'success' => true,
                'message' => "Subnet discovery completed. Found {$discoveredCount} alive devices.",
                'total_scanned' => count($ips),
                'alive_devices' => $discoveredCount,
                'results' => $results
            ];
            
        } catch (Exception $e) {
            Log::error("Subnet discovery failed for {$subnet}: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Subnet discovery failed: " . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Process a batch of IP addresses
     */
    protected function processIPBatch(array $ips): array
    {
        $results = [];
        
        foreach ($ips as $ip) {
            $result = $this->discoverDevice($ip);
            if ($result) {
                $this->storeInQueue($result);
                $results[] = $result;
            }
        }
        
        return $results;
    }

    /**
     * Discover a single device
     */
    protected function discoverDevice(string $ip): ?array
    {
        // Step 1: ICMP Ping
        $isAlive = $this->pingDevice($ip);
        
        if (!$isAlive) {
            // Store offline device in queue for tracking
            $this->storeInQueue([
                'ip_address' => $ip,
                'is_alive' => false,
                'snmp_available' => false,
                'sys_descr' => null,
                'sys_name' => null,
                'sys_contact' => null,
                'sys_object_id' => null,
                'sys_location' => null,
                'discovered_at' => now(),
                'discovery_status' => 'pending'
            ]);
            return null;
        }
        
        // Step 2: SNMP Query
        $snmpData = $this->querySNMP($ip);
        
        // Step 3: Build discovery record
        $discoveryRecord = [
            'ip_address' => $ip,
            'is_alive' => true,
            'snmp_available' => $snmpData['available'],
            'sys_descr' => $snmpData['sys_descr'] ?? null,
            'sys_name' => $snmpData['sys_name'] ?? null,
            'sys_contact' => $snmpData['sys_contact'] ?? null,
            'sys_object_id' => $snmpData['sys_object_id'] ?? null,
            'sys_location' => $snmpData['sys_location'] ?? null,
            'discovered_at' => now(),
            'discovery_status' => 'pending'
        ];
        
        return $discoveryRecord;
    }

    /**
     * Generate IP addresses from subnet notation
     */
    protected function generateIPsFromSubnet(string $subnet): array
    {
        if (!str_contains($subnet, '/')) {
            return [$subnet];
        }
        
        list($network, $cidr) = explode('/', $subnet);
        $cidr = (int) $cidr;
        
        // Validate CIDR
        if ($cidr < 8 || $cidr > 30) {
            throw new Exception("Invalid CIDR notation. Must be between /8 and /30");
        }
        
        $hosts = 2 ** (32 - $cidr) - 2; // Exclude network and broadcast
        $networkLong = ip2long($network);
        
        // Limit to reasonable scan size
        if ($hosts > 254) {
            $hosts = 254;
            Log::warning("Subnet {$subnet} is large, limiting scan to 254 hosts");
        }
        
        $ips = [];
        for ($i = 1; $i <= $hosts; $i++) {
            $ips[] = long2ip($networkLong + $i);
        }
        
        return $ips;
    }

    /**
     * Ping a device using ICMP
     */
    protected function pingDevice(string $ip): bool
    {
        $command = PHP_OS_FAMILY === 'Windows' 
            ? "ping -n 1 -w 1000 {$ip}" 
            : "ping -c 1 -W 1 {$ip}";
            
        exec($command, $output, $returnCode);
        return $returnCode === 0;
    }

    /**
     * Query SNMP for device information
     */
    protected function querySNMP(string $ip): array
    {
        try {
            // Check if SNMP extension is available
            if (!extension_loaded('snmp')) {
                Log::warning("SNMP extension not loaded, skipping SNMP queries");
                return [
                    'available' => false,
                    'error' => 'SNMP extension not loaded'
                ];
            }
            
            $session = new \SNMP(\SNMP::VERSION_2c, $ip, $this->snmpCommunity);
            $session->timeout = $this->snmpTimeout;
            $session->valueretrieval = SNMP_VALUE_PLAIN;
            
            // Standard SNMP OIDs
            $sysDescr = @$session->get('1.3.6.1.2.1.1.1.0'); // sysDescr
            $sysName = @$session->get('1.3.6.1.2.1.1.5.0'); // sysName
            $sysContact = @$session->get('1.3.6.1.2.1.1.4.0'); // sysContact
            $sysObjectID = @$session->get('1.3.6.1.2.1.1.2.0'); // sysObjectID
            $sysLocation = @$session->get('1.3.6.1.2.1.1.6.0'); // sysLocation
            
            $session->close();
            
            return [
                'available' => true,
                'sys_descr' => $this->cleanSNMPValue($sysDescr),
                'sys_name' => $this->cleanSNMPValue($sysName),
                'sys_contact' => $this->cleanSNMPValue($sysContact),
                'sys_object_id' => $this->cleanSNMPValue($sysObjectID),
                'sys_location' => $this->cleanSNMPValue($sysLocation)
            ];
            
        } catch (Exception $e) {
            Log::debug("SNMP query failed for {$ip}: " . $e->getMessage());
            return [
                'available' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Clean SNMP values
     */
    protected function cleanSNMPValue($value): ?string
    {
        if (!$value) return null;
        
        // Remove SNMP type indicators and clean up
        $cleaned = preg_replace('/^STRING:\s*/', '', $value);
        $cleaned = preg_replace('/^INTEGER:\s*/', '', $cleaned);
        $cleaned = preg_replace('/^OID:\s*/', '', $cleaned);
        $cleaned = trim($cleaned, '"');
        
        return $cleaned ?: null;
    }

    /**
     * Store discovery result in queue
     */
    protected function storeInQueue(array $data): void
    {
        try {
            DiscoveryQueue::updateOrCreate(
                ['ip_address' => $data['ip_address']],
                $data
            );
        } catch (Exception $e) {
            Log::error("Failed to store discovery result in queue: " . $e->getMessage());
        }
    }

    /**
     * Get discovery statistics
     */
    public function getDiscoveryStats(): array
    {
        $total = DiscoveryQueue::count();
        $pending = DiscoveryQueue::pending()->count();
        $processed = DiscoveryQueue::processed()->count();
        $failed = DiscoveryQueue::failed()->count();
        $alive = DiscoveryQueue::alive()->count();
        $snmpAvailable = DiscoveryQueue::snmpAvailable()->count();
        
        return [
            'total' => $total,
            'pending' => $pending,
            'processed' => $processed,
            'failed' => $failed,
            'alive' => $alive,
            'snmp_available' => $snmpAvailable,
            'recent_discoveries' => DiscoveryQueue::recent(24)->count()
        ];
    }

    /**
     * Clear old discovery records
     */
    public function clearOldRecords(int $days = 7): int
    {
        $cutoffDate = now()->subDays($days);
        return DiscoveryQueue::where('created_at', '<', $cutoffDate)->delete();
    }
}
