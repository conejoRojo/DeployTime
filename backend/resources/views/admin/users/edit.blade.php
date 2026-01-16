@extends('layouts.admin')

@section('content')
    <div class="max-w-2xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Editar Usuario</h2>
            <a href="{{ route('admin.users.index') }}" class="text-gray-600 hover:text-gray-800">
                &larr; Volver
            </a>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <form action="{{ route('admin.users.update', $user) }}" method="POST">
                @csrf
                @method('PUT')

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Nombre</label>
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="name" type="text" name="name" value="{{ old('name', $user->name) }}" required>
                    @error('name')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email" type="email" name="email" value="{{ old('email', $user->email) }}" required>
                    @error('email')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="role">Rol</label>
                    <select
                        class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="role" name="role" required>
                        <option value="collaborator" {{ $user->role == 'collaborator' ? 'selected' : '' }}>Colaborador
                        </option>
                        <option value="admin" {{ $user->role == 'admin' ? 'selected' : '' }}>Admin</option>
                    </select>
                    @error('role')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
                </div>

                <div class="mb-4 bg-yellow-50 p-4 rounded">
                    <p class="text-sm text-yellow-800 mb-2">Dejar en blanco para mantener la contraseña actual.</p>
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Nueva Contraseña
                        (Opcional)</label>
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="password" type="password" name="password">
                    @error('password')<p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>@enderror
                </div>

                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password_confirmation">Confirmar Nueva
                        Contraseña</label>
                    <input
                        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="password_confirmation" type="password" name="password_confirmation">
                </div>

                <div class="flex items-center justify-end">
                    <button
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit">
                        Actualizar Usuario
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection