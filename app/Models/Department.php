<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $table = 'department';

    protected $fillable = [
                'name',

        'description',
    ];

    protected $casts = [
        // Remove old casts as those fields don't exist anymore
    ];

    /**
     * Relationships
     */
    public function uniteMateriels()
    {
        return $this->hasMany(UniteMatériel::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    /**
     * Scopes
     */
    public function scopeReal($query)
    {
        return $query->where('name', '!=', 'Unknown Department');
    }

    public function scopeUnknown($query)
    {
        return $query->where('name', 'Unknown Department');
    }

    /**
     * Static helpers
     */
    public static function getUnknownDepartment()
    {
        return static::where('name', 'Unknown Department')->first();
    }

    /**
     * Accessors
     */
    public function getIsUnknownAttribute()
    {
        return $this->name === 'Unknown Department';
    }
}
