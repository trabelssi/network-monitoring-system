<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Device;
use App\Observers\DeviceObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Model Observers
        Device::observe(DeviceObserver::class);
        
        // Configure SNMP to suppress MIB warnings
        if (extension_loaded('snmp')) {
            putenv('MIBDIRS=c:/usr/share/snmp/mibs');
            // Suppress SNMP warnings in error output
            error_reporting(error_reporting() & ~E_WARNING);
        }
        
        Vite::prefetch(concurrency: 3);

        Inertia::share('auth', function () {
            if (Auth::check()) {
                try {
                    $user = Auth::user();
                    
                    // Get all notifications for the user
                    $notifications = $user->notifications()
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(function ($notification) {
                            return [
                                'id' => $notification->id,
                                'type' => $notification->type,
                                'data' => $notification->data,
                                'read_at' => $notification->read_at,
                                'created_at' => $notification->created_at
                            ];
                        });

                    Log::info('Notifications shared:', [
                        'user_id' => $user->id,
                        'count' => $notifications->count()
                    ]);

                    return [
                        'user' => array_merge($user->toArray(), [
                            'notifications' => $notifications
                        ])
                    ];
                } catch (\Exception $e) {
                    Log::error('Error sharing notifications:', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return [
                        'user' => $user
                    ];
                }
            }
            return null;
        });
    }
}
