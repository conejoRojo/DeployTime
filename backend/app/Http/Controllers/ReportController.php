<?php

namespace App\Http\Controllers;                       // espacio de nombres del controlador

use App\Models\Project;                               // importamos el modelo Project
use App\Models\TimeEntry;                             // importamos el modelo TimeEntry
use App\Models\User;                                  // importamos el modelo User
use Illuminate\Http\Request;                          // importamos la Request de Laravel
use Illuminate\Support\Facades\Validator;             // importamos el validador

class ReportController extends Controller             // declaramos la clase ReportController
{
    /**
     * Reporte general de tiempos (solo admin).
     */
    public function overview(Request $request)        // método overview que recibe la Request
    {
        $user = auth()->user();                       // obtenemos el usuario autenticado

        if (!$user || !$user->isAdmin()) {            // si no hay usuario o no es admin
            return response()->json([                 // devolvemos respuesta JSON de error
                'error' => 'No autorizado. Solo administradores pueden ver este reporte.', // mensaje claro
            ], 403);                                  // código HTTP 403 Forbidden
        }

        $validator = Validator::make(                 // construimos el validador de entrada
            $request->all(),                          // todos los datos del request
            [                                         // reglas de validación
                'from_date' => 'nullable|date',       // desde: fecha opcional
                'to_date'   => 'nullable|date',       // hasta: fecha opcional
            ]
        );

        if ($validator->fails()) {                    // si la validación falla
            return response()->json(                  // devolvemos errores de validación
                $validator->errors(),                 // lista de errores
                422                                   // código HTTP 422 Unprocessable Entity
            );
        }

        $query = TimeEntry::with(['user', 'task.project']); // base query con relaciones user y proyecto

        if ($request->filled('from_date')) {          // si viene parámetro from_date
            $query->where(
                'start_time',
                '>=',         // filtramos por fecha de inicio mayor o igual
                $request->input('from_date')
            );        // valor de from_date
        }

        if ($request->filled('to_date')) {            // si viene parámetro to_date
            $query->where(
                'start_time',
                '<=',         // filtramos por fecha de inicio menor o igual
                $request->input('to_date')
            );          // valor de to_date
        }

        $entries = $query->get();                     // ejecutamos la consulta y obtenemos colección de TimeEntry

        $summary = $this->buildSummary($entries);     // construimos resumen usando helper

        return response()->json($summary);            // devolvemos el resumen en JSON
    }

    /**
     * Reporte de tiempos del usuario autenticado.
     */
    public function mySummary(Request $request)       // método para resumen del usuario logueado
    {
        $user = auth()->user();                       // obtenemos el usuario autenticado

        $validator = Validator::make(                 // validamos parámetros de fecha
            $request->all(),
            [
                'from_date' => 'nullable|date',       // fecha desde opcional
                'to_date'   => 'nullable|date',       // fecha hasta opcional
            ]
        );

        if ($validator->fails()) {                    // si falla la validación
            return response()->json(                  // devolvemos errores
                $validator->errors(),
                422
            );
        }

        $query = TimeEntry::with(['user', 'task.project']) // query de time entries con relaciones
            ->where('user_id', $user->id);            // filtramos por id del usuario autenticado

        if ($request->filled('from_date')) {          // si viene from_date
            $query->where(
                'start_time',
                '>=',         // aplicamos filtro desde
                $request->input('from_date')
            );
        }

        if ($request->filled('to_date')) {            // si viene to_date
            $query->where(
                'start_time',
                '<=',         // aplicamos filtro hasta
                $request->input('to_date')
            );
        }

        $entries = $query->get();                     // obtenemos entradas de tiempo filtradas

        $summary = $this->buildSummary($entries);     // construimos el resumen

        return response()->json($summary);            // devolvemos JSON
    }

