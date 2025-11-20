<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
// use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{

    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        // En Laravel 11, el middleware se aplica en las rutas
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Register a new user (only for development/testing).
     * In production, only admins should create users.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'collaborator', // Default role
        ]);

        $token = auth()->login($user);

        return $this->respondWithToken($token);
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        return response()->json(auth()->user());
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        auth()->logout();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    /**
     * Listar todos los usuarios (solo admin).
     */
    public function indexUsers(Request $request)
    {
        $user = auth()->user();                                // usuario autenticado

        if (!$user || !$user->isAdmin()) {                     // si no es admin
            return response()->json([                          // devolvemos error
                'error' => 'No autorizado. Solo administradores pueden listar usuarios.',
            ], 403);
        }

        $query = User::query();                                // comenzamos query base

        if ($request->filled('role')) {                        // filtro opcional por rol
            $query->where('role', $request->input('role'));    // aplicamos filtro role
        }

        if ($request->filled('search')) {                      // filtro opcional por texto
            $search = $request->input('search');               // leemos término de búsqueda
            $query->where(function ($q) use ($search) {        // agrupamos condiciones
                $q->where('name', 'like', '%' . $search . '%') // nombre contiene texto
                    ->orWhere('email', 'like', '%' . $search . '%'); // o email contiene texto
            });
        }

        $users = $query->orderBy('name')->get();               // ejecutamos query ordenada

        return response()->json($users);                       // devolvemos lista de usuarios
    }

    /**
     * Crear un nuevo usuario (solo admin).
     */
    public function storeUser(Request $request)
    {
        $user = auth()->user();                                // usuario autenticado

        if (!$user || !$user->isAdmin()) {                     // si no es admin
            return response()->json([
                'error' => 'No autorizado. Solo administradores pueden crear usuarios.',
            ], 403);
        }

        $validator = Validator::make(                          // validamos entrada
            $request->all(),
            [
                'name'     => 'required|string|max:255',       // nombre requerido
                'email'    => 'required|email|unique:users,email', // email único
                'password' => 'required|string|min:8',         // password mínimo 8
                'role'     => 'required|in:admin,collaborator', // rol permitido
            ]
        );

        if ($validator->fails()) {                             // si hay errores
            return response()->json(                           // devolvemos errores 422
                $validator->errors(),
                422
            );
        }

        $newUser = User::create([                              // creamos usuario
            'name'     => $request->input('name'),             // nombre
            'email'    => $request->input('email'),            // email
            'password' => Hash::make($request->input('password')), // password hasheado
            'role'     => $request->input('role'),             // rol
        ]);

        return response()->json([                              // devolvemos OK
            'message' => 'Usuario creado correctamente.',
            'user'    => $newUser,
        ], 201);                                               // HTTP 201 Created
    }

    /**
     * Actualizar un usuario existente (solo admin).
     */
    public function updateUser(Request $request, $id)
    {
        $user = auth()->user();                                // usuario autenticado

        if (!$user || !$user->isAdmin()) {                     // si no es admin
            return response()->json([
                'error' => 'No autorizado. Solo administradores pueden actualizar usuarios.',
            ], 403);
        }

        $targetUser = User::find($id);                         // buscamos usuario objetivo

        if (!$targetUser) {                                    // si no existe
            return response()->json([
                'error' => 'Usuario no encontrado.',
            ], 404);
        }

        $validator = Validator::make(                          // validamos entrada
            $request->all(),
            [
                'name'     => 'sometimes|required|string|max:255', // nombre opcional
                'email'    => 'sometimes|required|email|unique:users,email,' . $targetUser->id, // email único
                'password' => 'sometimes|required|string|min:8',   // password opcional
                'role'     => 'sometimes|required|in:admin,collaborator', // rol opcional
            ]
        );

        if ($validator->fails()) {                             // si hay errores
            return response()->json(
                $validator->errors(),
                422
            );
        }

        if ($request->filled('name')) {                        // si viene nombre
            $targetUser->name = $request->input('name');       // actualizamos nombre
        }

        if ($request->filled('email')) {                       // si viene email
            $targetUser->email = $request->input('email');     // actualizamos email
        }

        if ($request->filled('password')) {                    // si viene password
            $targetUser->password = Hash::make(                // hasheamos password
                $request->input('password')
            );
        }

        if ($request->filled('role')) {                        // si viene rol
            $targetUser->role = $request->input('role');       // actualizamos rol
        }

        $targetUser->save();                                   // guardamos cambios

        return response()->json([                              // devolvemos respuesta
            'message' => 'Usuario actualizado correctamente.',
            'user'    => $targetUser,
        ]);
    }

    /**
     * Eliminar un usuario (solo admin).
     */
    public function destroyUser($id)
    {
        $user = auth()->user();                                // usuario autenticado

        if (!$user || !$user->isAdmin()) {                     // si no es admin
            return response()->json([
                'error' => 'No autorizado. Solo administradores pueden eliminar usuarios.',
            ], 403);
        }

        $targetUser = User::find($id);                         // buscamos usuario objetivo

        if (!$targetUser) {                                    // si no existe
            return response()->json([
                'error' => 'Usuario no encontrado.',
            ], 404);
        }

        if ($targetUser->id === $user->id) {                   // evitamos que se borre a sí mismo
            return response()->json([
                'error' => 'No puedes eliminar tu propio usuario.',
            ], 400);
        }

        $targetUser->delete();                                 // borramos el usuario

        return response()->json([
            'message' => 'Usuario eliminado correctamente.',
        ]);
    }


    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => auth()->user()
        ]);
    }
}
