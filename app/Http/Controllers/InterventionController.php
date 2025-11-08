<?php

namespace App\Http\Controllers;

use App\Models\Intervention;
use App\Models\User;
use App\Http\Requests\StoreInterventionRequest;
use App\Http\Requests\UpdateInterventionRequest;
use App\Http\Resources\InterventionResource;
use App\Http\Resources\ProjectResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Notifications\InterventionSubmittedNotification;
use App\Notifications\InterventionRatedNotification;
use App\Models\ActivityLog;
use App\Notifications\InterventionObserverNotification;
use App\Notifications\InterventionRatingObserverNotification;

class InterventionController extends Controller
{

public function index()
{
    $request = request();

    $query = Intervention::query()
        ->with([
            'user' => function ($query) {
                $query->select('id', 'name', 'is_active', 'deleted_at');
            },
            'task' => function ($query) {
                $query->with([
                    'products.project',
                    'assignedUser' => function ($query) {
                        $query->select('id', 'name', 'is_active', 'deleted_at');
                    },
                    'createdBy' => function ($query) {
                        $query->select('id', 'name', 'is_active', 'deleted_at');
                    }
                ]);
            }
        ]);

    // Apply search filter
    if ($request->filled('search')) {
        $searchTerm = $request->input('search');
        $query->where(function ($q) use ($searchTerm) {
            $q->whereHas('task', function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            })
            ->orWhereHas('user', function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%");
            })
            ->orWhere('description', 'like', "%{$searchTerm}%");
        });
    }

    // Apply status filter
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    // Apply date range filters
    if ($request->filled('from_date')) {
        $query->whereDate('action_time', '>=', $request->from_date);
    }

    if ($request->filled('to_date')) {
        $query->whereDate('action_time', '<=', $request->to_date);
    }

    // Apply task name filter
    if ($request->filled('task_name')) {
        $query->whereHas('task', function ($q) use ($request) {
            $q->where('name', 'like', '%' . $request->task_name . '%');
        });
    }

    // Apply project filter
    if ($request->filled('project_id')) {
        $query->whereHas('task.products.project', function ($q) use ($request) {
            $q->where('projects.id', $request->project_id);
        });
    }

    // Apply user filter
    if ($request->filled('user_id')) {
        $query->where('user_id', $request->user_id);
    }

    // Apply assigned user filter
    if ($request->filled('assigned_user_id')) {
        $query->whereHas('task', function ($q) use ($request) {
            $q->where('assigned_user_id', $request->assigned_user_id);
        });
    }

    // Apply sorting
    $sortField = $request->input('sort_field', 'created_at');
    $sortDirection = $request->input('sort_direction', 'desc');
    
    // Validate sort field to prevent SQL injection
    $allowedSortFields = ['id', 'status', 'action_time', 'created_at', 'updated_at'];
    if (!in_array($sortField, $allowedSortFields)) {
        $sortField = 'created_at';
    }
    
    $query->orderBy($sortField, $sortDirection);

    // Get paginated results
    $interventions = $query->paginate(10)
        ->onEachSide(1)
        ->withQueryString();

    // Get filter options
    $projects = Project::query()
        ->orderBy('name', 'asc')
        ->get(['id', 'name']);
    
    // Only get tasks assigned to current user for the modal
    $tasks = Task::query()
        ->where('assigned_user_id', Auth::id())
        ->with(['products.project', 'assignedUser:id,name', 'createdBy:id,name'])
        ->orderBy('created_at', 'desc')
        ->get();

    $users = User::select('id', 'name')
        ->orderBy('name')
        ->get();

    return inertia('Intervention/Index', [
        'interventions' => InterventionResource::collection($interventions),
        'tasks' => $tasks,
        'projects' => $projects,
        'users' => $users,
        'queryParams' => $request->query() ?: [],
        'success' => session('success'),
    ]);
}

public function create()
{
    $taskId = request()->query('task_id');
    $task = Task::with([
        'products.project',
        'assignedUser' => function ($query) {
            $query->select('id', 'name', 'is_active', 'deleted_at');
        },
        'createdBy' => function ($query) {
            $query->select('id', 'name', 'is_active', 'deleted_at');
        }
    ])->findOrFail($taskId);
    
    // Check if user is admin or assigned to this task
    $user = Auth::user();
    if ($user->role !== 'admin' && $task->assigned_user_id !== $user->id) {
        abort(403, 'Vous n\'êtes pas autorisé à créer une intervention pour cette tâche.');
    }
    
    return inertia('Intervention/Create', [
        'task' => new \App\Http\Resources\TaskResource($task)
    ]);
}

