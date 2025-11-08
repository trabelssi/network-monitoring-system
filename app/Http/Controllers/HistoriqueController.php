<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class HistoriqueController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Validate date range and search parameters
        if ($request->filled(['date_from', 'date_to'])) {
            $request->validate([
                'date_from' => 'date',
                'date_to' => 'date|after_or_equal:date_from',
            ]);
        }

        if ($request->filled(['search', 'searchType'])) {
            $request->validate([
                'search' => 'string|max:255',
                'searchType' => 'string|in:all,user,description'
            ]);
        }
        
        // Log the user and their role
        Log::info('History page accessed by user:', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role
        ]);

        $query = ActivityLog::query()
            ->with('user')
            ->when(!$user->isAdmin(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->when($request->filled(['search', 'searchType']), function ($query) use ($request) {
                $search = $request->input('search');
                $searchType = $request->input('searchType');

                if ($searchType === 'user') {
                    // Search only in user names
                    $query->whereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
                } elseif ($searchType === 'description') {
                    // Search only in descriptions
                    $query->where('description', 'like', "%{$search}%");
                } else {
                    // Search in all fields (default behavior)
                    $query->where(function ($q) use ($search) {
                        $q->where('action', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%")
                          ->orWhereHas('user', function ($userQuery) use ($search) {
                              $userQuery->where('name', 'like', "%{$search}%");
                          });
                    });
                }
            })
            ->when($request->filled('date_from'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            })
            ->when($request->filled('action'), function ($query) use ($request) {
                $actions = explode(',', $request->input('action'));
                $query->whereIn('action', $actions);
            });

        // Log the SQL query
        Log::info('History query:', [
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);

        $activities = $query->latest()
            ->paginate(15)
            ->withQueryString();

        // Clear the cache and get fresh actions list
        Cache::forget('activity_actions');
        $actions = Cache::remember('activity_actions', 3600, function () {
            return ActivityLog::distinct()
                ->pluck('action')
                ->filter(function ($action) {
                    return $action !== 'test-action';
                })
                ->values();
        });

        // Log the results
        Log::info('History results:', [
            'total_count' => $activities->total(),
            'current_page' => $activities->currentPage(),
            'per_page' => $activities->perPage(),
            'first_item' => $activities->first() ? $activities->first()->id : null,
            'last_item' => $activities->last() ? $activities->last()->id : null,
        ]);

        return Inertia::render('Historique', [
            'activities' => $activities,
            'filters' => $request->only(['search', 'searchType', 'date_from', 'date_to', 'action']),
            'actions' => $actions,
        ]);
    }
} 