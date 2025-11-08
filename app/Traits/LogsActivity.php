<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    protected function logActivity(string $action, string $description, array $properties = []): void
    {
        try {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'description' => $description,
                'model_type' => class_basename($this),
                'model_id' => $this->id ?? null,
                'properties' => $properties,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log activity', [
                'error' => $e->getMessage(),
                'action' => $action,
                'description' => $description
            ]);
        }
    }
} 