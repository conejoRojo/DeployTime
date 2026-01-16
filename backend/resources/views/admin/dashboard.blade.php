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
    </div>

    <!-- Chart Placeholder -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Actividad Reciente</h3>
        <p class="text-gray-500">Aquí se mostrarán gráficos de actividad en el futuro.</p>
        <!-- <canvas id="activityChart"></canvas> -->
    </div>
@endsection
