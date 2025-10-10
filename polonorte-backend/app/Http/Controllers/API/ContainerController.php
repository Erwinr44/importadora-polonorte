<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Container;
use App\Models\ContainerTracking;
use App\Models\User;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ContainerController extends Controller
{
    public function index(Request $request)
    {
        // Si el usuario es proveedor, mostrar solo contenedores de SU proveedor asignado
        if ($request->user()->role->name === 'Proveedor') {
            if (!$request->user()->supplier_id) {
                return response()->json([
                    'message' => 'Usuario proveedor no tiene proveedor asignado. Contacte al administrador.'
                ], 400);
            }
            
            $containers = Container::with(['trackingHistory', 'supplier', 'createdBy'])
                ->where('supplier_id', $request->user()->supplier_id)
                ->get();
        } else {
            // Para admin y operador, mostrar todos
            $containers = Container::with(['trackingHistory', 'supplier', 'createdBy'])->get();
        }
        
        return response()->json($containers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
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

        // Si el usuario es proveedor, verificar que solo puede crear para SU proveedor
        if ($request->user()->role->name === 'Proveedor') {
            if (!$request->user()->supplier_id) {
                return response()->json([
                    'message' => 'Usuario proveedor no tiene proveedor asignado. Contacte al administrador.'
                ], 400);
            }
            
            if ($request->supplier_id != $request->user()->supplier_id) {
                return response()->json([
                    'message' => 'No tienes permisos para crear contenedores para este proveedor.'
                ], 403);
            }
        }

        // Verificar que el proveedor existe y está activo
        $supplier = Supplier::find($request->supplier_id);
        if (!$supplier || !$supplier->active) {
            return response()->json([
                'message' => 'El proveedor seleccionado no está disponible',
                'errors' => ['supplier_id' => ['Proveedor no válido o inactivo']]
            ], 422);
        }

        // Generar un código de seguimiento único
        $trackingCode = 'CONT-' . strtoupper(Str::random(8));
        
        // Verificar que el código sea único
        while (Container::where('tracking_code', $trackingCode)->exists()) {
            $trackingCode = 'CONT-' . strtoupper(Str::random(8));
        }

        $container = Container::create([
            'tracking_code' => $trackingCode,
            'supplier_id' => $request->supplier_id,
            'created_by' => $request->user()->id,
            'origin_country' => $request->origin_country,
            'content_description' => $request->content_description,
            'departure_date' => $request->departure_date,
            'expected_arrival_date' => $request->expected_arrival_date,
            'status' => $request->status,
            'location' => $request->location,
        ]);

        // Crear primer registro de seguimiento
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => $request->status,
            'location' => $request->location,
            'notes' => 'Contenedor registrado en el sistema',
            'updated_by' => $request->user()->id,
        ]);

        // Disparar evento de contenedor registrado
        event(new \App\Events\ContainerRegistered($container));

        return response()->json([
            'message' => 'Furgón registrado exitosamente',
            'container' => $container
        ], 201);

        return response()->json([
            'message' => 'Contenedor creado exitosamente',
            'container' => $container->load(['supplier', 'createdBy']),
            'tracking_code' => $trackingCode
        ], 201);
    }

    public function show(string $id)
    {
        $container = Container::with(['trackingHistory.updatedBy', 'supplier', 'createdBy'])->find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Contenedor no encontrado'
            ], 404);
        }
        
        return response()->json($container);
    }

    public function update(Request $request, string $id)
    {
        $container = Container::find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Contenedor no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'origin_country' => 'sometimes|required|string|max:100',
            'content_description' => 'nullable|string',
            'departure_date' => 'nullable|date',
            'expected_arrival_date' => 'nullable|date|after_or_equal:departure_date',
            'status' => 'sometimes|required|string|max:50',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar permisos si cambia proveedor
        if ($request->has('supplier_id') && $request->supplier_id != $container->supplier_id) {
            $supplier = Supplier::find($request->supplier_id);
            if (!$supplier || !$supplier->active) {
                return response()->json([
                    'message' => 'El proveedor seleccionado no está disponible'
                ], 422);
            }
        }

        $container->update($request->all());

        return response()->json([
            'message' => 'Contenedor actualizado exitosamente',
            'container' => $container->load(['supplier', 'createdBy'])
        ]);
    }

    public function updateStatus(Request $request, string $id)
    {
        $container = Container::find($id);
        
        if (!$container) {
            return response()->json([
                'message' => 'Contenedor no encontrado'
            ], 404);
        }

        // Si es proveedor, verificar que puede actualizar ESTE contenedor
        if ($request->user()->role->name === 'Proveedor') {
            if (!$request->user()->supplier_id || $container->supplier_id != $request->user()->supplier_id) {
                return response()->json([
                    'message' => 'No tienes permisos para actualizar este contenedor.'
                ], 403);
            }
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
        
       $container->status = $request->status;
        if ($request->has('location')) {
            $container->location = $request->location;
        }
        $container->save();

        // Si el furgón llegó a destino, disparar evento
        if ($request->status === 'Recibido') {
            event(new \App\Events\ContainerArrived($container));
        }

        // Crear tracking
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => $request->status,
            'location' => $request->location ?? '',
            'notes' => $request->notes ?? '',
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Estado del contenedor actualizado exitosamente',
            'container' => $container->load(['supplier', 'createdBy']),
            'tracking' => $tracking
        ]);
    }

    public function trackByCode(string $trackingCode)
    {
        $container = Container::with(['trackingHistory', 'supplier'])->where('tracking_code', $trackingCode)->first();
        
        if (!$container) {
            return response()->json([
                'message' => 'Contenedor no encontrado'
            ], 404);
        }
        
        // Formatear la respuesta para mostrar solo información relevante
        $trackingData = [
            'tracking_code' => $container->tracking_code,
            'supplier' => $container->supplier->company_name,
            'origin_country' => $container->origin_country,
            'current_status' => $container->status,
            'current_location' => $container->location,
            'departure_date' => $container->departure_date,
            'expected_arrival_date' => $container->expected_arrival_date,
            'tracking_history' => $container->trackingHistory->map(function ($track) {
                return [
                    'date' => $track->created_at->format('Y-m-d H:i:s'),
                    'status' => $track->status,
                    'location' => $track->location,
                    'notes' => $track->notes,
                ];
            }),
        ];
        
        return response()->json($trackingData);
    }

    /**
     * Get suppliers for container creation (Admin and Operador only)
     */
    public function getSuppliers()
    {
        $suppliers = Supplier::where('active', true)
            ->select('id', 'company_name', 'contact_person', 'country')
            ->get();
            
        return response()->json($suppliers);
    }
}