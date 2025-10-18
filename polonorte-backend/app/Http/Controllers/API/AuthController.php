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
    public function login(Request $request)
    {
        $key = 'login-attempts:' . $request->ip();
        
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
            RateLimiter::hit($key, 60);
            
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // Cargar relaciones: role y supplier
        $user = User::with(['role', 'supplier'])->where('email', $request->email)->firstOrFail();

        if (!$user->active) {
            return response()->json([
                'message' => 'Usuario inactivo. Contacta al administrador.'
            ], 403);
        }

        RateLimiter::clear($key);

        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addDays(7) 
        )->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name,
                'role_id' => $user->role_id,
                'supplier_id' => $user->supplier_id, // ← AGREGADO
                'supplier' => $user->supplier ? [
                    'id' => $user->supplier->id,
                    'company_name' => $user->supplier->company_name,
                ] : null, // ← AGREGADO
                'phone' => $user->phone,
                'active' => $user->active,
            ]
        ]);
    }

    public function user(Request $request)
    {
        // Cargar relaciones: role y supplier
        $user = $request->user()->load(['role', 'supplier']);
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->name,
            'role_id' => $user->role_id,
            'supplier_id' => $user->supplier_id, // ← AGREGADO
            'supplier' => $user->supplier ? [
                'id' => $user->supplier->id,
                'company_name' => $user->supplier->company_name,
            ] : null, // ← AGREGADO
            'phone' => $user->phone,
            'active' => $user->active,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Todas las sesiones han sido cerradas'
        ]);
    }
}