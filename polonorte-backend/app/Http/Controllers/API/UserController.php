<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['role', 'supplier'])->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'phone' => 'nullable|string|max:20',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validar que si el rol es Proveedor, debe tener supplier_id
        $role = Role::find($request->role_id);
        if ($role && $role->name === 'Proveedor' && !$request->supplier_id) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['supplier_id' => ['El campo proveedor es requerido para usuarios con rol Proveedor']]
            ], 422);
        }

        // Validar que supplier_id solo se asigne si el rol es Proveedor
        if ($request->supplier_id && $role && $role->name !== 'Proveedor') {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['supplier_id' => ['Solo los usuarios con rol Proveedor pueden tener una empresa asignada']]
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'supplier_id' => $request->supplier_id,
            'phone' => $request->phone,
            'active' => $request->has('active') ? $request->active : true,
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $user->load(['role', 'supplier'])
        ], 201);
    }

    public function show(string $id)
    {
        $user = User::with(['role', 'supplier'])->find($id);
        
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
            'supplier_id' => 'nullable|exists:suppliers,id',
            'phone' => 'nullable|string|max:20',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Determinar el rol (puede ser el nuevo o el actual)
        $roleId = $request->has('role_id') ? $request->role_id : $user->role_id;
        $role = Role::find($roleId);

        // Validar que si el rol es Proveedor, debe tener supplier_id
        if ($role && $role->name === 'Proveedor') {
            $supplierId = $request->has('supplier_id') ? $request->supplier_id : $user->supplier_id;
            
            if (!$supplierId) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => ['supplier_id' => ['El campo proveedor es requerido para usuarios con rol Proveedor']]
                ], 422);
            }
        }

        // Si cambia el rol a uno que NO es Proveedor, limpiar supplier_id
        if ($request->has('role_id') && $role && $role->name !== 'Proveedor') {
            $user->supplier_id = null;
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
        
        // Solo actualizar supplier_id si el rol es Proveedor
        if ($request->has('supplier_id') && $role && $role->name === 'Proveedor') {
            $user->supplier_id = $request->supplier_id;
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
            'user' => $user->load(['role', 'supplier'])
        ]);
    }

    public function destroy(string $id)
    {
        try {
            $user = User::findOrFail($id);
            
            // Validación 1: Prevenir que el usuario se elimine a sí mismo
            if ($user->id == auth()->id()) {
                return response()->json([
                    'message' => 'No puedes eliminar tu propio usuario'
                ], 403);
            }
            
            // Validación 2: No permitir eliminar al único administrador activo
            if ($user->role_id == 1 && $user->active) {
                $activeAdmins = User::where('role_id', 1)
                    ->where('active', true)
                    ->count();
                    
                if ($activeAdmins <= 1) {
                    return response()->json([
                        'message' => 'No se puede eliminar al único administrador activo del sistema'
                    ], 403);
                }
            }
            
            // Validación 3: Verificar si tiene datos relacionados
            $hasContainers = $user->containers()->count() > 0;
            $hasOrders = $user->createdOrders()->count() > 0;
            $hasContainerUpdates = $user->containerTrackingUpdates()->count() > 0;
            $hasOrderUpdates = $user->orderTrackingUpdates()->count() > 0;
            
            if ($hasContainers || $hasOrders || $hasContainerUpdates || $hasOrderUpdates) {
                return response()->json([
                    'message' => 'No se puede eliminar el usuario porque tiene registros asociados',
                    'details' => [
                        'containers' => $hasContainers ? $user->containers()->count() : 0,
                        'orders' => $hasOrders ? $user->createdOrders()->count() : 0,
                        'tracking_updates' => ($hasContainerUpdates ? $user->containerTrackingUpdates()->count() : 0) + 
                                             ($hasOrderUpdates ? $user->orderTrackingUpdates()->count() : 0)
                    ],
                    'suggestion' => 'Considera desactivar el usuario en lugar de eliminarlo usando el botón de estado'
                ], 409);
            }
            
            // Si pasa todas las validaciones, eliminar
            $userName = $user->name;
            $user->delete();
            
            return response()->json([
                'message' => "Usuario '{$userName}' eliminado exitosamente"
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error al eliminar usuario: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el usuario',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
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
                    'message' => 'No se puede desactivar al único administrador activo del sistema'
                ], 400);
            }
        }
        
        $user->active = !$user->active;
        $user->save();
        
        return response()->json([
            'message' => $user->active ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
            'user' => $user->load(['role', 'supplier'])
        ]);
    }

    public function getRoles()
    {
        $roles = Role::select('id', 'name', 'description')->get();
        return response()->json($roles);
    }

    public function resetPassword(Request $request, string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Actualizar contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();
        
        return response()->json([
            'message' => 'Contraseña actualizada exitosamente',
            'user' => $user->load(['role', 'supplier'])
        ]);
    }

    public function generateTempPassword(string $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        // Generar contraseña temporal de 8 caracteres (letras y números)
        $tempPassword = Str::upper(Str::random(4)) . rand(1000, 9999);
        
        // Actualizar contraseña en la base de datos
        $user->password = Hash::make($tempPassword);
        $user->save();
        
        return response()->json([
            'message' => 'Contraseña temporal generada exitosamente',
            'temporary_password' => $tempPassword,
            'user' => $user->name,
            'instructions' => 'Proporciona esta contraseña temporal al usuario. Se recomienda que la cambie en su próximo inicio de sesión.'
        ]);
    }

    public function changeOwnPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        
        // Verificar contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 400);
        }
        
        // Actualizar contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();
        
        return response()->json([
            'message' => 'Contraseña cambiada exitosamente'
        ]);
    }
}