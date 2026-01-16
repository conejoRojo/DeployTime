<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeployTime Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-slate-800 text-white flex-shrink-0">
            <div class="p-6">
                <h1 class="text-2xl font-bold tracking-wider">DeployTime</h1>
                <p class="text-xs text-slate-400 mt-1">Admin Console</p>
            </div>
            <nav class="mt-6">
                <a href="{{ route('admin.dashboard') }}" class="block px-6 py-3 hover:bg-slate-700 {{ request()->routeIs('admin.dashboard') ? 'bg-slate-700' : '' }}">
                    📊 Dashboard
                </a>
                <a href="{{ route('admin.projects.index') }}" class="block px-6 py-3 hover:bg-slate-700 {{ request()->routeIs('admin.projects.*') ? 'bg-slate-700' : '' }}">
                    🚀 Proyectos
                </a>
                <a href="{{ route('admin.users.index') }}" class="block px-6 py-3 hover:bg-slate-700 {{ request()->routeIs('admin.users.*') ? 'bg-slate-700' : '' }}">
                    👥 Usuarios
                </a>
            </nav>
            <div class="p-6 mt-auto">
                <form action="{{ route('logout') }}" method="POST">
                    @csrf
                    <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition">
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-8 overflow-y-auto">
            @if(session('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <span class="block sm:inline">{{ session('success') }}</span>
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</body>
</html>
