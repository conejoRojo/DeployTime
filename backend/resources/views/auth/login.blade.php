<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - DeployTime Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 class="text-3xl font-bold text-center mb-6 text-slate-800">DeployTime</h2>
        <form action="{{ route('login') }}" method="POST">
            @csrf
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" name="email" value="{{ old('email') }}" required autofocus>
                @error('email')
                    <p class="text-red-500 text-xs italic mt-1">{{ $message }}</p>
                @enderror
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" name="password" required>
            </div>
            <div class="flex items-center justify-between">
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition" type="submit">
                    Ingresar
                </button>
            </div>
        </form>
    </div>
</body>
</html>
