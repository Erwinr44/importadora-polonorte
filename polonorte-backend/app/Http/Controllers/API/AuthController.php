<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Login con protección contra fuerza bruta
     */
    public function login(Request $request)
    {
        // Clave única para rate limiting por IP
        $key = 'login-attempts:' . $request->ip();
        
        // Verificar si ha excedido intentos (5 intentos cada 1 minuto)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'message' => "Demasiados intentos de inicio de sesión. Inténtalo de nuevo en {$seconds} segundos."
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|string|max:255',
            'password' => 'required|string|min:6|max:255',
        ], [
            'email.required' => 'El correo electrónico es requerido',
            'email.email' => 'El correo electrónico debe ser válido',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            // Incrementar contador de intentos fallidos
            RateLimiter::hit($key, 60); // 60 segundos de bloqueo
            
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $user = User::with('role')->where('email', $request->email)->firstOrFail();

        if (!$user->active) {
            return response()->json([
                'message' => 'Usuario inactivo. Contacta al administrador.'
            ], 403);
        }

        // Limpiar intentos fallidos después de login exitoso
        RateLimiter::clear($key);

        // Crear token con tiempo de expiración
        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addDays(7) // Token expira en 7 días
        )->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name,
                'active' => $user->active,
            ]
        ]);
    }

    /**
     * Obtener usuario autenticado
     */
    public function user(Request $request)
    {
        $user = $request->user()->load('role');
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->name,
            'active' => $user->active,
        ]);
    }

    /**
     * Cerrar sesión (revocar token actual)
     */
    public function logout(Request $request)
    {
        // Revocar solo el token actual
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    /**
     * Cerrar todas las sesiones del usuario
     */
    public function logoutAll(Request $request)
    {
        // Revocar todos los tokens del usuario
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Todas las sesiones han sido cerradas'
        ]);
    }
}