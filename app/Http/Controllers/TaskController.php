<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\ProductResource;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Notifications\Notifiable;
use HasApiTokens, HasFactory;
use App\Notifications\TaskObserverNotification;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
        $user = Auth::user();
        $query = Task::query()
            ->with(['createdBy', 'products.project', 'assignedUser', 'interventions']);

            // Search functionality
            if (request()->filled('name')) {
                $searchTerm = request('name');
                \Log::info('Searching for term:', ['term' => $searchTerm]);
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('description', 'LIKE', '%' . $searchTerm . '%');
                });
            }

        // Project filter
        if (request()->filled('project_id')) {
                \Log::info('Filtering by project:', ['project_id' => request('project_id')]);
            $query->whereHas('products.project', function($q) {
                    $q->where('projects.id', request('project_id'));
            });
        }

        // Product filter
        if (request()->filled('product_id')) {
                \Log::info('Filtering by product:', ['product_id' => request('product_id')]);
            $query->whereHas('products', function($q) {
                    $q->where('products.id', request('product_id'));
            });
        }

        // Status filter
        if (request()->filled('status')) {
                \Log::info('Filtering by status:', ['status' => request('status')]);
            $query->where('status', request('status'));
        }

        // Priority filter
        if (request()->filled('priority')) {
                \Log::info('Filtering by priority:', ['priority' => request('priority')]);
            $query->where('priority', request('priority'));
        }

        // Date range filters with proper validation
        if (request()->filled('date_start') && request()->filled('date_end')) {
            try {
                $start = Carbon::parse(request('date_start'))->startOfDay();
                $end = Carbon::parse(request('date_end'))->endOfDay();
                
                if ($start->isValid() && $end->isValid() && $start <= $end) {
                        \Log::info('Filtering by date range:', [
                            'start' => $start->toDateString(),
                            'end' => $end->toDateString()
                        ]);
                    $query->whereBetween('created_at', [$start, $end]);
                } else {
                    \Log::warning('Invalid date range provided', [
                        'start' => request('date_start'),
                        'end' => request('date_end')
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Error parsing date range', [
                    'start' => request('date_start'),
                    'end' => request('date_end'),
                    'error' => $e->getMessage()
                ]);
            }
        }

            // Assigned to me filter
            if (request('assigned_to_me') === '1') {
                \Log::info('Filtering tasks assigned to user:', ['user_id' => $user->id]);
                $query->where('assigned_user_id', $user->id);
            }

            // Created by me filter
            if (request('created_by_me') === '1') {
                \Log::info('Filtering tasks created by user:', ['user_id' => $user->id]);
                $query->where('created_by', $user->id);
        }

        // Sorting
        $allowedSortFields = [
            'id', 'name', 'priority', 'created_at', 'due_date',
            'assigned_user_id', 'created_by'
        ];
        
        $sortField = in_array(request('sort_field'), $allowedSortFields) 
            ? request('sort_field') 
            : 'created_at';
        
        $sortDirection = in_array(request('sort_direction'), ['asc', 'desc']) 
            ? request('sort_direction') 
            : 'desc';

            \Log::info('Sorting tasks:', [
                'field' => $sortField,
                'direction' => $sortDirection
            ]);

        // Special sorting for relationship fields
        if (in_array($sortField, ['assigned_user_id', 'created_by'])) {
            $query->leftJoin('users as sort_users', function($join) use ($sortField) {
                if ($sortField === 'assigned_user_id') {
                    $join->on('tasks.assigned_user_id', '=', 'sort_users.id');
                } else {
                    $join->on('tasks.created_by', '=', 'sort_users.id');
                }
            })
            ->orderBy('sort_users.name', $sortDirection)
            ->select('tasks.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $tasks = $query->paginate(10)
            ->onEachSide(1)
            ->withQueryString();
    
        // Get all projects with their products
        $projects = Project::with('products')
            ->get()
            ->map(function($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'products' => $project->products->map(function($product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name
                        ];
                    })->values()->all()
                ];
            })
            ->values()
            ->all();

            \Log::info('Tasks query completed', [
                'total_tasks' => $tasks->total(),
                'current_page' => $tasks->currentPage(),
                'per_page' => $tasks->perPage()
        ]);

        return inertia("Task/Index", [
            "tasks" => TaskResource::collection($tasks),
            'projects' => $projects,
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
            'currentRouteName' => 'tasks.index',
        ]);

        } catch (\Exception $e) {
            \Log::error('Error in TaskController@index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return inertia("Task/Index", [
                "tasks" => [],
                'projects' => [],
                'queryParams' => request()->query() ?: null,
                'error' => 'Une erreur est survenue lors du chargement des tickets.',
                'currentRouteName' => 'tasks.index',
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Optimize queries by selecting only needed fields and eager loading relationships
        $products = Product::with(['project:id,name'])
            ->select('id', 'name', 'project_id')
            ->orderBy('name')
            ->get();

        $users = User::active()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $projects = Project::select('id', 'name')
            ->orderBy('name')
            ->get();

        return inertia("Task/Create", [
            'products' => ProductResource::collection($products)->values(),
            'users' => UserResource::collection($users)->values(),
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskRequest $request)
    {
        try {
            DB::beginTransaction();
            
        $data = $request->validated();
        
            // Check if assigned user is active using select
        if (isset($data['assigned_user_id'])) {
                $assignedUser = User::select('id', 'name', 'email', 'is_active')
                    ->find($data['assigned_user_id']);
                    
            if (!$assignedUser || !$assignedUser->is_active) {
                return back()->withErrors(['assigned_user_id' => 'Impossible d\'assigner une tâche à un utilisateur désactivé.']);
            }
        }

            $data['created_by'] = $data['updated_by'] = Auth::id();

            // Handle image upload
            if ($request->hasFile('image')) {
                $data['image_path'] = $request->file('image')->store('task', 'public');
        }

            // Extract and remove arrays from data
        $observerIds = $data['observers'] ?? [];
        $productIds = $data['product_ids'] ?? [];
            unset($data['observers'], $data['product_ids']);

            // Create task and sync relationships
        $task = Task::create($data);

            // Batch process relationships
        if (!empty($productIds)) {
                $task->products()->attach($productIds);
        }

            // Send notification to assigned user if different from creator
            if (isset($data['assigned_user_id']) && $data['assigned_user_id'] !== Auth::id()) {
                try {
                    Log::info('Sending notification to assigned user', [
                        'task_id' => $task->id,
                        'assigned_user_id' => $assignedUser->id,
                        'assigned_user_email' => $assignedUser->email
                    ]);
                    $assignedUser->notify(new TaskAssignedNotification($task, Auth::user()));
                } catch (\Exception $e) {
                    Log::error('Failed to send notification to assigned user', [
                        'error' => $e->getMessage(),
                        'task_id' => $task->id,
                        'assigned_user_id' => $assignedUser->id
                    ]);
                }
            }

            // Process observers and send notifications
            if (!empty($observerIds)) {
                // Sync observers in a single query
                $task->observers()->attach($observerIds);
                
                // Send notifications to observers
                $creator = Auth::user();
                $authId = Auth::id();
                
                // Get all observers with their email addresses
                $observers = User::select('id', 'name', 'email')
                    ->whereIn('id', array_diff($observerIds, [$authId]))
                    ->where('is_active', true)
                    ->get();

                foreach ($observers as $observer) {
                    try {
                        if (!$observer->email) {
                            continue;
                        }
                        $observer->notify(new TaskObserverNotification($task, $creator));
                    } catch (\Exception $e) {
                        Log::error('Failed to send notification to observer', [
                            'error' => $e->getMessage(),
                            'task_id' => $task->id,
                            'observer_id' => $observer->id
                        ]);
                    }
                }
            }

            // Log activity with minimal data
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'create_task',
                'description' => "Création du ticket: {$task->name}",
                'model_type' => 'Task',
                'model_id' => $task->id,
                'properties' => [
                    'task_name' => $task->name,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'assigned_user_id' => $task->assigned_user_id,
                    'created_by' => Auth::user()->name,
                    'created_at' => now()->format('Y-m-d H:i:s'),
                ],
            ]);

            DB::commit();

            return redirect()
                ->route(Auth::user()->isAdmin() ? 'tasks.index' : 'task.myTasks')
                ->with('success', 'Le ticket a été créé avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Task creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Une erreur est survenue lors de la création du ticket.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        $task->load([
            'observers' => function($query) {
                $query->select('users.id', 'users.name', 'users.is_active', 'users.deleted_at')
                    ->withPivot('task_id', 'user_id');
            },
            'products.project',
            'createdBy' => function($query) {
                $query->select('id', 'name', 'is_active', 'deleted_at');
            },
            'assignedUser' => function($query) {
                $query->select('id', 'name', 'is_active', 'deleted_at');
            },
            'interventions' => function($query) {
                $query->with(['user' => function($query) {
                $query->select('id', 'name', 'is_active', 'deleted_at');
                }]);
            },
        ]);

        // Log raw task data with interventions and users for debugging
        Log::info('Task Show Raw Data:', [
            'task_id' => $task->id,
            'assignedUser' => $task->assignedUser ? [
                'id' => $task->assignedUser->id,
                'name' => $task->assignedUser->name,
                'is_active' => $task->assignedUser->is_active,
                'deleted_at' => $task->assignedUser->deleted_at,
            ] : null,
            'createdBy' => $task->createdBy ? [
                'id' => $task->createdBy->id,
                'name' => $task->createdBy->name,
                'is_active' => $task->createdBy->is_active,
                'deleted_at' => $task->createdBy->deleted_at,
            ] : null,
            'interventions' => $task->interventions->map(function($intervention) {
                return [
                    'id' => $intervention->id,
                    'user_id' => $intervention->user_id,
                    'user_name' => $intervention->user->name ?? 'User not loaded or null',
                    'user_is_active' => $intervention->user->is_active ?? 'N/A',
                    'user_deleted_at' => $intervention->user->deleted_at ?? 'N/A',
                    'description' => $intervention->description,
                ];
            }),
        ]);

        return inertia("Task/Show", [
            "task" => new TaskResource($task),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Task $task)
    {
        $this->authorize('update', $task);
        $products = Product::with('project')->orderBy('name','asc')->get();
        $users = User::active()->orderBy('name','asc')->get();
        $projects = Project::orderBy('name', 'asc')->get();
        $task->load('observers', 'products');
        return inertia("Task/Edit", [
            "task" => new TaskResource($task),
            'products' => ProductResource::collection($products)->values(),
            'users' => UserResource::collection($users)->values(),
            'projects' => $projects,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaskRequest $request, Task $task)
    {
        $data = $request->validated();

        // Check if assigned user is active
        if (isset($data['assigned_user_id'])) {
            $assignedUser = User::find($data['assigned_user_id']);
            if (!$assignedUser || !$assignedUser->is_active) {
                return back()->withErrors(['assigned_user_id' => 'Impossible d\'assigner une tâche à un utilisateur désactivé.']);
            }
        }

        $data['updated_by'] = Auth::id();

        /** @var \Illuminate\Http\UploadedFile|null $image */
        $image = $data['image'] ?? null;

        if ($image instanceof \Illuminate\Http\UploadedFile) {
            $data['image_path'] = $image->store('task', 'public');
        }

        // Remove observers from $data to avoid mass assignment issues
        $observerIds = $data['observers'] ?? [];
        unset($data['observers']);

        // Remove product_ids from $data to avoid mass assignment issues
        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        // Update the task
        $task->update($data);

        // Sync products
        if (!empty($productIds)) {
            $task->products()->sync($productIds);
        }

        // Log task update with all details
        try {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'update_task',
                'description' => "Mise à jour du ticket: {$task->name}",
                'model_type' => 'Task',
                'model_id' => $task->id,
                'properties' => [
                    'task_name' => $task->name,
                    'products' => $task->products->pluck('name')->toArray(),
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'description' => $task->description,
                    'assigned_user_id' => $task->assigned_user_id,
                    'assigned_user_name' => $task->assignedUser->name ?? null,
                    'due_date' => $task->due_date,
                    'observers' => $task->observers->pluck('name')->toArray(),
                    'updated_by' => Auth::user()->name,
                    'updated_at' => now()->format('Y-m-d H:i:s'),
                ],
            ]);
            Log::info('Task update logged successfully', ['task_id' => $task->id]);
        } catch (\Exception $e) {
            Log::error('Failed to log task update', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        // Sync observers
        if (!empty($observerIds)) {
            $task->observers()->sync($observerIds);
            
            // Send notifications to new observers
            try {
                $creator = Auth::user();
                $currentObservers = $task->observers()->pluck('user_id')->toArray();
                $newObservers = array_diff($observerIds, $currentObservers);
                
                foreach ($newObservers as $observerId) {
                    if ($observerId !== Auth::id()) { // Don't notify if observer is the creator
                        $observer = User::find($observerId);
                        if ($observer) {
                            $observer->notify(new TaskObserverNotification($task, $creator));
                        }
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error sending observer notifications', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        } else {
            $task->observers()->detach();
        }

        return redirect()->route('tasks.index')
            ->with('success', 'Task was updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $name = $task->name;
        if ($task->image_path) {
            Storage::disk('public')->deleteDirectory(dirname ($task->image_path));
        }
        $task->delete();

        // Log task deletion with all details
        try {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'delete_task',
                'description' => "Suppression du ticket: {$name}",
                'model_type' => 'Task',
                'model_id' => $task->id,
                'properties' => [
                    'task_name' => $name,
                    'products' => $task->products->pluck('name')->toArray(),
                    'status' => $task->status,
                    'assigned_user_name' => $task->assignedUser->name ?? null,
                    'deleted_by' => Auth::user()->name,
                    'deleted_at' => now()->format('Y-m-d H:i:s'),
                ],
            ]);
            Log::info('Task deletion logged successfully', ['task_id' => $task->id]);
        } catch (\Exception $e) {
            Log::error('Failed to log task deletion', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return to_route("tasks.index" )->with("success", "Tâche \"$name\" a été supprimée avec succès");
    }

    public function myTasks()
    {
        $user = Auth::user();
        $query = Task::query()->with(['createdBy', 'products.project', 'assignedUser', 'interventions']);

        $sortField = request("sort_field", 'created_at');
        $sortDirection = request("sort_direction", 'desc');

        if (request('created_by_me')) {
            // Only tasks created by the user
            $query->where('created_by', $user->id);
        } elseif (request('assigned_to_me')) {
            // Only tasks assigned to the user
            $query->where('assigned_user_id', $user->id);
        } else {
            // All tasks where the user is either the creator or the assigned user
            $query->where(function($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_user_id', $user->id);
            });
        }

        if (request()->has("name")) {
            $query->where("name", "like", "%" . request("name") . "%");
        }
        if (request("status")) {
            $query->where("status", request("status"));
        }
        if (request("priority")) {
            $query->where("priority", request("priority"));
        }
        if (request()->filled('from_date')) {
            $query->whereDate('created_at', '>=', request('from_date'));
        }
        if (request()->filled('to_date')) {
            $query->whereDate('created_at', '<=', request('to_date'));
        }

        $tasks = $query->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();

        return inertia("Task/Index", [
            "tasks" => TaskResource::collection($tasks),
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
            'currentRouteName' => 'task.myTasks',
        ]);
    }

    public function observedTasks()
    {
        $user = Auth::user();
        $sortField = request("sort_field", 'created_at');
        $sortDirection = request("sort_direction", 'desc');

        $query = Task::query()
            ->whereHas('observers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['observers', 'products.project', 'createdBy', 'assignedUser', 'interventions']);

        if (request()->has("name")) {
            $query->where("name", "like", "%" . request("name") . "%");
        }

        if (request("status")) {
            $query->where("status", request("status"));
        }

        $tasks = $query->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();

        return inertia("Task/ObservedTasks", [
            "tasks" => TaskResource::collection($tasks),
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
            'currentRouteName' => 'task.observedTasks',
        ]);
    }
}
