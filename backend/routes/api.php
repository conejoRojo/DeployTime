<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\ReportController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']); // Solo para desarrollo
});

// Protected routes
Route::group(['middleware' => 'auth:api'], function () {
    // Auth routes
    Route::group(['prefix' => 'auth'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });

    // Projects (solo admin puede crear/eliminar, colaboradores solo leen)
    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{id}', [ProjectController::class, 'show']);
    Route::post('projects', [ProjectController::class, 'store'])->middleware('admin');
    Route::put('projects/{id}', [ProjectController::class, 'update'])->middleware('admin');
    Route::delete('projects/{id}', [ProjectController::class, 'destroy'])->middleware('admin');

    // Asignar colaboradores a proyectos (solo admin)


    Route::post('projects/{id}/collaborators', [ProjectController::class, 'addCollaborator'])->middleware('admin');
    Route::delete('projects/{id}/collaborators/{userId}', [ProjectController::class, 'removeCollaborator'])->middleware('admin');

    // Tasks (colaboradores pueden crear tareas en sus proyectos)
    Route::get('projects/{projectId}/tasks', [TaskController::class, 'index']);
    Route::get('tasks/{id}', [TaskController::class, 'show']);
    Route::post('tasks', [TaskController::class, 'store']);
    Route::put('tasks/{id}', [TaskController::class, 'update']);
    Route::delete('tasks/{id}', [TaskController::class, 'destroy']);

    // Time Entries
    Route::get('tasks/{taskId}/time-entries', [TimeEntryController::class, 'index']);
    Route::get('time-entries/{id}', [TimeEntryController::class, 'show']);
    Route::post('time-entries', [TimeEntryController::class, 'start']);
    Route::put('time-entries/{id}/stop', [TimeEntryController::class, 'stop']);
    Route::delete('time-entries/{id}', [TimeEntryController::class, 'destroy']);

    // Time entries activas del usuario
    Route::get('my/active-time-entry', [TimeEntryController::class, 'getActive']);
    Route::get('my/time-entries', [TimeEntryController::class, 'myEntries']);

    // Gestión de usuarios (solo admin)
    Route::middleware('admin')->group(function () {              // grupo protegido por middleware admin
        Route::get('users', [AuthController::class, 'indexUsers']);     // listar usuarios
        Route::post('users', [AuthController::class, 'storeUser']);     // crear usuario
        Route::put('users/{id}', [AuthController::class, 'updateUser']); // actualizar usuario
        Route::delete('users/{id}', [AuthController::class, 'destroyUser']); // eliminar usuario
    });

    // Reportes
    Route::get(
        'reports/me',
        [ReportController::class, 'mySummary']
    );                                                           // resumen del usuario autenticado

    Route::middleware('admin')->group(function () {              // grupo de reportes solo admin
        Route::get(
            'reports/overview',
            [ReportController::class, 'overview']
        );                                                       // resumen general

        Route::get(
            'reports/users/{id}',
            [ReportController::class, 'userDetail']
        );                                                       // detalle por usuario

        Route::get(
            'reports/projects/{projectId}',
            [ReportController::class, 'projectDetail']
        );                                                       // detalle por proyecto
    });
});
