<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyInternalApiToken
{
    /**
     * Handle an incoming request.
     *
     * Verifies that the request includes a valid internal API token
     * in the Authorization header (Bearer token format).
     *
     * Used to protect internal service-to-service API endpoints
     * from unauthorized access.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedToken = config('services.internal_api.token');

        // If no token is configured, deny access (fail-secure)
        if (empty($expectedToken)) {
            return response()->json([
                'error' => 'Internal API token not configured'
            ], 500);
        }

        // Extract token from Authorization header
        $authHeader = $request->header('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'error' => 'Missing or invalid authorization header'
            ], 401);
        }

        $providedToken = substr($authHeader, 7); // Remove "Bearer " prefix

        // Constant-time comparison to prevent timing attacks
        if (!hash_equals($expectedToken, $providedToken)) {
            return response()->json([
                'error' => 'Invalid API token'
            ], 401);
        }

        return $next($request);
    }
}