public function show(Intervention $intervention)
{
    try {
        // Load relationships with specific fields to ensure we get all necessary data
        $intervention->load([
            'user' => function ($query) {
                $query->select('id', 'name', 'is_active', 'deleted_at');
            },
            'task' => function ($query) {
                $query->with([
                    'products.project',
                    'assignedUser' => function ($query) {
                        $query->select('id', 'name', 'is_active', 'deleted_at');
                    },
                    'createdBy' => function ($query) {
                        $query->select('id', 'name', 'is_active', 'deleted_at');
                    }
                ]);
            }
        ]);

        $resource = new InterventionResource($intervention);
        $data = $resource->toArray(request());

        return inertia('Intervention/Show', [
            'intervention' => $data
        ]);
    } catch (\Exception $e) {
        throw $e;
    }
}

public function store(StoreInterventionRequest $request)
{
    $data = $request->validated();
    
    // Check authorization - user must be admin or assigned to the task
    $task = Task::findOrFail($data['task_id']);
    $user = Auth::user();
    if ($user->role !== 'admin' && $task->assigned_user_id !== $user->id) {
        abort(403, 'Vous n\'êtes pas autorisé à créer une intervention pour cette tâche.');
    }
    
    $data['user_id'] = Auth::id();
    $data['action_time'] = now();
    $data['status'] = 'pending';

    // Handle image upload
    if ($request->hasFile('image')) {
        $taskId = $data['task_id'];
        $data['image_path'] = $request->file('image')->store("interventions/{$taskId}", 'public');
    }

    $intervention = Intervention::create($data);
    
    // Explicitly update task status
    $task->refresh();
    $task->status = $task->determineStatus();
    $task->save();
    
    // Log intervention creation with all details
    try {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create_intervention',
            'description' => "Création d'une intervention pour la tâche {$intervention->task->name}",
            'model_type' => 'Intervention',
            'model_id' => $intervention->id,
            'properties' => [
                'task_id' => $intervention->task_id,
                'task_name' => $intervention->task->name,
                'description' => $intervention->description,
                'status' => $intervention->status,
                'task_status' => $task->status,
                'created_by' => Auth::user()->name,
                'created_at' => now()->format('Y-m-d H:i:s'),
            ],
        ]);
    } catch (\Exception $e) {
        Log::error('Failed to log intervention creation', [
            'intervention_id' => $intervention->id,
            'error' => $e->getMessage()
        ]);
    }

    // Send notification to task creator if different from intervention creator
    if ($task->created_by !== Auth::id()) {
        $creator = Auth::user();
        $task->createdBy->notify(new InterventionSubmittedNotification($task, $intervention, $creator));
    }

    // Send notifications to observers
    foreach ($task->observers as $observer) {
        if ($observer->id !== Auth::id()) { // Don't notify the creator of the intervention
            try {
                $observer->notify(new InterventionObserverNotification($task, $intervention, Auth::user()));
            } catch (\Exception $e) {
                Log::error('Failed to send observer notification', [
                    'error' => $e->getMessage(),
                    'observer_id' => $observer->id,
                    'intervention_id' => $intervention->id
                ]);
            }
        }
    }
    
    return to_route('task.show', $task->id)
        ->with('success', 'Intervention créée avec succès.');
}

/**
 * Update the specified intervention.
 */
