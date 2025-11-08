<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * These middleware are run during every request to your application.
     *
     * @var array
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Fruitcake\Cors\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\Session\Middleware\AuthenticateSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * The application's route middleware.
     *
     * These middleware may be assigned to groups or used individually.
     *
     * @var array
     */
    protected $middlewareAliases = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'cache' => \Illuminate\Http\Middleware\ResponseCache::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ];

    protected $commands = [
        Commands\TestDiscoveryCommand::class,
        Commands\VerifyDiscoveryCommand::class,
        Commands\LongRunningDiscoveryCommand::class,
        Commands\ManageDiscoveryLockCommand::class,
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Legacy academic discovery
        $schedule->call(function () {
            \App::make(\App\Http\Controllers\DiscoveryController::class)->scanExistingDevices();
        })->everyFiveMinutes();

        // WAP Monitoring - Ping all monitored WAPs every 5 minutes
        $schedule->call(function () {
            $monitoringService = \App::make(\App\Services\WapMonitoringService::class);
            $monitoringService->pingAllMonitoredWaps();
        })->everyFiveMinutes()->name('wap-monitoring');

        // Network Discovery - Run every night at 1 AM
        $schedule->command('network:discover --all')
            ->dailyAt('01:00')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/discovery.log'));
            
        // Sancella Production Jobs
        // Full network discovery every 4 hours
        $schedule->job(new \App\Jobs\DiscoverNetworkDevices)
            ->everyFourHours()
            ->withoutOverlapping()
            ->name('sancella-discovery');
        
        // Monitor existing devices every 2 minutes
        $schedule->job(new \App\Jobs\MonitorDeviceStatus)
            ->everyTwoMinutes()
            ->withoutOverlapping()
            ->name('sancella-monitoring');
    }
} 