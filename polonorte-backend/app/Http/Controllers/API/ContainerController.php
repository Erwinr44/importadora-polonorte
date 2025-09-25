<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Container;
use App\Models\ContainerTracking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ContainerController extends Controller
{

    public function index(Request $request)
    {
        // Si el usuario es proveedor, mostrar solo sus furgones
        if ($request->user()->role->name === 'Proveedor') {
            $containers = Container::with(['trackingHistory', 'supplier'])
                ->where('supplier_id', $request->user()->id)
                ->get();
        } else {
            // Para admin y operador, mostrar todos
            $containers = Container::with(['trackingHistory', 'supplier'])->get();
        }
        
        return response()->json($containers);
    }

    public function store(Request $request)
    {
        // Si el usuario es proveedor, asignar automáticamente su ID como supplier_id
        if ($request->user()->role->name === 'Proveedor') {
            $request->merge(['supplier_id' => $request->user()->id]);
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:users,id',
            'origin_country' => 'required|string|max:100',
            'content_description' => 'nullable|string',
            'departure_date' => 'nullable|date',
            'expected_arrival_date' => 'nullable|date|after_or_equal:departure_date',
            'status' => 'required|string|max:50',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar que el proveedor tiene el rol correcto
        $supplier = User::find($request->supplier_id);
        if (!$supplier || $supplier->role->name !== 'Proveedor') {
            return response()->json([
                'message' => 'El usuario seleccionado no es un proveedor válido',
                'errors' => ['supplier_id' => ['Usuario no válido como proveedor']]
            ], 422);
        }

        // Generar un código de seguimiento único
        $trackingCode = 'CONT-' . strtoupper(Str::random(8));
        
        $container = Container::create([
            'tracking_code' => $trackingCode,
            'supplier_id' => $request->supplier_id,
            'origin_country' => $request->origin_country,
            'content_description' => $request->content_description,
            'departure_date' => $request->departure_date,
            'expected_arrival_date' => $request->expected_arrival_date,
            'status' => $request->status,
        ]);
        
        // Crear el primer registro en el historial de seguimiento
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => $request->status,
            'location' => $request->location ?? $request->origin_country,
            'notes' => 'Registro inicial del furgón',
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Furgón registrado exitosamente',
            'container' => $container->load(['supplier', 'trackingHistory.updatedBy']),
            'tracking_code' => $trackingCode
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $container = Container::with(['trackingHistory.updatedBy', 'supplier'])->find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Furgón no encontrado'
            ], 404);
        }
        
        // Verificar permisos (si es proveedor, solo puede ver sus propios furgones)
        if ($request->user()->role->name === 'Proveedor' && $container->supplier_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tiene permiso para ver este furgón'
            ], 403);
        }
        
        return response()->json($container);
    }

    public function update(Request $request, string $id)
    {
        $container = Container::find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Furgón no encontrado'
            ], 404);
        }
        
        // Verificar permisos (solo Admin y Operador pueden editar)
        if (!in_array($request->user()->role->name, ['Admin', 'Operador'])) {
            return response()->json([
                'message' => 'No tiene permiso para editar este furgón'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'sometimes|required|exists:users,id',
            'origin_country' => 'sometimes|required|string|max:100',
            'content_description' => 'nullable|string',
            'departure_date' => 'nullable|date',
            'expected_arrival_date' => 'nullable|date|after_or_equal:departure_date',
            'status' => 'sometimes|required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Si se cambia el proveedor, verificar que tenga el rol correcto
        if ($request->has('supplier_id') && $request->supplier_id != $container->supplier_id) {
            $supplier = User::find($request->supplier_id);
            if (!$supplier || $supplier->role->name !== 'Proveedor') {
                return response()->json([
                    'message' => 'El usuario seleccionado no es un proveedor válido',
                    'errors' => ['supplier_id' => ['Usuario no válido como proveedor']]
                ], 422);
            }
        }
        
        // Actualizar los campos proporcionados
        $container->fill($request->only([
            'supplier_id', 
            'origin_country', 
            'content_description', 
            'departure_date', 
            'expected_arrival_date', 
            'status'
        ]));
        
        // Guardar cambios
        $container->save();
        
        // Si cambió el status, registrar en el tracking
        if ($request->has('status') && $request->status !== $container->getOriginal('status')) {
            ContainerTracking::create([
                'container_id' => $container->id,
                'status' => $request->status,
                'location' => $request->location ?? $container->trackingHistory()->latest()->first()->location ?? '',
                'notes' => $request->notes ?? 'Actualización de estado',
                'updated_by' => $request->user()->id,
            ]);
        }

        return response()->json([
            'message' => 'Furgón actualizado exitosamente',
            'container' => $container->fresh(['supplier', 'trackingHistory.updatedBy'])
        ]);
    }


    public function updateStatus(Request $request, string $id)
    {
        $container = Container::find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Furgón no encontrado'
            ], 404);
        }
        

        if ($request->user()->role->name === 'Proveedor' && $container->supplier_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tiene permiso para actualizar este furgón'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|max:50',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Actualizar el estado del furgón
        $container->status = $request->status;
        
        if ($request->status === 'Recibido' && !$container->actual_arrival_date) {
            $container->actual_arrival_date = now();
        }
        
        $container->save();
        
        // Crear nuevo registro en el historial de seguimiento
        $tracking = ContainerTracking::create([
            'container_id' => $container->id,
            'status' => $request->status,
            'location' => $request->location,
            'notes' => $request->notes,
            'updated_by' => $request->user()->id,
        ]);


        return response()->json([
            'message' => 'Estado del furgón actualizado exitosamente',
            'container' => $container->fresh(['supplier', 'trackingHistory.updatedBy']),
            'tracking' => $tracking->load('updatedBy')
        ]);
    }


    public function trackByCode(string $trackingCode)
    {
        $container = Container::with(['trackingHistory.updatedBy', 'supplier'])
            ->where('tracking_code', $trackingCode)
            ->first();
        
        if (!$container) {
            return response()->json([
                'message' => 'Furgón no encontrado'
            ], 404);
        }
        
        // Formatear la respuesta para mostrar solo información relevante
        $trackingData = [
            'tracking_code' => $container->tracking_code,
            'origin_country' => $container->origin_country,
            'departure_date' => $container->departure_date,
            'expected_arrival_date' => $container->expected_arrival_date,
            'actual_arrival_date' => $container->actual_arrival_date,
            'current_status' => $container->status,
            'tracking_history' => $container->trackingHistory->map(function ($track) {
                return [
                    'date' => $track->created_at->format('Y-m-d H:i:s'),
                    'status' => $track->status,
                    'location' => $track->location,
                    'notes' => $track->notes,
                    'updated_by' => $track->updatedBy->name,
                ];
            }),
        ];
        
        return response()->json($trackingData);
    }

    public function getSuppliers()
    {
        $roleId = \App\Models\Role::where('name', 'Proveedor')->first()->id;
        $suppliers = User::where('role_id', $roleId)
            ->where('active', true)
            ->select('id', 'name', 'email')
            ->get();
            
        return response()->json($suppliers);
    }
}