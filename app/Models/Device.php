<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Device extends Model
{
    use HasFactory;

    protected $table = 'device';

    protected $fillable = [
        'hostname',
        'ip_address',
        'is_alive',
        'snmp_available',
        'sys_descr',
        'sys_object_id',
        'sys_location',
        'sys_contact',
        'department_id',
        'unit_id',
        'user_name',
        'asset_number',
        'last_seen',
        'auto_assigned',
    ];

    protected $casts = [
        'is_alive' => 'boolean',
        'snmp_available' => 'boolean',
        'auto_assigned' => 'boolean',
        'last_seen' => 'datetime',
    ];

    // Relationships
    public function uniteMatériel()
    {
        return $this->belongsTo(UniteMatériel::class, 'unit_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(DeviceStatusHistory::class);
    }

    // Scopes for filtering
    public function scopeAlive($query)
    {
        return $query->where('is_alive', true);
    }

    public function scopeDown($query)
    {
        return $query->where('is_alive', false);
    }

    public function scopeSnmpAvailable($query)
    {
        return $query->where('snmp_available', true);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('department_id')->orWhereNull('unit_id');
    }

    // Helper methods
    public function isAlive()
    {
        return $this->is_alive;
    }

    public function isDown()
    {
        return !$this->is_alive;
    }

    public function hasSnmp()
    {
        return $this->snmp_available;
    }

    public function getStatusAttribute()
    {
        return $this->is_alive ? 'online' : 'offline';
    }

    public function getFullAssignmentPath()
    {
        $dept = $this->department ? $this->department->name : 'No Department';
        $unite = $this->uniteMatériel ? $this->uniteMatériel->name : 'No Unit';
        
        return $dept . ' → ' . $unite;
    }
}
