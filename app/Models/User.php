<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $role
 * @property string $name
 * @property string $email
 * @property string $password
 * @property \Carbon\Carbon|null $email_verified_at
 * @property boolean $is_active
 */
class User extends Authenticatable implements MustVerifyEmail   
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::forceDeleting(function (User $user) {
            // Delete related interventions
            $user->interventions()->forceDelete();

            // Delete related notifications
            $user->notifications()->forceDelete();

            // Delete related activity logs
            ActivityLog::where('user_id', $user->id)->forceDelete();

            // Handle tasks where this user is assigned
            // Instead of setting to null, we'll reassign to the first admin user
            $adminUser = \App\Models\User::where('role', self::ROLE_ADMIN)
                ->where('id', '!=', $user->id)
                ->first();

            if ($adminUser) {
                \App\Models\Task::where('assigned_user_id', $user->id)
                    ->update(['assigned_user_id' => $adminUser->id]);
            } else {
                // If no admin user found, we need to delete the tasks
                \App\Models\Task::where('assigned_user_id', $user->id)->delete();
            }

            // Handle tasks created or updated by this user
            \App\Models\Task::where('created_by', $user->id)->update(['created_by' => $adminUser ? $adminUser->id : 1]);
            \App\Models\Task::where('updated_by', $user->id)->update(['updated_by' => $adminUser ? $adminUser->id : 1]);

            // Detach user from observed tasks (pivot table)
            $user->observedTasks()->detach();
        });
    }

    // Role definitions
    const ROLE_ADMIN = 'admin';
    const ROLE_USER = 'user';
    
    // Default role
    const DEFAULT_ROLE = self::ROLE_USER;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'role',
        'is_active',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    /*
     * Role related methods
     */
    
    /**
     * Check if user has a specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN);
    }

    /**
     * Check if user is a regular user
     */
    public function isUser(): bool
    {
        return $this->hasRole(self::ROLE_USER);
    }

    /**
     * Get all available roles.
     *
     * @return array<string, string>
     */
    public static function getAvailableRoles(): array
    {
        return [
            self::ROLE_ADMIN => 'Administrator',
            self::ROLE_USER => 'Regular User',
        ];
    }

    /**
     * Get the user's interventions.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function interventions(): HasMany
    {
        return $this->hasMany(Intervention::class);
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(\App\Models\Task::class, 'assigned_user_id');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(\App\Models\Task::class, 'created_by');
    }

    public function updatedTasks(): HasMany
    {
        return $this->hasMany(\App\Models\Task::class, 'updated_by');
    }

    public function observedTasks()
    {
        return $this->belongsToMany(\App\Models\Task::class, 'task_user_observer');
    }

    /**
     * Get all of the user's notifications.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function notifications(): MorphMany
    {
        return $this->morphMany(\Illuminate\Notifications\DatabaseNotification::class, 'notifiable')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the user's unread notifications.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function unreadNotifications(): MorphMany
    {
        return $this->morphMany(\Illuminate\Notifications\DatabaseNotification::class, 'notifiable')
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get the user's read notifications.
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function readNotifications(): MorphMany
    {
        return $this->morphMany(\Illuminate\Notifications\DatabaseNotification::class, 'notifiable')
            ->whereNotNull('read_at')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->whereNull('deleted_at');
    }

    /**
     * Scope a query to only include deactivated users.
     */
    public function scopeDeactivated($query)
    {
        return $query->where(function($q) {
            $q->where('is_active', false)
              ->orWhereNotNull('deleted_at');
        });
    }

    /**
     * Check if the user is active
     */
    public function isActive(): bool
    {
        return $this->is_active && !$this->trashed();
    }
}
