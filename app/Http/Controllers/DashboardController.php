<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Models\Project;
use App\Models\Intervention;
use Inertia\Inertia;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return redirect()->route('user.dashboard');
        }

        try {
            // Validate request parameters
            $validated = $request->validate([
                'timeRange' => ['nullable', 'string', 'in:all,today,week,month,quarter,year'],
                'statusFilter' => ['nullable', 'string', 'in:all,pending,in-progress,completed'],
                'searchTerm' => ['nullable', 'string', 'max:255'],
                'projectFilter' => ['nullable', 'string', 'max:255'],
            ]);

            // Get time range from request or default to all
            $timeRange = $validated['timeRange'] ?? 'all';
            $statusFilter = $validated['statusFilter'] ?? 'all';
            $searchTerm = $validated['searchTerm'] ?? '';
            $projectFilter = $validated['projectFilter'] ?? 'all';

            // Calculate date range
            $dateRange = $this->getDateRange($timeRange);

            // Base task queries with date filtering
            $baseTaskQuery = Task::query()
                ->when($dateRange, function ($query) use ($dateRange) {
                    $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                });

            // Management Module Statistics
            $counts = $this->getTaskCounts($baseTaskQuery, $user);
            $performanceMetrics = $this->calculatePerformanceMetrics($user, $dateRange);
            $recentActivity = $this->getRecentActivity($user);
            $projectStats = $this->getProjectStatistics($dateRange);
            $userStats = $this->getUserStatistics($dateRange);
            $tasksPerProject = $this->getTasksPerProject();
            $interventionsPerProject = $this->getInterventionsPerProject();

            // Enhanced active tasks query with search and filters
            $activeTasksQuery = $this->buildActiveTasksQuery(
                $statusFilter,
                $searchTerm,
                $dateRange
            );
            
            // Get the raw tasks first to debug
            $rawTasks = $activeTasksQuery->get();
            
            // Transform to resources
            $activeTasks = TaskResource::collection($rawTasks);

            return inertia('Dashboard', array_merge(
                $counts,
                [
                    // Management data
                    'performanceMetrics' => $performanceMetrics,
                    'recentActivity' => $recentActivity,
                    'projectStats' => $projectStats,
                    'userStats' => $userStats,
                    'filters' => [
                        'timeRange' => $timeRange,
                        'statusFilter' => $statusFilter,
                        'searchTerm' => $searchTerm,
                        'projectFilter' => $projectFilter,
                    ],
                    'tasksPerProject' => $tasksPerProject,
                    'interventionsPerProject' => $interventionsPerProject,
                    'activeTasks' => $activeTasks,
                ]
            ));

        } catch (\Exception $e) {
            \Log::error('Dashboard data error: ' . $e->getMessage());
            return inertia('Dashboard', [
                'error' => 'Une erreur est survenue lors du chargement des données.',
            ]);
        }
    }

    public function userDashboard()
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return redirect()->route('dashboard');
        }

        $myPendingTasks = Task::query()
            ->where('status', 'pending')
            ->where('assigned_user_id', $user->id)
            ->count();

        $myCompletedTasks = Task::query()
            ->where('status', 'completed')
            ->where('assigned_user_id', $user->id)
            ->count();

        $myInProgressTasks = Task::query()
            ->where('status', 'in-progress')
            ->where('assigned_user_id', $user->id)
            ->count();

        $activeTasks = Task::query()
            ->whereIn('status', ['pending', 'in-progress'])
            ->where('assigned_user_id', $user->id)
            ->with(['products.project' => function($query) {
                $query->select('id', 'name');
            }])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $activeTasks = TaskResource::collection($activeTasks);

        $recentNotifications = DatabaseNotification::where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->latest()
            ->take(5)
            ->get();

        return inertia('UserDashboard', [
            'myPendingTasks' => $myPendingTasks,
            'myCompletedTasks' => $myCompletedTasks,
            'myInProgressTasks' => $myInProgressTasks,
            'activeTasks' => $activeTasks,
            'recentNotifications' => $recentNotifications,
        ]);
    }

    /**
     * Get date range based on time range parameter
     */
    private function getDateRange($timeRange)
    {
        if ($timeRange === 'all') {
            return null; // Return null for all-time data
        }
        
        $now = Carbon::now();
        
        switch ($timeRange) {
            case 'today':
                return [
                    'start' => $now->copy()->startOfDay(),
                    'end' => $now->copy()->endOfDay()
                ];
            case 'week':
                return [
                    'start' => $now->copy()->startOfWeek(),
                    'end' => $now->copy()->endOfWeek()
                ];
            case 'month':
                return [
                    'start' => $now->copy()->startOfMonth(),
                    'end' => $now->copy()->endOfMonth()
                ];
            case 'quarter':
                return [
                    'start' => $now->copy()->startOfQuarter(),
                    'end' => $now->copy()->endOfQuarter()
                ];
            case 'year':
                return [
                    'start' => $now->copy()->startOfYear(),
                    'end' => $now->copy()->endOfYear()
                ];
            default:
                return null; // All time
        }
    }

    /**
     * Calculate performance metrics
     */
    private function calculatePerformanceMetrics($user, $dateRange)
    {
        try {
            // Current period metrics
            $baseQuery = Task::query()
                ->when($dateRange, function ($query) use ($dateRange) {
                    $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                });

            $totalTasks = (clone $baseQuery)->count();
            $completedTasks = (clone $baseQuery)->where('status', 'completed')->count();
            $onTimeCompletions = (clone $baseQuery)
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->whereNotNull('due_date')
                ->whereRaw('completed_at <= due_date')
                ->count();
            $highPriorityTotal = (clone $baseQuery)->where('priority', 'high')->count();
            $highPriorityCompleted = (clone $baseQuery)
                ->where('status', 'completed')
                ->where('priority', 'high')
                ->count();

            // Calculate previous period metrics
            $previousDateRange = $this->getPreviousPeriodRange($dateRange);
            $previousQuery = Task::query()
                ->when($previousDateRange, function ($query) use ($previousDateRange) {
                    $query->whereBetween('created_at', [$previousDateRange['start'], $previousDateRange['end']]);
                });

            $previousTotalTasks = (clone $previousQuery)->count();
            $previousCompletedTasks = (clone $previousQuery)->where('status', 'completed')->count();
            $previousOnTimeCompletions = (clone $previousQuery)
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->whereNotNull('due_date')
                ->whereRaw('completed_at <= due_date')
                ->count();
            $previousHighPriorityTotal = (clone $previousQuery)->where('priority', 'high')->count();
            $previousHighPriorityCompleted = (clone $previousQuery)
                ->where('status', 'completed')
                ->where('priority', 'high')
                ->count();

            return [
                'currentPeriod' => [
                    'totalTasks' => $totalTasks,
                    'completedTasks' => $completedTasks,
                    'pendingTasks' => (clone $baseQuery)->where('status', 'pending')->count(),
                    'inProgressTasks' => (clone $baseQuery)->where('status', 'in-progress')->count(),
                    'completion' => $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0,
                    'onTime' => $completedTasks > 0 ? ($onTimeCompletions / $completedTasks) * 100 : 0,
                    'priority' => $highPriorityTotal > 0 ? ($highPriorityCompleted / $highPriorityTotal) * 100 : 0,
                    'overall' => $totalTasks > 0 ? 
                        (($completedTasks / $totalTasks) * 0.4 + 
                         ($onTimeCompletions / ($completedTasks || 1)) * 0.4 +
                         ($highPriorityCompleted / ($highPriorityTotal || 1)) * 0.2) * 100 
                        : 0
                ],
                'previousPeriod' => [
                    'totalTasks' => $previousTotalTasks,
                    'completedTasks' => $previousCompletedTasks,
                    'completion' => $previousTotalTasks > 0 ? ($previousCompletedTasks / $previousTotalTasks) * 100 : 0,
                    'onTime' => $previousCompletedTasks > 0 ? ($previousOnTimeCompletions / $previousCompletedTasks) * 100 : 0,
                    'priority' => $previousHighPriorityTotal > 0 ? ($previousHighPriorityCompleted / $previousHighPriorityTotal) * 100 : 0,
                    'overall' => $previousTotalTasks > 0 ? 
                        (($previousCompletedTasks / $previousTotalTasks) * 0.4 + 
                         ($previousOnTimeCompletions / ($previousCompletedTasks || 1)) * 0.4 +
                         ($previousHighPriorityCompleted / ($previousHighPriorityTotal || 1)) * 0.2) * 100 
                        : 0
                ]
            ];
        } catch (\Exception $e) {
            \Log::error('Error calculating performance metrics: ' . $e->getMessage());
            return [
                'currentPeriod' => [
                    'totalTasks' => 0,
                    'completedTasks' => 0,
                    'pendingTasks' => 0,
                    'inProgressTasks' => 0,
                    'completion' => 0,
                    'onTime' => 0,
                    'priority' => 0,
                    'overall' => 0
                ],
                'previousPeriod' => [
                    'totalTasks' => 0,
                    'completedTasks' => 0,
                    'completion' => 0,
                    'onTime' => 0,
                    'priority' => 0,
                    'overall' => 0
                ]
            ];
        }
    }

    /**
     * Calculate the date range for the previous period
     */
    private function getPreviousPeriodRange($currentRange)
    {
        if (!$currentRange) {
            return null;
        }

        $currentStart = Carbon::parse($currentRange['start']);
        $currentEnd = Carbon::parse($currentRange['end']);
        $duration = $currentStart->diffInSeconds($currentEnd);

        return [
            'start' => $currentStart->copy()->subSeconds($duration),
            'end' => $currentStart->copy()->subSecond()
        ];
    }

    /**
     * Get recent activity
     */
    private function getRecentActivity($user)
    {
        return Task::query()
            ->with(['products.project', 'assignedUser'])
            ->where('assigned_user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->name,
                    'status' => $task->status,
                    'project' => $task->products->first()?->project?->name ?? 'N/A',
                    'updated_at' => $task->updated_at->diffForHumans(),
                    'action' => $task->status === 'completed' ? 'completed' : 'updated'
                ];
            });
    }

    /**
     * Get project statistics
     */
    private function getProjectStatistics($dateRange)
    {
        return Project::query()
            ->get()
            ->map(function ($project) use ($dateRange) {
                // Get total tasks for this project
                $totalTasksQuery = Task::query()
                    ->whereHas('products', function($query) use ($project) {
                        $query->where('project_id', $project->id);
                    });
                
                if ($dateRange) {
                    $totalTasksQuery->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                }
                
                $totalTasks = $totalTasksQuery->count();
                
                // Get completed tasks for this project
                $completedTasksQuery = Task::query()
                    ->where('status', 'completed')
                    ->whereHas('products', function($query) use ($project) {
                        $query->where('project_id', $project->id);
                    });
                
                if ($dateRange) {
                    $completedTasksQuery->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                }
                
                $completedTasks = $completedTasksQuery->count();
                
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'total_tasks' => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'completion_rate' => $totalTasks > 0 
                        ? round(($completedTasks / $totalTasks) * 100) 
                        : 0
                ];
            });
    }

    /**
     * Get user statistics
     */
    private function getUserStatistics($dateRange)
    {
        return User::query()
            ->get()
            ->map(function ($user) use ($dateRange) {
                // Get total tasks for this user
                $totalTasksQuery = Task::query()
                    ->where('assigned_user_id', $user->id);
                
                if ($dateRange) {
                    $totalTasksQuery->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                }
                
                $totalTasks = $totalTasksQuery->count();
                
                // Get completed tasks for this user
                $completedTasksQuery = Task::query()
                    ->where('status', 'completed')
                    ->where('assigned_user_id', $user->id);
                
                if ($dateRange) {
                    $completedTasksQuery->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                }
                
                $completedTasks = $completedTasksQuery->count();
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'total_tasks' => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'completion_rate' => $totalTasks > 0 
                        ? round(($completedTasks / $totalTasks) * 100) 
                        : 0
                ];
            });
    }

    /**
     * API endpoint for getting filtered data
     */
    public function getFilteredData(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $timeRange = $request->get('timeRange', 'month');
        $statusFilter = $request->get('statusFilter', 'all');
        $searchTerm = $request->get('searchTerm', '');

        // Reuse the same logic as index method but return JSON
        $dateRange = $this->getDateRange($timeRange);

        $activeTasksQuery = Task::query()
            ->with(['products.project', 'assignedUser'])
            ->when($statusFilter !== 'all', function ($query) use ($statusFilter) {
                $query->where('status', $statusFilter);
            })
            ->when($searchTerm, function ($query) use ($searchTerm) {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('tasks.name', 'like', "%{$searchTerm}%")
                      ->orWhere('tasks.description', 'like', "%{$searchTerm}%")
                      ->orWhereHas('products.project', function ($pq) use ($searchTerm) {
                          $pq->where('projects.name', 'like', "%{$searchTerm}%");
                      })
                      ->orWhereHas('assignedUser', function ($uq) use ($searchTerm) {
                          $uq->where('users.name', 'like', "%{$searchTerm}%");
                      });
                });
            })
            ->orderBy('created_at', 'desc')
            ->limit(50);

        $activeTasks = TaskResource::collection($activeTasksQuery->get());

        return response()->json([
            'activeTasks' => $activeTasks,
            'filters' => [
                'timeRange' => $timeRange,
                'statusFilter' => $statusFilter,
                'searchTerm' => $searchTerm,
            ]
        ]);
    }

    private function getTasksPerProject()
    {
        try {
            return Project::query()
                ->leftJoin('products', 'projects.id', '=', 'products.project_id')
                ->leftJoin('product_task', 'products.id', '=', 'product_task.product_id')
                ->leftJoin('tasks', 'product_task.task_id', '=', 'tasks.id')
                ->selectRaw('projects.name as project_name, COUNT(DISTINCT tasks.id) as total_tasks')
                ->groupBy('projects.id', 'projects.name')
                ->orderBy('projects.name')
                ->get()
                ->map(function ($row) {
                    return [
                        'project' => $row->project_name,
                        'tasks' => (int) $row->total_tasks,
                    ];
                })
                ->values();
        } catch (\Exception $e) {
            \Log::error('Error fetching tasks per project: ' . $e->getMessage());
            return collect([]);
        }
    }

    private function getInterventionsPerProject()
    {
        try {
            $timeRange = request('timeRange', 'all');
            $projectFilter = request('projectFilter', 'all');
            $statusFilter = request('interventionStatusFilter', 'all');

            // Log request parameters
            \Log::info('Interventions per project request:', [
                'timeRange' => $timeRange,
                'projectFilter' => $projectFilter,
                'statusFilter' => $statusFilter
            ]);

            $query = DB::table('projects')
                ->leftJoin('products', 'projects.id', '=', 'products.project_id')
                ->leftJoin('product_task', 'products.id', '=', 'product_task.product_id')
                ->leftJoin('tasks', 'product_task.task_id', '=', 'tasks.id')
                ->leftJoin('interventions', 'tasks.id', '=', 'interventions.task_id')
                ->select(
                    'projects.name as project',
                    DB::raw('COUNT(DISTINCT interventions.id) as total_interventions'),
                    DB::raw('SUM(CASE WHEN interventions.status = "approved" THEN 1 ELSE 0 END) as approved'),
                    DB::raw('SUM(CASE WHEN interventions.status = "rejected" THEN 1 ELSE 0 END) as refused'),
                    DB::raw('SUM(CASE WHEN interventions.status IS NULL OR interventions.status = "pending" THEN 1 ELSE 0 END) as pending')
                )
                ->whereNotNull('interventions.id'); // Only include records with interventions

            // Log the initial query
            \Log::info('Initial query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            // Apply time range filter
            if ($timeRange !== 'all') {
                $dateRange = $this->getDateRange($timeRange);
                    if ($dateRange) {
                        $query->whereBetween('interventions.created_at', [$dateRange['start'], $dateRange['end']]);
                    // Log time range filter
                    \Log::info('Applied time range filter:', [
                        'start' => $dateRange['start'],
                        'end' => $dateRange['end']
                    ]);
                    }
            }

            // Apply project filter
            if ($projectFilter !== 'all') {
                $query->where('projects.name', $projectFilter);
                // Log project filter
                \Log::info('Applied project filter:', [
                    'projectFilter' => $projectFilter
                ]);
            }

            // Apply status filter
            if ($statusFilter !== 'all') {
                $query->where('interventions.status', $statusFilter);
                // Log status filter
                \Log::info('Applied status filter:', [
                    'statusFilter' => $statusFilter
                ]);
            }

            // Log final query before execution
            \Log::info('Final query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            $results = $query->groupBy('projects.id', 'projects.name')
                ->orderBy('projects.name')
                ->get()
                ->map(function ($row) {
                    $mapped = [
                        'project' => $row->project,
                        'interventions' => (int) $row->total_interventions,
                        'approved' => (int) $row->approved,
                        'refused' => (int) $row->refused,
                        'pending' => (int) $row->pending
                    ];
                    // Log each mapped row
                    \Log::info('Mapped intervention row:', $mapped);
                    return $mapped;
                });

            // Log the final results
            \Log::info('Final interventions per project results:', [
                'count' => $results->count(),
                'data' => $results->toArray()
            ]);

            return $results;

        } catch (\Exception $e) {
            \Log::error('Error fetching interventions per project: ' . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Get task counts with proper validation
     */
    private function getTaskCounts($baseTaskQuery, $user)
    {
        try {
            return [
                'totalPendingTasks' => (clone $baseTaskQuery)
                    ->where('status', 'pending')
                    ->count(),

                'myPendingTasks' => (clone $baseTaskQuery)
                    ->where('status', 'pending')
                    ->where('assigned_user_id', $user->id)
                    ->count(),

                'totalCompletedTasks' => (clone $baseTaskQuery)
                    ->where('status', 'completed')
                    ->count(),

                'myCompletedTasks' => (clone $baseTaskQuery)
                    ->where('status', 'completed')
                    ->where('assigned_user_id', $user->id)
                    ->count(),

                'totalInProgressTasks' => (clone $baseTaskQuery)
                    ->where('status', 'in-progress')
                    ->count(),

                'myInProgressTasks' => (clone $baseTaskQuery)
                    ->where('status', 'in-progress')
                    ->where('assigned_user_id', $user->id)
                    ->count(),
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting task counts: ' . $e->getMessage());
            return [
                'totalPendingTasks' => 0,
                'myPendingTasks' => 0,
                'totalCompletedTasks' => 0,
                'myCompletedTasks' => 0,
                'totalInProgressTasks' => 0,
                'myInProgressTasks' => 0,
            ];
        }
    }

    /**
     * Build active tasks query with proper validation
     */
    private function buildActiveTasksQuery($statusFilter, $searchTerm, $dateRange)
    {
        try {
            return Task::query()
                ->with([
                    'products.project', 
                    'assignedUser',
                    'createdBy',
                    'updatedBy',
                    'interventions'
                ])
                ->when($statusFilter !== 'all', function ($query) use ($statusFilter) {
                    $query->where('status', $statusFilter);
                })
                ->when($searchTerm, function ($query) use ($searchTerm) {
                    $query->where(function ($q) use ($searchTerm) {
                        $q->where('tasks.name', 'like', '%' . trim($searchTerm) . '%')
                          ->orWhere('tasks.description', 'like', '%' . trim($searchTerm) . '%')
                          ->orWhereHas('products.project', function ($pq) use ($searchTerm) {
                              $pq->where('projects.name', 'like', '%' . trim($searchTerm) . '%');
                          })
                          ->orWhereHas('assignedUser', function ($uq) use ($searchTerm) {
                              $uq->where('users.name', 'like', '%' . trim($searchTerm) . '%');
                          });
                    });
                })
                ->when($dateRange, function ($query) use ($dateRange) {
                    $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
                })
                ->orderBy('created_at', 'desc')
                ->limit(50);
        } catch (\Exception $e) {
            \Log::error('Error building active tasks query: ' . $e->getMessage());
            return Task::query()->limit(0); // Return empty query on error
        }
    }
}

