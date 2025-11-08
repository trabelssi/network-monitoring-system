<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServeServiceWorker
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->path() === 'sw.js') {
            $response = response()->file(public_path('sw.js'), [
                'Content-Type' => 'application/javascript',
                'Cache-Control' => 'no-cache',
                'Service-Worker-Allowed' => '/'
            ]);

            return $response;
        }

        return $next($request);
    }
} 