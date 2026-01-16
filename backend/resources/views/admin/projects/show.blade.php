@extends('layouts.admin')

@section('content')
<div class="mb-6">
    <a href="{{ route('admin.projects.index') }}" class="text-gray-600 hover:text-gray-800 mb-4 inline-block">&larr; Volver a Proyectos</a>
    <div class="flex justify-between items-start">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">{{ $project->name }}</h1>
            <p class="text-gray-600 mt-2">{{ $project->description }}</p>
        </div>
        <!-- <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            ⚙️ Configurar
        </button> -->
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Tasks Section -->
    <div class="lg:col-span-2">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">Tareas</h3>
            <!-- Trigger Modal could go here -->
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div class="p-4 bg-gray-50 border-b border-gray-200">
                <h4 class="font-bold text-sm text-gray-600 uppercase">Nueva Tarea</h4>
            </div>
            <div class="p-4">
                <form action="{{ route('admin.projects.tasks.store', $project) }}" method="POST" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    @csrf
                    <div class="md:col-span-4">
                        <label class="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="name" class="w-full border rounded p-2 text-sm" placeholder="Ej: Implementar Login" required>
                    </div>
                    <div class="md:col-span-3">
                        <label class="block text-xs font-bold text-gray-700 mb-1">Asignar a</label>
                        <select name="assigned_to" class="w-full border rounded p-2 text-sm">
                            <option value="">-- Sin asignar --</option>
                            @foreach($users as $user)
                                <option value="{{ $user->id }}">{{ $user->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-gray-700 mb-1">Horas Est.</label>
                        <input type="number" step="0.5" name="estimated_hours" class="w-full border rounded p-2 text-sm" placeholder="0">
                    </div>
                    <div class="md:col-span-3">
                        <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
                            + Agregar
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Task List -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full leading-normal">
                <thead>
                    <tr>
                        <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarea</th>
                        <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Asignado</th>
                        <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($project->tasks as $task)
                    <tr>
                        <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                            <p class="text-gray-900 font-medium">{{ $task->name }}</p>
                            <p class="text-gray-500 text-xs">{{ $task->description }}</p>
                        </td>
                        <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                            @if($task->assignedTo)
                                <div class="flex items-center">
                                    <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">
                                        {{ substr($task->assignedTo->name, 0, 1) }}
                                    </div>
                                    <span>{{ $task->assignedTo->name }}</span>
                                </div>
                            @else
                                <span class="text-gray-400 italic">No asignado</span>
                            @endif
                        </td>
                        <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                            <span class="inline-block px-2 py-1 text-xs font-semibold leading-tight text-gray-700 bg-gray-200 rounded-full">
                                {{ ucfirst($task->status) }}
                            </span>
                            @if($task->estimated_hours)
                                <span class="block text-xs text-gray-500 mt-1">{{ $task->estimated_hours }}h est.</span>
                            @endif
                        </td>
                        <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                            <form action="{{ route('admin.tasks.destroy', $task) }}" method="POST" onsubmit="return confirm('¿Borrar tarea?');">
                                @csrf
                                @method('DELETE')
                                <button class="text-red-500 hover:text-red-700">🗑️</button>
                            </form>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                            No hay tareas en este proyecto.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Sidebar Info -->
    <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h4 class="font-bold text-gray-800 mb-4">Resumen</h4>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600">Total Tareas:</span>
                    <span class="font-bold">{{ $project->tasks->count() }}</span>
                </div>
                <!-- Add more stats if needed -->
            </div>
        </div>
    </div>

</div>
@endsection
