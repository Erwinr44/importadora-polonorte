<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{

    public function index()
    {
        $users = User::with('role')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'phone' => $request->phone,
            'active' => $request->has('active') ? $request->active : true,
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $user->load('role')
        ], 201);
    }


    public function show(string $id)
    {
        $user = User::with('role')->find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        return response()->json($user);
    }


    public function update(Request $request, string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        // Diferentes reglas para validación al actualizar
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|required|string|min:6',
            'role_id' => 'sometimes|required|exists:roles,id',
            'phone' => 'nullable|string|max:20',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Actualizar solo campos proporcionados
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        
        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }
        
        if ($request->has('role_id')) {
            $user->role_id = $request->role_id;
        }
        
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }
        
        if ($request->has('active')) {
            $user->active = $request->active;
        }
        
        $user->save();

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user->load('role')
        ]);
    }


    public function toggleStatus(string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        // No permitir desactivar al único administrador activo
        if ($user->role_id == 1 && $user->active) {
            $activeAdmins = User::where('role_id', 1)
                ->where('active', true)
                ->count();
                
            if ($activeAdmins <= 1) {
                return response()->json([
                    'message' => 'No se puede desactivar al único administrador activo'
                ], 400);
            }
        }
        
        $user->active = !$user->active;
        $user->save();
        
        return response()->json([
            'message' => $user->active ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
            'user' => $user->load('role')
        ]);
    }
    

    public function getRoles()
    {
        // Asegurar que solo se devuelvan roles únicos por nombre
        $roles = Role::select('id', 'name', 'description')
            ->groupBy('name')
            ->get();
            
        return response()->json($roles);
    }
}