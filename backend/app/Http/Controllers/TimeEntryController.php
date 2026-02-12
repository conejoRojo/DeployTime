<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TimeEntryController extends Controller
{
    /**
     * Get all time entries for a task.
     */
    public function index($taskId)
    {
        $user = auth()->user();
        $task = Task::with('project')->find($taskId);

        if (!$task) {
            return response()->json(['error' => 'Tarea no encontrada'], 404);
        }

        // Verificar acceso al proyecto (colaborador o asignado a la tarea)
        if (!$user->isAdmin()) {
            $isCollaborator = $task->project->collaborators->contains($user->id);
            $isAssigned = $task->assignedUsers->contains($user->id);

            if (!$isCollaborator && !$isAssigned) {
                return response()->json(['error' => 'No tienes acceso a esta tarea'], 403);
            }
        }

        $entries = TimeEntry::where('task_id', $taskId)
            ->with(['user', 'task'])
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json($entries);
    }

    /**
     * Get a specific time entry.
     */
    public function show($id)
    {
        $user = auth()->user();
        $entry = TimeEntry::with(['task.project', 'user'])->find($id);

        if (!$entry) {
            return response()->json(['error' => 'Registro de tiempo no encontrado'], 404);
        }

        // Verificar acceso
        if (!$user->isAdmin() && $entry->user_id !== $user->id) {
            return response()->json(['error' => 'No tienes acceso a este registro'], 403);
        }

        return response()->json($entry);
    }

    /**
     * Start a new time entry.
     */
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'task_id' => 'required|exists:tasks,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = auth()->user();
        $task = Task::with('project')->find($request->task_id);

        // Verificar acceso al proyecto (colaborador o asignado a la tarea)
        // Verificar acceso: Solo Admin, Asignado o Creador pueden iniciar timer
        if (!$user->isAdmin()) {
            $isAssigned = $task->assignedUsers->contains($user->id);
            $isCreator = $task->created_by === $user->id;

            if (!$isAssigned && !$isCreator) {
                return response()->json(['error' => 'Solo el usuario asignado o el creador puede iniciar el contador.'], 403);
            }
        }

        // Verificar si hay una entrada de tiempo activa
        $activeEntry = TimeEntry::where('user_id', $user->id)
            ->whereNull('end_time')
            ->first();

        if ($activeEntry) {
            return response()->json([
                'error' => 'Ya tienes una entrada de tiempo activa. Debes detenerla primero.',
                'active_entry' => $activeEntry
            ], 400);
        }

        if ($task->status === 'completed') {
            return response()->json(['error' => 'No se puede iniciar una tarea completada.'], 400);
        }

        $entry = TimeEntry::create([
            'task_id' => $request->task_id,
            'user_id' => $user->id,
            'start_time' => now(),
            'notes' => $request->notes,
        ]);

        // Actualizar estado de la tarea a in_progress si estaba en pending
        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json($entry->load(['task', 'user']), 201);
    }

    /**
     * Stop a time entry.
     */
    public function stop(Request $request, $id)
    {
        $user = auth()->user();
        $entry = TimeEntry::find($id);

        if (!$entry) {
            return response()->json(['error' => 'Registro de tiempo no encontrado'], 404);
        }

        // Solo el dueño puede detener su entrada
        if ($entry->user_id !== $user->id) {
            return response()->json(['error' => 'No puedes detener la entrada de tiempo de otro usuario'], 403);
        }

        if ($entry->end_time) {
            return response()->json(['error' => 'Esta entrada de tiempo ya fue detenida'], 400);
        }

        $entry->update([
            'end_time' => now(),
            'notes' => $request->notes ?? $entry->notes,
        ]);

        return response()->json($entry->load(['task', 'user']));
    }

    /**
     * Delete a time entry.
     */
    public function destroy($id)
    {
        $user = auth()->user();
        $entry = TimeEntry::find($id);

        if (!$entry) {
            return response()->json(['error' => 'Registro de tiempo no encontrado'], 404);
        }

        // Solo el dueño o admin pueden eliminar
        if (!$user->isAdmin() && $entry->user_id !== $user->id) {
            return response()->json(['error' => 'No tienes permiso para eliminar este registro'], 403);
        }

        $entry->delete();

        return response()->json(['message' => 'Registro de tiempo eliminado correctamente']);
    }

    /**
     * Get the active time entry for the authenticated user.
     */
    public function getActive()
    {
        // Auto-corregir tiempos negativos históricos
        try {
            TimeEntry::whereNotNull('end_time')
                ->whereColumn('end_time', '<', 'start_time')
                ->update(['end_time' => \DB::raw('start_time')]);
        } catch (\Exception $e) {
            // Ignorar si falla por DB lock u otro
        }

        $user = auth()->user();
        $activeEntry = TimeEntry::where('user_id', $user->id)
            ->whereNull('end_time')
            ->with(['task.project', 'user'])
            ->first();

        if (!$activeEntry) {
            return response()->json(null);
        }
        
        // Agregar tiempo total calculado por el servidor para sincronización
        $activeEntry->task_total_seconds = $activeEntry->task->totalTimeSpent();

        return response()->json($activeEntry);
    }

    /**
     * Get all time entries for the authenticated user.
     */
    public function myEntries(Request $request)
    {
        $user = auth()->user();

        $query = TimeEntry::where('user_id', $user->id)
            ->with(['task.project', 'user'])
            ->orderBy('start_time', 'desc');

        // Filtro opcional por fecha
        if ($request->has('from_date')) {
            $query->where('start_time', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->where('start_time', '<=', $request->to_date);
        }

        $entries = $query->get();

        return response()->json($entries);
    }
}
