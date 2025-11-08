<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UniteMatériel extends Model
{
    use HasFactory;

    protected $table = 'unite_materiel';

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    protected $fillable = [
        'name',
        'description',
        'department_id',
        'keywords',
    ];

    protected $casts = [
        // Remove auto_assignment_rules as it doesn't exist in new schema
    ];

    /**
     * Mutators
     */
    public function setKeywordsAttribute($value)
    {
        if ($value) {
            // Convert to lowercase and clean up whitespace
            $keywords = array_map('trim', explode(',', strtolower($value)));
            $keywords = array_filter($keywords); // Remove empty values
            $this->attributes['keywords'] = implode(', ', $keywords);
        } else {
            $this->attributes['keywords'] = null;
        }
    }

    /**
     * Accessors
     */
    public function getKeywordsArrayAttribute()
    {
        if (!$this->keywords) {
            return [];
        }
        return array_map('trim', explode(',', $this->keywords));
    }

    /**
     * Relationships
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class, 'unit_id');
    }

    public function wirelessAccessPoints()
    {
        // Remove this relationship as it doesn't exist in new schema
        // return $this->hasMany(WirelessAccessPoint::class);
    }

    /**
     * Scopes
     */
    public function scopeReal($query)
    {
        return $query->where('name', '!=', 'Unknown Unité Matériel');
    }

    public function scopeUnknown($query)
    {
        return $query->where('name', 'Unknown Unité Matériel');
    }

    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Static helpers
     */
    public static function getUnknownUniteMatériel()
    {
        return static::where('name', 'Unknown Unité Matériel')->first();
    }

    /**
     * Accessors
     */
    public function getIsUnknownAttribute()
    {
        return $this->name === 'Unknown Unité Matériel';
    }

    public function getFullNameAttribute()
    {
        return $this->department->name . ' → ' . $this->name;
    }
}
