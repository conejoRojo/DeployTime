<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\Auth\LoginController;
use App\Http\Controllers\Web\Admin\DashboardController;
use App\Http\Controllers\Web\Admin\UserController;
use App\Http\Controllers\Web\Admin\ProjectController;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

// Authentication Routes
Route::get('login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('login', [LoginController::class, 'login']);
Route::post('logout', [LoginController::class, 'logout'])->name('logout');

// Admin Routes (Protected)
Route::group(['prefix' => 'admin', 'as' => 'admin.', 'middleware' => 'auth:web'], function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Users crud
    Route::resource('users', UserController::class);

    // Projects crud and task assignment
    Route::resource('projects', ProjectController::class);
    Route::post('projects/{project}/tasks', [ProjectController::class, 'storeTask'])->name('projects.tasks.store');
    Route::patch('tasks/{task}', [ProjectController::class, 'updateTask'])->name('tasks.update');
    Route::delete('tasks/{task}', [ProjectController::class, 'destroyTask'])->name('tasks.destroy');
});