public function update(UpdateInterventionRequest $request, Intervention $intervention)
{
    try {
        // Load necessary relationships
        $intervention->load([
            'task' => function ($query) {
                $query->with(['createdBy', 'assignedUser', 'observers']);
            },
            'user'
        ]);

        // Check if the current user is the task creator
        if (Auth::id() !== $intervention->task->created_by) {
            return back()->with('error', 'Seul le créateur de la tâche peut évaluer les interventions.');
        }

        $data = $request->validated();

        if ($data['status'] === 'approved') {
            $intervention->update([
                'status' => 'approved',
                'rejection_comment' => null,
                'rejection_image_path' => null,
                'rating_comment' => $data['rating_comment'] ?? null
            ]);

            // Refresh task to update its status
            $task = $intervention->task;
            $task->refresh();
            $task->status = $task->determineStatus();
            $task->save();

            // Send notification to intervention creator
            try {
                $creator = Auth::user();
                $intervention->user->notify(new InterventionRatedNotification($intervention->task, $intervention, $creator));
            } catch (\Exception $e) {
                Log::error('Failed to send notification', [
                    'error' => $e->getMessage(),
                    'intervention_id' => $intervention->id
                ]);
            }

            // Send notifications to observers
            foreach ($task->observers as $observer) {
                if ($observer->id !== Auth::id()) { // Don't notify the rater
                    try {
                        $observer->notify(new InterventionRatingObserverNotification($task, $intervention, Auth::user()));
                    } catch (\Exception $e) {
                        Log::error('Failed to send observer notification', [
                            'error' => $e->getMessage(),
                            'observer_id' => $observer->id,
                            'intervention_id' => $intervention->id
                        ]);
                    }
                }
            }

            // Log intervention update
            try {
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'update_intervention',
                    'description' => "Mise à jour de l'intervention pour la tâche {$intervention->task->name}",
                    'model_type' => 'Intervention',
                    'model_id' => $intervention->id,
                    'properties' => [
                        'task_id' => $intervention->task_id,
                        'task_name' => $intervention->task->name,
                        'description' => $intervention->description,
                        'status' => $intervention->status,
                        'task_status' => $intervention->task->status,
                        'rating_comment' => $intervention->rating_comment,
                        'updated_by' => Auth::user()->name,
                        'updated_at' => now()->format('Y-m-d H:i:s'),
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to log intervention update', [
                    'intervention_id' => $intervention->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Redirect to task page with success message
            return redirect()->route('task.show', $intervention->task_id)
                ->with('success', 'Intervention approuvée avec succès.');
        }

        if ($data['status'] === 'rejected') {
            if (empty($data['rejection_comment'])) {
                return back()->with('error', 'Un commentaire de rejet est requis.');
            }

            $updateData = [
                'status' => 'rejected',
                'rejection_comment' => $data['rejection_comment']
            ];

            // Handle rejection image upload
            if ($request->hasFile('rejection_image')) {
                try {
                    // Delete old rejection image if exists
                    if ($intervention->rejection_image_path) {
                        Storage::disk('public')->delete($intervention->rejection_image_path);
                    }
                    
                    $updateData['rejection_image_path'] = $request->file('rejection_image')
                        ->store("interventions/rejections/{$intervention->task_id}", 'public');
                } catch (\Exception $e) {
                    Log::error('Failed to handle rejection image', [
                        'error' => $e->getMessage(),
                        'intervention_id' => $intervention->id
                    ]);
                    return back()->with('error', 'Une erreur est survenue lors du téléchargement de l\'image.');
                }
            }

            $intervention->update($updateData);

            // Refresh task to update its status
            $task = $intervention->task;
            $task->refresh();
            $task->status = $task->determineStatus();
            $task->save();

            // Send notification to intervention creator
            try {
                $creator = Auth::user();
                $intervention->user->notify(new InterventionRatedNotification($intervention->task, $intervention, $creator));
            } catch (\Exception $e) {
                Log::error('Failed to send notification', [
                    'error' => $e->getMessage(),
                    'intervention_id' => $intervention->id
                ]);
            }

            // Send notifications to observers
            foreach ($task->observers as $observer) {
                if ($observer->id !== Auth::id()) { // Don't notify the rater
                    try {
                        $observer->notify(new InterventionRatingObserverNotification($task, $intervention, Auth::user()));
                    } catch (\Exception $e) {
                        Log::error('Failed to send observer notification', [
                            'error' => $e->getMessage(),
                            'observer_id' => $observer->id,
                            'intervention_id' => $intervention->id
                        ]);
                    }
                }
            }

            // Log intervention update
            try {
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'update_intervention',
                    'description' => "Mise à jour de l'intervention pour la tâche {$intervention->task->name}",
                    'model_type' => 'Intervention',
                    'model_id' => $intervention->id,
                    'properties' => [
                        'task_id' => $intervention->task_id,
                        'task_name' => $intervention->task->name,
                        'description' => $intervention->description,
                        'status' => $intervention->status,
                        'task_status' => $intervention->task->status,
                        'rejection_comment' => $intervention->rejection_comment,
                        'updated_by' => Auth::user()->name,
                        'updated_at' => now()->format('Y-m-d H:i:s'),
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to log intervention update', [
                    'intervention_id' => $intervention->id,
                    'error' => $e->getMessage()
                ]);
            }

            return redirect()->route('task.show', $intervention->task_id)
                ->with('success', 'Intervention rejetée avec succès.');
        }

        return back()->with('error', 'Statut d\'intervention invalide.');
    } catch (\Exception $e) {
        Log::error('Failed to update intervention', [
            'error' => $e->getMessage(),
            'intervention_id' => $intervention->id
        ]);
        return back()->with('error', 'Une erreur est survenue lors de la mise à jour de l\'intervention.');
    }
}

/**
 * Remove the specified intervention from storage.
 */
public function destroy(Intervention $intervention)
{
    $taskId = $intervention->task_id;

    if ($intervention->image_path) {
        Storage::disk('public')->delete($intervention->image_path);
    }

    if ($intervention->rejection_image_path) {
        Storage::disk('public')->delete($intervention->rejection_image_path);
    }

    $interventionId = $intervention->id;

    // Log intervention deletion with all details
    try {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete_intervention',
            'description' => "Suppression de l'intervention de la tâche {$intervention->task->name}",
            'model_type' => 'Intervention',
            'model_id' => $interventionId,
            'properties' => [
                'task_id' => $taskId,
                'task_name' => $intervention->task->name,
                'status' => $intervention->status,
                'deleted_by' => Auth::user()->name,
                'deleted_at' => now()->format('Y-m-d H:i:s'),
            ],
        ]);
        Log::info('Intervention deletion logged successfully', ['intervention_id' => $interventionId]);
    } catch (\Exception $e) {
        Log::error('Failed to log intervention deletion', [
            'intervention_id' => $interventionId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }

    $intervention->delete();

    return to_route('task.show', $taskId)
        ->with('success', 'Intervention supprimée avec succès.');
}
}
