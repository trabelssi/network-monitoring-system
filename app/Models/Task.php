<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;


    protected $fillable = [
        'name',
        'description',
        'assigned_user_id',
        'created_by',
        'updated_by',
        'image_path',
        'priority',
        'due_date'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($task) {
            $task->status = 'pending';
        });

        static::updating(function ($task) {
            // Only update status if it's not being manually set
            if (!array_key_exists('status', $task->getDirty())) {
                $task->status = $task->determineStatus();
            }
        });
    }

    public function determineStatus()
    {
        // Get all interventions ordered by latest first
        $interventions = $this->interventions()->orderBy('created_at', 'desc')->get();
        
        if ($interventions->isEmpty()) {
            return 'pending';
        }

        $latestIntervention = $interventions->first();
        
        // If latest intervention is approved, task is completed
        if ($latestIntervention->status === 'approved') {
            return 'completed';
        }
        
        // If there's any intervention (approved, rejected, or pending), task is in-progress
        return 'in-progress';
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id')
            ->withTrashed();
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by')
            ->withTrashed();
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by')
            ->withTrashed();
    }

    public function observers()
    {
        return $this->belongsToMany(User::class, 'task_user_observer')
            ->withTrashed();
    }

    public function interventions()
    {
        return $this->hasMany(Intervention::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_task');
    }
}
