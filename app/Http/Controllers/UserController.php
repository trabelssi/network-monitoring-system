<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserCrudResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Auth\Authenticatable;

/** @var Authenticatable|User $user */
$user = Auth::user();

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all users first to debug
        $allUsers = User::withTrashed()->get();
        \Log::info('All Users:', [
            'total' => $allUsers->count(),
            'active' => $allUsers->where('is_active', true)->whereNull('deleted_at')->count(),
            'inactive' => $allUsers->where('is_active', false)->count(),
            'deleted' => $allUsers->whereNotNull('deleted_at')->count()
        ]);

        $query = User::query();
        $deactivatedQuery = User::withTrashed()->select('id', 'name', 'email', 'role', 'is_active', 'deleted_at'); // Explicitly select columns
    
        $sortField = request("sort_field", 'created_at');
        $sortDirection = request("sort_direction", 'desc');
    
        // Common search conditions
        if (request()->has("name")) {
            $searchTerm = request("name");
            $query->where("name", "like", "%{$searchTerm}%");
            $deactivatedQuery->where("name", "like", "%{$searchTerm}%");
        }
        if (request()->has("email")) {
            $searchTerm = request("email");
            $query->where("email", "like", "%{$searchTerm}%");
            $deactivatedQuery->where("email", "like", "%{$searchTerm}%");
        }
    
        // Active users query - only show users that are both active and not deleted
        $query->where('is_active', true)
              ->whereNull('deleted_at');
    
        $users = $query->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();
    
        // Deactivated users query - show users that are either deleted or inactive
        $deactivatedQuery->where(function($q) {
            $q->where('is_active', false)
              ->orWhereNotNull('deleted_at');
        });

        $deactivatedUsers = $deactivatedQuery
            ->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();

        // Debug deactivated users
        \Log::info('Deactivated Users Query:', [
            'total' => $deactivatedUsers->total(),
            'current_page' => $deactivatedUsers->currentPage(),
            'per_page' => $deactivatedUsers->perPage(),
            'data' => $deactivatedUsers->items()
        ]);
    
        return inertia("User/Index", [
            "users" => UserCrudResource::collection($users),
            "deactivatedUsers" => UserCrudResource::collection($deactivatedUsers),
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
        ]);
    }
    

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia("User/Create", [
            'roles' => User::getAvailableRoles(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
         $data = $request->validated();
        $data['email_verified_at'] = now();
         $data["password"] = bcrypt($data["password"]);
        
        // Ensure only admin can create admin users
        /** @var User $currentUser */
        $currentUser = Auth::user();
        if ($data['role'] === User::ROLE_ADMIN && !$currentUser->isAdmin()) {
            $data['role'] = User::ROLE_USER;
        }
        
        User::create($data);
        return to_route("users.index")->with("success", "Utilisateur créé avec succès");
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return inertia('User/Edit', [
            'user' => new UserCrudResource($user),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        $password = $data["password"] ?? null;
        if ($password) {
            $data["password"] = bcrypt($password);
        }else {
            unset($data["password"]);
        }
        $user->update($data);
        return to_route("users.index" )->with("success", "Utilisateur \" $user->name \" mis à jour avec succès");
    }

    /**
     * Deactivate the specified user.
     */
    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Vous ne pouvez pas désactiver votre propre compte.');
        }

        $name = $user->name;
        
        // First set is_active to false
        $user->is_active = false;
        $user->save();
        
        // Then perform soft delete
        $user->delete();

        // Debug the deactivated user
        \Log::info('User Deactivated:', [
            'id' => $user->id,
            'name' => $user->name,
            'is_active' => $user->is_active,
            'deleted_at' => $user->deleted_at
        ]);
        
        return to_route("users.index")->with("success", "Utilisateur \"$name\" a été désactivé avec succès");
    }

    /**
     * Permanently delete the specified user.
     */
    public function forceDelete($id)
    {
        if (!Auth::user()->isAdmin()) {
            return back()->with('error', 'Seuls les administrateurs peuvent supprimer définitivement un utilisateur.');
        }

        $user = User::withTrashed()->findOrFail($id);
        $name = $user->name;
        $user->forceDelete();
        
        return to_route("users.index")->with("success", "Utilisateur \"$name\" a été supprimé définitivement");
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore($id)
    {
        if (!Auth::user()->isAdmin()) {
            return back()->with('error', 'Seuls les administrateurs peuvent restaurer un utilisateur.');
        }

        $user = User::withTrashed()->findOrFail($id);
        $name = $user->name;
        
        $user->restore();
        $user->is_active = true;
        $user->save();
        
        return to_route("users.index")->with("success", "Utilisateur \"$name\" a été restauré avec succès");
    }

    /**
     * Toggle user role between admin and user.
     */
    public function toggleRole(User $user)
    {
        // Prevent self-demotion
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Vous ne pouvez pas modifier votre propre rôle.');
        }

        // Simple role toggle
        $newRole = $user->isAdmin() ? User::ROLE_USER : User::ROLE_ADMIN;
        $user->role = $newRole;
        $user->save();

        $roleLabel = $newRole === User::ROLE_ADMIN ? 'administrateur' : 'utilisateur';
        return back()->with('success', "Le rôle de {$user->name} a été changé en {$roleLabel}.");
    }
}
