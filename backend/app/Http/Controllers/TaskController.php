<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    /**
     * Get all tasks for a project.
     */
    public function index($projectId)
    {
        $user = auth()->user();
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        $query = Task::where('project_id', $projectId)
            ->with(['creator', 'timeEntries', 'assignedUsers']);

        if (!$user->isAdmin()) {
            // Colaborador solo ve sus tareas asignadas
            $query->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $tasks = $query->get();

        return response()->json($tasks);
    }

    /**
     * Get a specific task.
     */
    public function show($id)
    {
        $user = auth()->user();
        $task = Task::with(['project', 'creator', 'timeEntries', 'assignedUsers'])->find($id);

        if (!$task) {
            return response()->json(['error' => 'Tarea no encontrada'], 404);
        }

        // Verificar acceso (admin o asignado)
        if (!$user->isAdmin()) {
            $isAssigned = $task->assignedUsers->contains($user->id);

            if (!$isAssigned) {
                return response()->json(['error' => 'No tienes acceso a esta tarea'], 403);
            }
        }

        return response()->json($task);
    }

    /**
     * Create a new task.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'estimated_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = auth()->user();
        $project = Project::find($request->project_id);

        // Verificar que el usuario tenga acceso al proyecto (colaborador o tiene tareas asignadas)
        if (!$user->isAdmin()) {
            $isCollaborator = $project->collaborators->contains($user->id);
            $hasAssignedTask = $project->tasks()->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->exists();

            if (!$isCollaborator && !$hasAssignedTask) {
                return response()->json(['error' => 'No tienes acceso a este proyecto'], 403);
            }
        }

        $task = Task::create([
            'project_id' => $request->project_id,
            'name' => $request->name,
            'description' => $request->description,
            'estimated_hours' => $request->estimated_hours,
            'status' => $request->status ?? 'pending',
            'created_by' => auth()->id(),
        ]);

        // Manejar asignaciones
        if ($request->has('assigned_users')) {
            $task->assignedUsers()->sync($request->assigned_users);
        } else if (!$user->isAdmin()) {
            // Si un colaborador crea una tarea y no asigna a nadie, se la auto-asigna
            // para asegurar que pueda verla (según las reglas de filtrado anteriores)
            $task->assignedUsers()->sync([$user->id]);
        }

        return response()->json($task->load(['project', 'creator', 'assignedUsers']), 201);
    }

    /**
     * Update a task.
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $task = Task::find($id);

        if (!$task) {
            return response()->json(['error' => 'Tarea no encontrada'], 404);
        }

        // Verificar acceso (admin o asignado)
        if (!$user->isAdmin()) {
            $isAssigned = $task->assignedUsers->contains($user->id);

            if (!$isAssigned) {
                return response()->json(['error' => 'No tienes acceso a esta tarea'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'estimated_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,in_progress,completed',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $task->update($request->only(['name', 'description', 'estimated_hours', 'status']));

        if ($request->has('assigned_users')) {
            $task->assignedUsers()->sync($request->assigned_users);
        }

        return response()->json($task->load(['project', 'creator', 'assignedUsers']));
    }

    /**
     * Delete a task.
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $task = Task::find($id);

        if (!$task) {
            return response()->json(['error' => 'Tarea no encontrada'], 404);
        }

        // Solo el creador o admin pueden eliminar
        if (!$user->isAdmin() && $task->created_by !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta tarea'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Tarea eliminada correctamente']);
    }
}
