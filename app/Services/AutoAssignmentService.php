<?php

namespace App\Services;

use App\Models\DiscoveryQueue;
use App\Models\Device;
use App\Models\Department;
use App\Models\UniteMatériel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class AutoAssignmentService
{
    /**
     * Process auto-assignment for all pending devices
     */
    public function processAutoAssignment(): array
    {
        $startTime = microtime(true);
        $stats = [
            'total_pending' => 0,
            'processed' => 0,
            'failed' => 0,
            'created' => 0,
            'updated' => 0,
            'scenarios' => [
                'nothing_matches' => 0,
                'only_department' => 0,
                'only_unit' => 0,
                'only_user' => 0,
                'dept_unit_no_user' => 0,
                'dept_user_no_unit' => 0,
                'unit_user_no_dept' => 0,
                'all_three_found' => 0,
                'dept_only' => 0,
                'unit_only' => 0,
                'user_only' => 0,
                'dept_unit_user' => 0,
                'dept_user_unit_unrecognized' => 0,
                'unit_user_dept_unrecognized' => 0
            ],
            'errors' => []
        ];

        try {
            // Get all pending devices from discovery queue
            $pendingDevices = DiscoveryQueue::pending()->get();
            $stats['total_pending'] = $pendingDevices->count();

            if ($pendingDevices->isEmpty()) {
                return [
                    'success' => true,
                    'message' => 'No pending devices to process',
                    'stats' => $stats
                ];
            }

            Log::info("Starting auto-assignment for {$stats['total_pending']} pending devices");

            // Process each pending device
            foreach ($pendingDevices as $discoveryRecord) {
                try {
                    $result = $this->processSingleDevice($discoveryRecord);
                    
                    if ($result['success']) {
                        $stats['processed']++;
                        $stats['scenarios'][$result['scenario']]++;
                        
                        if ($result['action'] === 'created') {
                            $stats['created']++;
                        } else {
                            $stats['updated']++;
                        }
                        
                        // Mark as processed
                        $discoveryRecord->markAsProcessed();
                    } else {
                        $stats['failed']++;
                        $stats['errors'][] = "IP {$discoveryRecord->ip_address}: {$result['error']}";
                        
                        // Mark as failed with error
                        $discoveryRecord->markAsFailed($result['error']);
                    }
                } catch (Exception $e) {
                    $stats['failed']++;
                    $errorMsg = "IP {$discoveryRecord->ip_address}: " . $e->getMessage();
                    $stats['errors'][] = $errorMsg;
                    Log::error($errorMsg);
                    
                    // Mark as failed
                    $discoveryRecord->markAsFailed($e->getMessage());
                }
            }

            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Log::info("Auto-assignment completed in {$executionTime}ms", $stats);

            return [
                'success' => true,
                'message' => "Auto-assignment completed successfully. Processed: {$stats['processed']}, Created: {$stats['created']}, Updated: {$stats['updated']}, Failed: {$stats['failed']}",
                'stats' => $stats,
                'execution_time_ms' => $executionTime
            ];

        } catch (Exception $e) {
            Log::error("Auto-assignment service failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Auto-assignment failed: " . $e->getMessage(),
                'stats' => $stats
            ];
        }
    }

    /**
     * Process a single device from discovery queue
     * Implements all 14 auto-assignment scenarios
     */
    private function processSingleDevice(DiscoveryQueue $discoveryRecord): array
    {
        try {
            // Extract SNMP data
            $sysLocation = $discoveryRecord->sys_location;
            $sysName = $discoveryRecord->sys_name;
            $sysContact = $discoveryRecord->sys_contact;
            
            // Determine classification results
            $department = $this->determineDepartment($sysLocation);
            $unit = $this->determineUnit($sysName, $department);
            $user = $this->determineUser($sysContact);
            
            // Determine which scenario this represents
            $scenario = $this->determineScenario($sysLocation, $sysName, $sysContact, $department, $unit, $user);
            
            // Prepare device data
            $deviceData = $this->prepareDeviceData($discoveryRecord, $department, $unit, $user);
            
            // Save or update device
            $device = $this->saveDevice($deviceData);
            
            Log::info("Device {$discoveryRecord->ip_address} processed with scenario: {$scenario}", [
                'scenario' => $scenario,
                'department' => $department?->name ?? 'None',
                'unit' => $unit?->name ?? 'None',
                'user' => $user
            ]);
            
            return [
                'success' => true,
                'action' => $device->wasRecentlyCreated ? 'created' : 'updated',
                'device_id' => $device->id,
                'scenario' => $scenario
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Determine which of the 14 scenarios this device represents
     */
    private function determineScenario(?string $sysLocation, ?string $sysName, ?string $sysContact, ?Department $department, ?UniteMatériel $unit, string $user): string
    {
        $hasLocation = !empty($sysLocation);
        $hasName = !empty($sysName);
        $hasContact = !empty($sysContact);
        
        $deptFound = $department && $department->name !== 'Unknown Department';
        $unitFound = $unit && $unit->name !== 'Unknown Unité Matériel';
        $userFound = $user !== 'Unknown User';
        
        // Scenario 1: Nothing matches
        if (!$deptFound && !$unitFound && !$userFound) {
            return 'nothing_matches';
        }
        
        // Scenario 2: Only Department found
        if ($deptFound && !$unitFound && !$userFound) {
            return 'only_department';
        }
        
        // Scenario 3: Only Unit found
        if (!$deptFound && $unitFound && !$userFound) {
            return 'only_unit';
        }
        
        // Scenario 4: Only User found
        if (!$deptFound && !$unitFound && $userFound) {
            return 'only_user';
        }
        
        // Scenario 5: Department & Unit found, User missing
        if ($deptFound && $unitFound && !$userFound) {
            return 'dept_unit_no_user';
        }
        
        // Scenario 6: Department & User found, Unit missing
        if ($deptFound && !$unitFound && $userFound) {
            return 'dept_user_no_unit';
        }
        
        // Scenario 7: Unit & User found, Department missing
        if (!$deptFound && $unitFound && $userFound) {
            return 'unit_user_no_dept';
        }
        
        // Scenario 8: All three found
        if ($deptFound && $unitFound && $userFound) {
            return 'all_three_found';
        }
        
        // Scenario 9: Department found, Unit & User missing
        if ($deptFound && !$unitFound && !$userFound) {
            return 'dept_only';
        }
        
        // Scenario 10: Unit found, Department & User missing
        if (!$deptFound && $unitFound && !$userFound) {
            return 'unit_only';
        }
        
        // Scenario 11: User found, Department & Unit missing
        if (!$deptFound && !$unitFound && $userFound) {
            return 'user_only';
        }
        
        // Scenario 12: Department & Unit found, User found
        if ($deptFound && $unitFound && $userFound) {
            return 'dept_unit_user';
        }
        
        // Scenario 13: Department & User found, Unit found but unrecognized keyword
        if ($deptFound && $userFound && !$unitFound) {
            return 'dept_user_unit_unrecognized';
        }
        
        // Scenario 14: Unit & User found, Department found but unrecognized location
        if (!$deptFound && $unitFound && $userFound) {
            return 'unit_user_dept_unrecognized';
        }
        
        // Fallback
        return 'nothing_matches';
    }

    /**
     * Determine department based on sysLocation
     */
    private function determineDepartment(?string $sysLocation): ?Department
    {
        if (empty($sysLocation)) {
            return $this->getUnknownDepartment();
        }

        // Try to find exact match first
        $department = Department::where('name', 'like', "%{$sysLocation}%")
            ->orWhere('description', 'like', "%{$sysLocation}%")
            ->first();

        if ($department) {
            return $department;
        }

        // Try partial matching with common location patterns
        $location = strtolower(trim($sysLocation));
        
        if (str_contains($location, 'it') || str_contains($location, 'informatique')) {
            return Department::where('name', 'like', '%Informatique%')->first() ?? $this->getUnknownDepartment();
        }
        
        if (str_contains($location, 'hr') || str_contains($location, 'rh') || str_contains($location, 'ressources humaines')) {
            return Department::where('name', 'like', '%Ressources Humaines%')->first() ?? $this->getUnknownDepartment();
        }
        
        if (str_contains($location, 'prod') || str_contains($location, 'production')) {
            return Department::where('name', 'like', '%Production%')->first() ?? $this->getUnknownDepartment();
        }
        
        if (str_contains($location, 'admin') || str_contains($location, 'administration')) {
            return Department::where('name', 'like', '%Administration%')->first() ?? $this->getUnknownDepartment();
        }

        return $this->getUnknownDepartment();
    }

    /**
     * Determine unit based on sysName and department
     */
    private function determineUnit(?string $sysName, ?Department $department): ?UniteMatériel
    {
        if (empty($sysName)) {
            return $this->getUnknownUniteMatériel($department);
        }

        // Get all units (with department filter if available)
        $query = UniteMatériel::query();
        if ($department && $department->name !== 'Unknown Department') {
            $query->where('department_id', $department->id);
        }
        
        $units = $query->get();

        // Check each unit's keywords against sysName
        foreach ($units as $unit) {
            if ($this->unitMatchesKeywords($unit, $sysName)) {
                return $unit;
            }
        }

        // If no match found, return unknown unit under the department
        return $this->getUnknownUniteMatériel($department);
    }

    /**
     * Check if unit keywords match sysName
     */
    private function unitMatchesKeywords(UniteMatériel $unit, string $sysName): bool
    {
        if (empty($unit->keywords)) {
            return false;
        }

        $sysNameLower = strtolower(trim($sysName));
        $keywords = array_map('trim', explode(',', strtolower($unit->keywords)));

        foreach ($keywords as $keyword) {
            if (str_contains($sysNameLower, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine user from sysContact
     */
    private function determineUser(?string $sysContact): string
    {
        if (empty($sysContact)) {
            return 'Unknown User';
        }

        // Clean up the contact information
        $contact = trim($sysContact);
        
        // Remove common prefixes/suffixes
        $contact = preg_replace('/^(contact|user|admin|tech|support):\s*/i', '', $contact);
        $contact = preg_replace('/\s*<.*>.*$/', '', $contact); // Remove email addresses
        
        return empty($contact) ? 'Unknown User' : $contact;
    }

    /**
     * Prepare device data for insertion/update
     */
    private function prepareDeviceData(DiscoveryQueue $discoveryRecord, ?Department $department, ?UniteMatériel $unit, string $user): array
    {
        return [
            'ip_address' => $discoveryRecord->ip_address,
            'hostname' => $discoveryRecord->sys_name ?: 'Unknown-' . $discoveryRecord->ip_address,
            'is_alive' => $discoveryRecord->is_alive,
            'snmp_available' => $discoveryRecord->snmp_available,
            'sys_descr' => $discoveryRecord->sys_descr,
            'sys_object_id' => $discoveryRecord->sys_object_id,
            'sys_location' => $discoveryRecord->sys_location,
            'sys_contact' => $discoveryRecord->sys_contact,
            'department_id' => $department?->id,
            'unit_id' => $unit?->id,
            'user_name' => $user,
            'auto_assigned' => true, // Mark as automatically assigned
            'last_seen' => $discoveryRecord->discovered_at,
            'asset_number' => null, // Will be set manually later
        ];
    }

    /**
     * Save or update device in the main table
     */
    private function saveDevice(array $deviceData): Device
    {
        return Device::updateOrCreate(
            ['ip_address' => $deviceData['ip_address']],
            $deviceData
        );
    }

    /**
     * Get the Unknown Department
     */
    private function getUnknownDepartment(): ?Department
    {
        return Department::where('name', 'Unknown Department')->first();
    }

    /**
     * Get the Unknown Unité Matériel (create if doesn't exist)
     */
    private function getUnknownUniteMatériel(?Department $department): ?UniteMatériel
    {
        $departmentId = $department?->id ?? $this->getUnknownDepartment()?->id;
        
        if (!$departmentId) {
            Log::error("Cannot find Unknown Department for Unknown Unité Matériel");
            return null;
        }

        $unknownUnit = UniteMatériel::where('name', 'Unknown Unité Matériel')
            ->where('department_id', $departmentId)
            ->first();

        if (!$unknownUnit) {
            // Create Unknown Unité Matériel if it doesn't exist
            $unknownUnit = UniteMatériel::create([
                'name' => 'Unknown Unité Matériel',
                'description' => 'Unité par défaut pour les appareils non classifiés',
                'department_id' => $departmentId,
                'keywords' => 'unknown,default,unclassified'
            ]);
        }

        return $unknownUnit;
    }

    /**
     * Get statistics about pending devices
     */
    public function getPendingStats(): array
    {
        $total = DiscoveryQueue::pending()->count();
        $alive = DiscoveryQueue::pending()->alive()->count();
        $withSnmp = DiscoveryQueue::pending()->snmpAvailable()->count();
        
        return [
            'total_pending' => $total,
            'alive_devices' => $alive,
            'with_snmp' => $withSnmp,
            'can_process' => $total > 0
        ];
    }
}