    /**
     * Reporte detallado por usuario (solo admin).
     */
    public function userDetail(Request $request, $id) // método para reporte de un usuario específico
    {
        $user = auth()->user();                       // usuario autenticado

        if (!$user || !$user->isAdmin()) {            // si no es admin
            return response()->json([                 // devolvemos error
                'error' => 'No autorizado. Solo administradores pueden ver este reporte.',
            ], 403);
        }

        $targetUser = User::find($id);                // buscamos el usuario objetivo por id

        if (!$targetUser) {                           // si no existe
            return response()->json([                 // devolvemos 404
                'error' => 'Usuario no encontrado.',
            ], 404);
        }

        $validator = Validator::make(                 // validamos fechas
            $request->all(),
            [
                'from_date' => 'nullable|date',
                'to_date'   => 'nullable|date',
            ]
        );

        if ($validator->fails()) {                    // si hay errores
            return response()->json(
                $validator->errors(),
                422
            );
        }

        $query = TimeEntry::with(['user', 'task.project']) // query de time entries de ese usuario
            ->where('user_id', $targetUser->id);      // filtramos por id de targetUser

        if ($request->filled('from_date')) {          // filtro desde
            $query->where('start_time', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {            // filtro hasta
            $query->where('start_time', '<=', $request->input('to_date'));
        }

        $entries = $query->get();                     // ejecutamos la consulta

        $summary = $this->buildSummary($entries);     // construimos resumen base

        $summary['user'] = [                          // agregamos datos del usuario al resumen
            'id'    => $targetUser->id,               // id del usuario
            'name'  => $targetUser->name,             // nombre
            'email' => $targetUser->email,            // email
            'role'  => $targetUser->role,             // rol
        ];

        return response()->json($summary);            // devolvemos el reporte
    }

    /**
     * Reporte detallado por proyecto.
     */
    public function projectDetail(Request $request, $projectId) // método para reporte de un proyecto
    {
        $user = auth()->user();                       // usuario autenticado

        $project = Project::with(['creator', 'collaborators']) // cargamos proyecto con relaciones
            ->find($projectId);                       // buscamos el proyecto por id

        if (!$project) {                              // si no existe proyecto
            return response()->json([
                'error' => 'Proyecto no encontrado.',
            ], 404);
        }

        if (!$user->isAdmin()) {                      // si el usuario no es admin
            $isCollaborator = $project->collaborators()   // revisamos si es colaborador
                ->where('users.id', $user->id)        // filtramos por id de usuario
                ->exists();                           // verificamos existencia

            if (!$isCollaborator && $project->created_by !== $user->id) { // si no es colaborador ni creador
                return response()->json([
                    'error' => 'No autorizado para ver este proyecto.',
                ], 403);
            }
        }

        $validator = Validator::make(                 // validamos fechas
            $request->all(),
            [
                'from_date' => 'nullable|date',
                'to_date'   => 'nullable|date',
            ]
        );

        if ($validator->fails()) {                    // si hay errores
            return response()->json(
                $validator->errors(),
                422
            );
        }

        $query = TimeEntry::with(['user', 'task.project']) // query de time entries ligados a este proyecto
            ->whereHas('task', function ($q) use ($projectId) { // filtramos por tasks de ese proyecto
                $q->where('project_id', $projectId); // condición por project_id
            });

        if ($request->filled('from_date')) {          // filtro desde
            $query->where('start_time', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {            // filtro hasta
            $query->where('start_time', '<=', $request->input('to_date'));
        }

        $entries = $query->get();                     // obtenemos time entries del proyecto

        $summary = $this->buildSummary($entries);     // construimos resumen

        $summary['project'] = [                       // agregamos info básica del proyecto
            'id'          => $project->id,            // id
            'name'        => $project->name,          // nombre
            'description' => $project->description,   // descripción
        ];

        return response()->json($summary);            // devolvemos JSON
    }

    /**
     * Helper para construir resumen a partir de una colección de TimeEntry.
     */
    protected function buildSummary($entries)         // método protegido que recibe colección de TimeEntry
    {
        $totalSeconds = 0;                            // inicializamos acumulador de segundos totales

        $byUser = [];                                 // array de acumulados por usuario
        $byProject = [];                              // array de acumulados por proyecto

        foreach ($entries as $entry) {                // iteramos cada entrada de tiempo
            $seconds = $entry->durationInSeconds();   // calculamos la duración en segundos usando helper del modelo
            $totalSeconds += $seconds;                // sumamos al total general

            if ($entry->user) {                       // si la relación user está disponible
                $userId = $entry->user->id;           // obtenemos id del usuario

                if (!isset($byUser[$userId])) {       // si aún no existe este usuario en el array
                    $byUser[$userId] = [              // inicializamos la estructura de datos
                        'id'            => $entry->user->id,    // id
                        'name'          => $entry->user->name,  // nombre
                        'email'         => $entry->user->email, // email
                        'role'          => $entry->user->role,  // rol
                        'total_seconds' => 0,                   // acumulador de segundos
                    ];
                }

                $byUser[$userId]['total_seconds'] += $seconds;  // sumamos segundos para ese usuario
            }

            if ($entry->task && $entry->task->project) {        // si la entrada tiene proyecto asociado
                $project = $entry->task->project;               // obtenemos el proyecto
                $projectId = $project->id;                      // id del proyecto

                if (!isset($byProject[$projectId])) {           // si no existe aún en el array
                    $byProject[$projectId] = [                  // inicializamos datos del proyecto
                        'id'            => $project->id,        // id
                        'name'          => $project->name,      // nombre
                        'description'   => $project->description, // descripción
                        'total_seconds' => 0,                   // acumulador
                    ];
                }

                $byProject[$projectId]['total_seconds'] += $seconds; // sumamos segundos al proyecto
            }
        }

        $totalHours = round($totalSeconds / 3600, 2);           // convertimos total de segundos a horas

        $users = [];                                            // array final de usuarios
        foreach ($byUser as $userData) {                        // recorremos acumulados por usuario
            $userData['total_hours'] =                         // calculamos horas por usuario
                round($userData['total_seconds'] / 3600, 2);   // segundos a horas con 2 decimales
            $users[] = $userData;                              // agregamos al array final
        }

        $projects = [];                                        // array final de proyectos
        foreach ($byProject as $projectData) {                 // recorremos acumulados por proyecto
            $projectData['total_hours'] =                      // calculamos horas por proyecto
                round($projectData['total_seconds'] / 3600, 2);
            $projects[] = $projectData;                        // agregamos al array final
        }

        return [                                               // devolvemos estructura de resumen
            'total_seconds' => $totalSeconds,                  // segundos totales
            'total_hours'   => $totalHours,                    // horas totales
            'by_user'       => $users,                         // detalle por usuario
            'by_project'    => $projects,                      // detalle por proyecto
        ];
    }
}
