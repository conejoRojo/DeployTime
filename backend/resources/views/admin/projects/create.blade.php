@extends('layouts.admin')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Crear Proyecto</h2>
        <a href="{{ route('admin.projects.index') }}" class="text-gray-600 hover:text-gray-800">
            &larr; Volver
        </a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <form action="{{ route('admin.projects.store') }}" method="POST">
            @csrf
            
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Nombre del Proyecto</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" name="name" value="{{ old('name') }}" required>
                @error('name')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
            </div>

            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="description">Descripción (Opcional)</label>
                <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32" id="description" name="description">{{ old('description') }}</textarea>
                @error('description')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
            </div>

            <div class="flex items-center justify-end">
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                    Crear Proyecto
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
