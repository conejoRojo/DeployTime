<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    /**
     * Get all projects for the authenticated user.
     */
    public function index()
    {
        $user = auth()->user();

        if ($user->isAdmin()) {
            // Admin ve todos los proyectos
            $projects = Project::with(['creator', 'collaborators'])->get();
        } else {
            // Colaborador ve proyectos donde es colaborador O tiene tareas asignadas
            $projects = Project::whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->orWhereHas('tasks.assignedUsers', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->with(['creator', 'collaborators'])->get();
        }

        return response()->json($projects);
    }

    /**
     * Get a specific project.
     */
    public function show($id)
    {
        $user = auth()->user();
        $project = Project::with(['creator', 'collaborators', 'tasks.assignedUsers'])->find($id);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        // Verificar que el usuario tenga acceso al proyecto
        if (!$user->isAdmin()) {
            $isCollaborator = $project->collaborators->contains($user->id);
            $hasTask = $project->tasks()->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->exists();

            if (!$isCollaborator && !$hasTask) {
                return response()->json(['error' => 'No tienes acceso a este proyecto'], 403);
            }
        }

        return response()->json($project);
    }

    /**
     * Create a new project (admin only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $project = Project::create([
            'name' => $request->name,
            'description' => $request->description,
            'created_by' => auth()->id(),
        ]);

        return response()->json($project, 201);
    }

    /**
     * Update a project (admin only).
     */
    public function update(Request $request, $id)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $project->update($request->only(['name', 'description']));

        return response()->json($project);
    }

    /**
     * Delete a project (admin only).
     */
    public function destroy($id)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        $project->delete();

        return response()->json(['message' => 'Proyecto eliminado correctamente']);
    }

    /**
     * Add collaborator to project (admin only).
     */
    public function addCollaborator(Request $request, $id)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Verificar que no esté ya agregado
        if ($project->collaborators->contains($request->user_id)) {
            return response()->json(['error' => 'El usuario ya es colaborador de este proyecto'], 400);
        }

        $project->collaborators()->attach($request->user_id);

        return response()->json([
            'message' => 'Colaborador agregado correctamente',
            'project' => $project->load('collaborators')
        ]);
    }

    /**
     * Remove collaborator from project (admin only).
     */
    public function removeCollaborator($id, $userId)
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json(['error' => 'Proyecto no encontrado'], 404);
        }

        $project->collaborators()->detach($userId);

        return response()->json(['message' => 'Colaborador removido correctamente']);
    }
}
