<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Intervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'description',
        'status',
        'image_path',
        'action_time',
        'rejection_comment',
        'rejection_image_path',
        'rating',
        'rating_comment'
    ];

    protected $casts = [
        'action_time' => 'datetime'
    ];

    // Relationship to Task
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // Relationship to User (the submitter)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function getRejectionImageUrlAttribute()
    {
        return $this->rejection_image_path ? asset('storage/' . $this->rejection_image_path) : null;
    }

    // Default action time to now
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($intervention) {
            if (empty($intervention->action_time)) {
                $intervention->action_time = now();
            }
        });
    }
}
