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
        // Legacy academic discovery - REMOVED 2026-07-29
        // DiscoveryController class does not exist, was causing errors every 5 minutes
        // Discovery moved to Python service (Phase 2) - see MIGRATION_LOG.md Entry 16
        
        // WAP Monitoring - DEFERRED DECISION 2026-07-29
        // WapMonitoringService class does not exist, was causing errors every 5 minutes
        // Deferred: implement dedicated WAP monitoring OR fold into unified device monitoring
        // See MIGRATION_LOG.md Entry 16 for decision context

        // Network Discovery - Run every night at 1 AM
        // NOTE: Command is currently no-op (discovery moved to Python service)
        $schedule->command('network:discover --all')
            ->dailyAt('01:00')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/discovery.log'));
            
        // Sancella Production Jobs - NOTE: Currently no-op (moved to Python service)
        
        // Full network discovery every 4 hours (no-op until Python service deployed)
        $schedule->job(new \App\Jobs\DiscoverNetworkDevices)
            ->everyFourHours()
            ->withoutOverlapping()
            ->name('sancella-discovery');
        
        // Monitor existing devices every 2 minutes (no-op until Python service deployed)
        $schedule->job(new \App\Jobs\MonitorDeviceStatus)
            ->everyTwoMinutes()
            ->withoutOverlapping()
            ->name('sancella-monitoring');
    }
} 