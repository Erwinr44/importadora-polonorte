<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WarehouseController extends Controller
{

    public function index()
    {
        $warehouses = Warehouse::all();
        return response()->json($warehouses);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $warehouse = Warehouse::create($request->all());

        return response()->json([
            'message' => 'Bodega creada exitosamente',
            'warehouse' => $warehouse
        ], 201);
    }

    public function show(string $id)
    {
        $warehouse = Warehouse::find($id);
        
        if (!$warehouse) {
            return response()->json([
                'message' => 'Bodega no encontrada'
            ], 404);
        }
        
        return response()->json($warehouse);
    }

    public function update(Request $request, string $id)
    {
        $warehouse = Warehouse::find($id);
        
        if (!$warehouse) {
            return response()->json([
                'message' => 'Bodega no encontrada'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $warehouse->update($request->all());

        return response()->json([
            'message' => 'Bodega actualizada exitosamente',
            'warehouse' => $warehouse
        ]);
    }


    public function destroy(string $id)
    {
        $warehouse = Warehouse::find($id);
        
        if (!$warehouse) {
            return response()->json([
                'message' => 'Bodega no encontrada'
            ], 404);
        }
        
        // Verificar si la bodega tiene inventario
        $hasInventory = $warehouse->inventory()->exists();
        
        if ($hasInventory) {
            return response()->json([
                'message' => 'No se puede eliminar la bodega porque contiene productos en inventario.'
            ], 400);
        }
        
        $warehouse->delete();
        
        return response()->json([
            'message' => 'Bodega eliminada exitosamente'
        ]);
    }
}