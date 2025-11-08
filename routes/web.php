<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InterventionController;
use App\Http\Controllers\NotificationController;
use App\Http\Middleware\CheckRole;
use App\Http\Controllers\UserRoleController;
use App\Models\User;
use App\Http\Controllers\HistoriqueController;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\UniteMatérielController;
use App\Http\Controllers\NetworkDashboardController;
use App\Http\Controllers\DeviceDiscoveryController;
use App\Http\Controllers\DeviceStatusHistoryController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Unified Academic Dashboard - Both modules integrated
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // User Dashboard (simplified)
    Route::get('/user-dashboard', [DashboardController::class, 'userDashboard'])->name('user.dashboard');

    // Management Module Routes (Academic Structure)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN)->prefix('management')->name('management.')->group(function () {
        // Projects
        Route::resource('projects', ProjectController::class);
        
        // Users
        Route::resource('users', UserController::class)->only(['index']);
        Route::put('/users/{user}/toggle-role', [UserController::class, 'toggleRole'])->name('users.toggle-role');
        Route::delete('/users/{user}/force', [UserController::class, 'forceDelete'])->name('users.force-delete');
        Route::post('/users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
        
        // Interventions
        Route::resource('interventions', InterventionController::class);
    });

    // Admin-only Network routes (moved from above)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN)->group(function () {
        // Network Dashboard (production-ready for Sancella)
        Route::get('/network/dashboard', [NetworkDashboardController::class, 'index'])->name('network.dashboard');
        Route::get('/network/department/{department}', [NetworkDashboardController::class, 'getDevicesByDepartment'])->name('network.department');
        Route::get('/network/subnet/{subnet}', [NetworkDashboardController::class, 'getSubnetDetails'])->name('network.subnet');

        // Device Discovery Service Routes
        Route::get('/discovery', [DeviceDiscoveryController::class, 'index'])->name('discovery.index');
        Route::post('/discovery/single-ip', [DeviceDiscoveryController::class, 'discoverSingleIP'])->name('discovery.single-ip');
        Route::post('/discovery/subnet', [DeviceDiscoveryController::class, 'discoverSubnet'])->name('discovery.subnet');
        Route::get('/discovery/queue', [DeviceDiscoveryController::class, 'getQueueResults'])->name('discovery.queue');
        Route::get('/discovery/stats', [DeviceDiscoveryController::class, 'getStats'])->name('discovery.stats');
        Route::post('/discovery/clear-old', [DeviceDiscoveryController::class, 'clearOldRecords'])->name('discovery.clear-old');
        Route::get('/discovery/{id}', [DeviceDiscoveryController::class, 'show'])->name('discovery.show');
        Route::patch('/discovery/{id}/mark-processed', [DeviceDiscoveryController::class, 'markProcessed'])->name('discovery.mark-processed');
        Route::delete('/discovery/{id}', [DeviceDiscoveryController::class, 'destroy'])->name('discovery.destroy');
        
        // Auto-Assignment Routes
        Route::post('/discovery/auto-assignment', [DeviceDiscoveryController::class, 'processAutoAssignment'])->name('discovery.auto-assignment');
        Route::get('/discovery/auto-assignment/stats', [DeviceDiscoveryController::class, 'getAutoAssignmentStats'])->name('discovery.auto-assignment.stats');

        // Legacy route aliases for compatibility
        Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
        Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        
        // Devices CRUD
        Route::get('/devices', [\App\Http\Controllers\DeviceController::class, 'index'])->name('devices.index');
        Route::get('/devices/create', [\App\Http\Controllers\DeviceController::class, 'create'])->name('devices.create');
        Route::post('/devices', [\App\Http\Controllers\DeviceController::class, 'store'])->name('devices.store');
        Route::get('/devices/{device}', [\App\Http\Controllers\DeviceController::class, 'show'])->name('devices.show');
        Route::get('/devices/{device}/edit', [\App\Http\Controllers\DeviceController::class, 'edit'])->name('devices.edit');
        Route::put('/devices/{device}', [\App\Http\Controllers\DeviceController::class, 'update'])->name('devices.update');
        Route::delete('/devices/{device}', [\App\Http\Controllers\DeviceController::class, 'destroy'])->name('devices.destroy');
        
        // Device Status History Routes
        Route::get('/device-history', [DeviceStatusHistoryController::class, 'index'])->name('device.history.index');
        Route::get('/devices/{device}/history', [DeviceStatusHistoryController::class, 'show'])->name('device.history.show');
        
        // Device Ping Routes
        Route::post('/devices/{device}/ping', [DeviceController::class, 'ping'])->name('devices.ping');
        Route::get('/devices/{device}/ping-stats', [DeviceController::class, 'pingStats'])->name('devices.ping-stats');
        
        // Legacy device routes (singular form for compatibility)
        Route::get('/device', [\App\Http\Controllers\DeviceController::class, 'index'])->name('device.index');
        Route::get('/device/create', [\App\Http\Controllers\DeviceController::class, 'create'])->name('device.create');
        Route::post('/device', [\App\Http\Controllers\DeviceController::class, 'store'])->name('device.store');
        Route::get('/device/{device}', [\App\Http\Controllers\DeviceController::class, 'show'])->name('device.show');
        Route::get('/device/{device}/edit', [\App\Http\Controllers\DeviceController::class, 'edit'])->name('device.edit');
        Route::put('/device/{device}', [\App\Http\Controllers\DeviceController::class, 'update'])->name('device.update');
        Route::delete('/device/{device}', [\App\Http\Controllers\DeviceController::class, 'destroy'])->name('device.destroy');
        
        // Departments CRUD (renamed from Sites)
        Route::resource('departments', DepartmentController::class);
        
        // Unité Matériel CRUD (renamed from Racks)
        Route::resource('unite-materiels', UniteMatérielController::class)->parameters([
            'unite-materiels' => 'unite_materiel'
        ]);
        
        // New Sancella-specific routes
        Route::post('/devices/{device}/classify', [DeviceController::class, 'classify'])->name('devices.classify');
        Route::post('/devices/bulk-classify', [DeviceController::class, 'bulkClassify'])->name('devices.bulk-classify');
        Route::post('/devices/bulk-delete', [DeviceController::class, 'bulkDelete'])->name('devices.bulk-delete');
        Route::get('/devices/unknown/list', [DeviceController::class, 'getUnknownDevices'])->name('devices.unknown');
        Route::post('/devices/{device}/quick-classify', [DeviceController::class, 'quickClassify'])->name('devices.quick-classify');
        Route::get('/devices/export', [DeviceController::class, 'export'])->name('devices.export');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/user/create', [UserController::class, 'create'])->name('user.create');
        Route::post('/user', [UserController::class, 'store'])->name('user.store');
        Route::get('/user/{user}', [UserController::class, 'show'])->name('user.show');
        Route::get('/user/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
        Route::put('/user/{user}', [UserController::class, 'update'])->name('user.update');
        Route::delete('/user/{user}', [UserController::class, 'destroy'])->name('user.destroy');
    });

    // Intervention routes - accessible by both admin and users (assigned users can create interventions)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN.'|'.User::ROLE_USER)->group(function () {
        Route::get('/interventions', [InterventionController::class, 'index'])->name('interventions.index');
        Route::get('/interventions/create', [InterventionController::class, 'create'])->name('interventions.create');
        Route::post('/interventions', [InterventionController::class, 'store'])->name('interventions.store');
        Route::get('/interventions/{intervention}', [InterventionController::class, 'show'])->name('interventions.show');
        Route::get('/interventions/{intervention}/edit', [InterventionController::class, 'edit'])->name('interventions.edit');
        Route::put('/interventions/{intervention}', [InterventionController::class, 'update'])->name('interventions.update');
        Route::delete('/interventions/{intervention}', [InterventionController::class, 'destroy'])->name('interventions.destroy');
    });

    // Legacy task routes for compatibility  
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN.'|'.User::ROLE_USER)->group(function () {
        Route::get('/task/create', [TaskController::class, 'create'])->name('task.create');
        Route::post('/task', [TaskController::class, 'store'])->name('task.store');
        Route::get('/task/observed', [TaskController::class, 'observed'])->name('task.observed');
        Route::get('/task/{task}', [TaskController::class, 'show'])->name('task.show');
        Route::get('/task/{task}/edit', [TaskController::class, 'edit'])->name('task.edit');
        Route::put('/task/{task}', [TaskController::class, 'update'])->name('task.update');
        Route::delete('/task/{task}', [TaskController::class, 'destroy'])->name('task.destroy');
    });



    // Tasks Routes (Unified - accessible by both roles)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN.'|'.User::ROLE_USER)->group(function () {
        Route::get('/tasks/my-tasks', [TaskController::class, 'mytasks'])->name('task.myTasks');
        Route::get('/tasks/observed', [TaskController::class, 'observedTasks'])->name('task.observedTasks');
        
        Route::resource('tasks', TaskController::class);
    });

    // Shared Routes (accessible by both roles)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN.'|'.User::ROLE_USER)->group(function () {
        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
        Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
        Route::delete('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clearAll');

        // History
        Route::get('/historique', [HistoriqueController::class, 'index'])->name('historique.index');
    });

    // Admin Dashboard Stats (for charts and analytics)
    Route::middleware(CheckRole::class.':'.User::ROLE_ADMIN)->group(function () {
        Route::get('/dashboard/stats/{period}', [DashboardController::class, 'getStats']);
        Route::get('/dashboard/filtered-data', [DashboardController::class, 'getFilteredData'])->name('dashboard.filtered-data');
    });
});

// Legacy singular routes for compatibility with components
Route::middleware('auth')->group(function () {
    // User legacy routes (singular)
    Route::get('/user', [UserController::class, 'index'])->name('user.index');

    // Device legacy routes (singular)
    Route::get('/device', [DeviceController::class, 'index'])->name('device.index');
    Route::get('/device/create', [DeviceController::class, 'create'])->name('device.create');
    Route::post('/device', [DeviceController::class, 'store'])->name('device.store');
    Route::get('/device/{device}', [DeviceController::class, 'show'])->name('device.show');
    Route::get('/device/{device}/edit', [DeviceController::class, 'edit'])->name('device.edit');
    Route::put('/device/{device}', [DeviceController::class, 'update'])->name('device.update');
    Route::delete('/device/{device}', [DeviceController::class, 'destroy'])->name('device.destroy');

});

// Profile management
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';


