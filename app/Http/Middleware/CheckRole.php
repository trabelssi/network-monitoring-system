<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        // Split roles by | to allow multiple roles
        $allowedRoles = explode('|', $roles);
        
        if (!$request->user() || !collect($allowedRoles)->contains($request->user()->role)) {
            if (in_array(User::ROLE_ADMIN, $allowedRoles)) {
                return redirect()->route('user.dashboard')
                    ->with('error', 'Accès non autorisé. Vous devez être administrateur.');
            }
            return redirect()->route('dashboard')
                ->with('error', 'Accès non autorisé.');
        }

        return $next($request);
    }
} 