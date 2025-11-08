<?php

use Illuminate\Support\Facades\Route;
use App\Models\Task;

Route::get('/debug-tasks', function () {
    $tasks = Task::with(['products.project', 'assignedUser'])->get();
    
    return response()->json([
        'total_tasks' => $tasks->count(),
        'tasks' => $tasks->take(3)->map(function($task) {
            return [
                'id' => $task->id,
                'name' => $task->name,
                'status' => $task->status,
                'created_at' => $task->created_at,
                'products' => $task->products->map(function($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'project' => $product->project ? [
                            'id' => $product->project->id,
                            'name' => $product->project->name,
                        ] : null
                    ];
                }),
                'assignedUser' => $task->assignedUser ? [
                    'id' => $task->assignedUser->id,
                    'name' => $task->assignedUser->name,
                ] : null
            ];
        })
    ]);
});
