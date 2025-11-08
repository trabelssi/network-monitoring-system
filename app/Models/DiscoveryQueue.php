<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DiscoveryQueue extends Model
{
    use HasFactory;

    protected $table = 'discovery_queue';

    protected $fillable = [
        'ip_address',
        'is_alive',
        'snmp_available',
        'sys_descr',
        'sys_name',
        'sys_contact',
        'sys_object_id',
        'sys_location',
        'discovered_at',
        'discovery_status',
        'error_message'
    ];

    protected $casts = [
        'is_alive' => 'boolean',
        'snmp_available' => 'boolean',
        'discovered_at' => 'datetime',
    ];

    /**
     * Boot the model to ensure proper encoding
     */
    protected static function boot()
    {
        parent::boot();
        
        static::retrieved(function ($model) {
            // Ensure all text fields are properly encoded
            $textFields = ['sys_descr', 'sys_name', 'sys_contact', 'sys_location', 'error_message'];
            foreach ($textFields as $field) {
                if ($model->$field && !mb_check_encoding($model->$field, 'UTF-8')) {
                    $model->$field = mb_convert_encoding($model->$field, 'UTF-8', 'UTF-8');
                }
            }
        });
    }

    // Scopes for filtering
    public function scopePending($query)
    {
        return $query->where('discovery_status', 'pending');
    }

    public function scopeProcessed($query)
    {
        return $query->where('discovery_status', 'processed');
    }

    public function scopeFailed($query)
    {
        return $query->where('discovery_status', 'failed');
    }

    public function scopeAlive($query)
    {
        return $query->where('is_alive', true);
    }

    public function scopeSnmpAvailable($query)
    {
        return $query->where('snmp_available', true);
    }

    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('discovered_at', '>=', now()->subHours($hours));
    }

    // Helper methods
    public function isPending()
    {
        return $this->discovery_status === 'pending';
    }

    public function isProcessed()
    {
        return $this->discovery_status === 'processed';
    }

    public function isFailed()
    {
        return $this->discovery_status === 'failed';
    }

    public function markAsProcessed()
    {
        $this->update(['discovery_status' => 'processed']);
    }

    public function markAsFailed($errorMessage = null)
    {
        $this->update([
            'discovery_status' => 'failed',
            'error_message' => $errorMessage
        ]);
    }

    public function getStatusColor()
    {
        return match($this->discovery_status) {
            'pending' => 'yellow',
            'processed' => 'green',
            'failed' => 'red',
            default => 'gray'
        };
    }

    public function getDeviceType()
    {
        if (!$this->sys_descr) return 'Unknown';
        
        $descr = strtolower($this->sys_descr);
        
        if (str_contains($descr, 'printer') || str_contains($descr, 'hp laserjet')) {
            return 'Printer';
        }
        if (str_contains($descr, 'switch') || str_contains($descr, 'cisco')) {
            return 'Switch';
        }
        if (str_contains($descr, 'server') || str_contains($descr, 'linux')) {
            return 'Server';
        }
        if (str_contains($descr, 'windows') || str_contains($descr, 'pc')) {
            return 'Workstation';
        }
        if (str_contains($descr, 'router')) {
            return 'Router';
        }
        
        return 'Unknown';
    }

    public function getFormattedDiscoveredAt()
    {
        return $this->discovered_at->format('M j, Y H:i:s');
    }
}
