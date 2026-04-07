@extends('layouts.admin')

@section('content')
    <h2 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Card 1 -->
        <div class="bg-white rounded-lg shadow p-6 flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                👥
            </div>
            <div>
                <p class="text-gray-500 text-sm font-medium">Usuarios</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['total_users'] }}</p>
            </div>
        </div>
        <!-- Card 2 -->
        <div class="bg-white rounded-lg shadow p-6 flex items-center">
            <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                🚀
            </div>
            <div>
                <p class="text-gray-500 text-sm font-medium">Proyectos</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['total_projects'] }}</p>
            </div>
        </div>
        <!-- Card 3 -->
        <div class="bg-white rounded-lg shadow p-6 flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                ✅
            </div>
            <div>
                <p class="text-gray-500 text-sm font-medium">Tareas Totales</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['total_tasks'] }}</p>
            </div>
        </div>
        <!-- Card 4 -->
        <div class="bg-white rounded-lg shadow p-6 flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                ⏳
            </div>
            <div>
                <p class="text-gray-500 text-sm font-medium">Tareas Pendientes</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['pending_tasks'] }}</p>
            </div>
        </div>
        <!-- Card 5 (Hoy) -->
        <div class="bg-white rounded-lg shadow p-6 flex items-center">
            <div class="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                🕒
            </div>
            <div>
                <p class="text-gray-500 text-sm font-medium">Horas Hoy</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['hours_today'] }}h</p>
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Actividad Reciente</h3>
        @if($recentActivity->count() > 0)
            <div class="overflow-x-auto">
                <table class="min-w-full leading-normal text-sm">
                    <thead>
                        <tr>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wider">Proyecto / Tarea</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right font-semibold text-gray-600 uppercase tracking-wider">Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($recentActivity as $entry)
                            <tr>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white">
                                    <p class="text-gray-900 whitespace-no-wrap">{{ $entry->start_time->format('d M Y') }}</p>
                                    <p class="text-gray-500 text-xs">{{ $entry->start_time->format('H:i') }} - {{ $entry->end_time ? $entry->end_time->format('H:i') : 'Activo' }}</p>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white">
                                    <p class="text-gray-900 whitespace-no-wrap font-medium">{{ $entry->task->name ?? 'N/A' }}</p>
                                    <p class="text-gray-500 text-xs">{{ $entry->task->project->name ?? 'N/A' }}</p>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white">
                                    <p class="text-gray-900 whitespace-no-wrap">{{ $entry->user->name ?? 'Sistema' }}</p>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-200 bg-white text-right">
                                    <span class="inline-block px-3 py-1 font-semibold text-gray-900 bg-gray-100 rounded-full font-mono text-xs">
                                        {{ $entry->durationFormatted() }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @else
            <p class="text-gray-500 italic py-4">Aún no se ha registrado ninguna entrada de tiempo.</p>
        @endif
    </div>
@endsection
