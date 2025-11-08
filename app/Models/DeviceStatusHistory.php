<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DeviceStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'device_status_history';

    protected $fillable = [
        'device_id',
        'status',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    protected $appends = [
        'formatted_date',
        'time_ago',
        'status_color',
        'status_icon'
    ];

    // Relationships
    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    // Scopes for filtering
    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    public function scopeOffline($query)
    {
        return $query->where('status', 'offline');
    }

    public function scopeByDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('changed_at', '>=', now()->subDays($days));
    }

    // Helper methods
    public function getStatusColorAttribute()
    {
        return $this->status === 'online' ? 'green' : 'red';
    }

    public function getStatusIconAttribute()
    {
        return $this->status === 'online' ? 'CheckCircleIcon' : 'XCircleIcon';
    }

    public function getTimeAgoAttribute()
    {
        return $this->changed_at ? $this->changed_at->diffForHumans() : 'Unknown';
    }

    public function getFormattedDateAttribute()
    {
        return $this->changed_at ? $this->changed_at->format('Y-m-d H:i:s') : 'Unknown';
    }
}
