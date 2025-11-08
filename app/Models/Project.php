<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'reference',
        'image_path',
        'created_by',
        'updated_by',
        'members'
    ];

    protected $with = ['products', 'createdBy'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function tasks()
    {
        // Get tasks through products
        return Task::whereHas('products', function($query) {
            $query->where('project_id', $this->id);
        });
    }

    public function getMembers()
    {
        if (empty($this->members)) {
            return collect();
        }
        $memberIds = array_filter(explode(',', $this->members));
        return User::whereIn('id', $memberIds)->get();
    }
}
