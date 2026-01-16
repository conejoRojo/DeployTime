<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::withCount('tasks')->get();
        return view('admin.projects.index', compact('projects'));
    }

    public function create()
    {
        return view('admin.projects.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();
        Project::create($validated);

        return redirect()->route('admin.projects.index')->with('success', 'Proyecto creado correctamente.');
    }

    public function show(Project $project)
    {
        $project->load(['tasks.assignedUsers', 'tasks.creator']);
        $users = User::all(); // For assignment dropdown
        return view('admin.projects.show', compact('project', 'users'));
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return redirect()->route('admin.projects.index')->with('success', 'Proyecto actualizado.');
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return redirect()->route('admin.projects.index')->with('success', 'Proyecto eliminado.');
    }

    // Task Assignment
    public function storeTask(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'estimated_hours' => 'nullable|numeric',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        $task = $project->tasks()->create([
            'name' => $validated['name'],
            'description' => $request->description,
            'estimated_hours' => $request->estimated_hours,
            'created_by' => Auth::id(),
            'status' => 'pending'
        ]);

        if ($request->has('assigned_users')) {
            $task->assignedUsers()->sync($request->assigned_users);
        }

        return redirect()->route('admin.projects.show', $project)->with('success', 'Tarea creada y asignada.');
    }

    public function updateTask(Request $request, Task $task)
    {
        $validated = $request->validate([
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        $task->assignedUsers()->sync($request->assigned_users ?? []);

        return redirect()->back()->with('success', 'Tarea actualizada correctamente.');
    }

    public function destroyTask(Task $task)
    {
        $projectId = $task->project_id;
        $task->delete();
        return redirect()->route('admin.projects.show', $projectId)->with('success', 'Tarea eliminada.');
    }
}
