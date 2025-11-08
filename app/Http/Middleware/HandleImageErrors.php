<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HandleImageErrors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if we're serving an image
        if ($this->isImageResponse($response)) {
            try {
                // If the image doesn't exist or is invalid, redirect to fallback
                if (!$this->isValidImage($response)) {
                    Log::warning('Invalid image requested', [
                        'path' => $request->path(),
                        'user' => $request->user()?->id
                    ]);
                    return redirect('/images/fallback-image.jpg');
                }
            } catch (\Exception $e) {
                Log::error('Error serving image', [
                    'path' => $request->path(),
                    'error' => $e->getMessage()
                ]);
                return redirect('/images/fallback-image.jpg');
            }
        }

        return $response;
    }

    private function isImageResponse(Response $response): bool
    {
        $contentType = $response->headers->get('Content-Type');
        return $contentType && str_starts_with($contentType, 'image/');
    }

    private function isValidImage(Response $response): bool
    {
        $content = $response->getContent();
        return !empty($content) && @getimagesizefromstring($content) !== false;
    }
} 