<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DeviceEventController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Internal API routes (protected by internal.api middleware)
Route::middleware('internal.api')->group(function () {
    // Device event webhook from Python service
    Route::post('/internal/device-events', [DeviceEventController::class, 'store'])
        ->name('api.internal.device-events');
});
