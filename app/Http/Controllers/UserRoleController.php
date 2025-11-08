<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserRoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('role:' . User::ROLE_ADMIN);
    }

    /**
     * Display a listing of users with their roles
     */
    public function index()
    {
        $users = User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users
        ]);
    }

    /**
     * Toggle user role between admin and user
     */
    public function toggleRole(User $user)
    {
        $user->role = $user->role === User::ROLE_ADMIN ? User::ROLE_USER : User::ROLE_ADMIN;
        $user->save();

        $roleLabel = $user->role === User::ROLE_ADMIN ? 'administrateur' : 'utilisateur';
        return back()->with('success', "Le rôle a été changé en {$roleLabel}.");
    }
} 