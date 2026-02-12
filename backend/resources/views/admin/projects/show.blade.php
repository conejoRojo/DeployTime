@extends('layouts.admin')

@section('content')
    <div class="mb-6">
        <a href="{{ route('admin.projects.index') }}" class="text-gray-600 hover:text-gray-800 mb-4 inline-block">&larr;
            Volver a Proyectos</a>
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
                    <form action="{{ route('admin.projects.tasks.store', $project) }}" method="POST"
                        class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        @csrf
                        <div class="md:col-span-3">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                            <input type="text" name="name" class="w-full border rounded p-2 text-sm"
                                placeholder="Ej: Implementar Login" required>
                        </div>
                        <div class="md:col-span-3">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                            <input type="text" name="description" class="w-full border rounded p-2 text-sm"
                                placeholder="Ej: Breve detalle...">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Asignar a</label>
                            <select name="assigned_users[]" class="w-full border rounded p-2 text-sm h-10" multiple>
                                @foreach($users as $user)
                                    <option value="{{ $user->id }}">{{ $user->name }}</option>
                                @endforeach
                            </select>
                            <p class="text-[10px] text-gray-400 mt-1">Ctrl + Click p/ selección múltiple</p>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Horas Est.</label>
                            <input type="number" step="0.5" name="estimated_hours"
                                class="w-full border rounded p-2 text-sm h-10" placeholder="0">
                        </div>
                        <div class="md:col-span-2">
                            <button type="submit"
                                class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm h-10">
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
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Tarea</th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Asignado</th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Estado / Tiempo</th>
                            <th
                                class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php
                            $statusLabels = [
                                'pending' => 'Pendiente',
                                'in_progress' => 'En Progreso',
                                'completed' => 'Completada',
                            ];
                            $statusColors = [
                                'pending' => 'bg-gray-200 text-gray-700',
                                'in_progress' => 'bg-yellow-200 text-yellow-800',
                                'completed' => 'bg-green-200 text-green-800',
                            ];
                        @endphp
                        @forelse($project->tasks as $task)
                            <tr>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                    <p class="text-gray-900 font-medium">{{ $task->name }}</p>
                                    <p class="text-gray-500 text-xs">{{ $task->description }}</p>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                    @if($task->assignedUsers->isNotEmpty())
                                        <div class="flex flex-wrap gap-1">
                                            @foreach($task->assignedUsers as $assignedUser)
                                                <span
                                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {{ $assignedUser->name }}
                                                </span>
                                            @endforeach
                                        </div>
                                    @else
                                        <span class="text-gray-400 italic">No asignado</span>
                                    @endif
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                    <span
                                        class="inline-block px-2 py-1 text-xs font-semibold leading-tight rounded-full {{ $statusColors[$task->status] ?? 'bg-gray-200' }}">
                                        {{ $statusLabels[$task->status] ?? ucfirst($task->status) }}
                                    </span>
                                    <div class="mt-2 text-xs text-gray-600">
                                        {{ $task->totalTimeSpentFormatted() }} / {{ $task->estimated_hours ?? '-' }}
                                    </div>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        <form action="{{ route('admin.tasks.update', $task) }}" method="POST"
                                            class="flex items-center">
                                            @csrf
                                            @method('PATCH')
                                            <select name="assigned_users[]" onchange="this.form.submit()"
                                                class="text-xs border rounded p-1 bg-gray-50 max-w-[120px]" multiple size="3">
                                                @foreach($users as $u)
                                                    <option value="{{ $u->id }}" {{ $task->assignedUsers->contains($u->id) ? 'selected' : '' }}>
                                                        {{ $u->name }}
                                                    </option>
                                                @endforeach
                                            </select>
                                        </form>
                                        <form action="{{ route('admin.tasks.destroy', $task) }}" method="POST"
                                            onsubmit="return confirm('¿Borrar tarea?');">
                                            @csrf
                                            @method('DELETE')
                                            <button class="text-red-500 hover:text-red-700 ml-2">🗑️</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4"
                                    class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    No hay tareas en este proyecto.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
                <div class="px-5 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    <p class="font-bold mb-1">Estados:</p>
                    <ul class="list-disc pl-5 space-y-1">
                        <li><span class="font-semibold text-gray-700">Pendiente:</span> Tarea creada pero sin iniciar trabajo.</li>
                        <li><span class="font-semibold text-yellow-700">En Progreso:</span> Se ha registrado tiempo o se marcó activamente.</li>
                        <li><span class="font-semibold text-green-700">Completada:</span> Finalizada manualmente.</li>
                    </ul>
                    <p class="mt-2"><i>Las horas acumuladas se actualizan al recargar la página tras registrar tiempo en la app de escritorio.</i></p>
                </div>
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