@extends('layouts.admin')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-3xl font-bold text-gray-800">Administrar Proyectos</h2>
    <a href="{{ route('admin.projects.create') }}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
        + Nuevo Proyecto
    </a>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    @foreach($projects as $project)
    <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
        <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $project->name }}</h3>
        <p class="text-gray-600 text-sm mb-4">{{ Str::limit($project->description, 100) ?: 'Sin descripción' }}</p>
        
        <div class="flex items-center text-sm text-gray-500 mb-4">
            <span class="mr-2">📝 {{ $project->tasks_count }} Tareas</span>
            <!-- <span>👥 3 Colaboradores</span> -->
        </div>

        <div class="flex justify-between items-center border-t pt-4">
            <a href="{{ route('admin.projects.show', $project) }}" class="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                Ver Detalles &rarr;
            </a>
            <form action="{{ route('admin.projects.destroy', $project) }}" method="POST" onsubmit="return confirm('¿Eliminar proyecto? Se borrarán todas sus tareas.');">
                @csrf
                @method('DELETE')
                <button type="submit" class="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
            </form>
        </div>
    </div>
    @endforeach
</div>
@endsection
