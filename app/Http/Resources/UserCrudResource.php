<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserCrudResource extends JsonResource
{

    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Count tasks created by this user
        $created_tasks_count = $this->createdTasks()->count();
        // Count tasks assigned to this user
        $assigned_tasks_count = $this->assignedTasks()->count();
        // Count interventions by status
        $accepted_interventions_count = $this->interventions()->where('status', 'approved')->count();
        $refused_interventions_count = $this->interventions()->where('status', 'rejected')->count();
        $pending_interventions_count = $this->interventions()->where('status', 'pending')->count();
        // Tasks by status
        $tasks_pending = $this->assignedTasks()->where('status', 'pending')->count();
        $tasks_in_progress = $this->assignedTasks()->where('status', 'in-progress')->count();
        $tasks_completed = $this->assignedTasks()->where('status', 'completed')->count();
        // Completion rate
        $completion_rate = $assigned_tasks_count > 0 ? round(($tasks_completed / $assigned_tasks_count) * 100) : 0;
        // Last activity (latest updated_at of assigned or created tasks)
        $last_task = $this->assignedTasks()->orderByDesc('updated_at')->first();
        $last_created_task = $this->createdTasks()->orderByDesc('updated_at')->first();
        $last_activity = null;
        if ($last_task && $last_created_task) {
            $last_activity = $last_task->updated_at > $last_created_task->updated_at ? $last_task->updated_at : $last_created_task->updated_at;
        } elseif ($last_task) {
            $last_activity = $last_task->updated_at;
        } elseif ($last_created_task) {
            $last_activity = $last_created_task->updated_at;
        }
        // Most active project (by assigned or created tasks)
        $projectCounts = [];
        foreach ($this->assignedTasks as $task) {
            if ($task->products && $task->products->first() && $task->products->first()->project) {
                $projectName = $task->products->first()->project->name;
                $projectCounts[$projectName] = ($projectCounts[$projectName] ?? 0) + 1;
            }
        }
        foreach ($this->createdTasks as $task) {
            if ($task->products && $task->products->first() && $task->products->first()->project) {
                $projectName = $task->products->first()->project->name;
                $projectCounts[$projectName] = ($projectCounts[$projectName] ?? 0) + 1;
            }
        }
        $most_active_project = null;
        if (!empty($projectCounts)) {
            arsort($projectCounts);
            $most_active_project = array_key_first($projectCounts);
        }
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'is_admin' => $this->isAdmin(),
            'is_active' => $this->is_active,
            'is_deleted' => $this->trashed(),
            'deleted_at' => $this->deleted_at ? (new Carbon($this->deleted_at))->format('Y-m-d H:i:s') : null,
            'created_at' => (new Carbon($this->created_at))->format('Y-m-d H:i:s'),
            // Add statistics
            'created_tasks_count' => $created_tasks_count,
            'assigned_tasks_count' => $assigned_tasks_count,
            'accepted_interventions_count' => $accepted_interventions_count,
            'refused_interventions_count' => $refused_interventions_count,
            'pending_interventions_count' => $pending_interventions_count,
            'tasks_pending' => $tasks_pending,
            'tasks_in_progress' => $tasks_in_progress,
            'tasks_completed' => $tasks_completed,
            'completion_rate' => $completion_rate,
            'last_activity' => $last_activity ? (new Carbon($last_activity))->format('Y-m-d H:i:s') : null,
            'most_active_project' => $most_active_project,
            'stats' => [
                'tasks' => [
                    'pending' => $tasks_pending,
                    'in_progress' => $tasks_in_progress,
                    'completed' => $tasks_completed,
                ],
                'interventions' => [
                    'approved' => $accepted_interventions_count,
                    'rejected' => $refused_interventions_count,
                    'pending' => $pending_interventions_count,
                ],
                'completion_rate' => $completion_rate,
                'last_activity' => $last_activity ? (new Carbon($last_activity))->format('Y-m-d H:i:s') : null,
                'most_active_project' => $most_active_project,
            ],
        ];
    }
}
