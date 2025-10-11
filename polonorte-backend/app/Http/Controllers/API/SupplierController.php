<?php

// Crear: app/Http/Controllers/API/SupplierController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::withCount(['users', 'containers'])->get();
        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'required|email|unique:suppliers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $supplier = Supplier::create($request->all());

        return response()->json([
            'message' => 'Proveedor creado exitosamente',
            'supplier' => $supplier
        ], 201);
    }

    public function show(string $id)
    {
        $supplier = Supplier::with(['users', 'containers'])->find($id);
        
        if (!$supplier) {
            return response()->json([
                'message' => 'Proveedor no encontrado'
            ], 404);
        }
        
        return response()->json($supplier);
    }

    public function update(Request $request, string $id)
    {
        $supplier = Supplier::find($id);
        
        if (!$supplier) {
            return response()->json([
                'message' => 'Proveedor no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'company_name' => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'sometimes|required|email|unique:suppliers,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $supplier->update($request->all());

        return response()->json([
            'message' => 'Proveedor actualizado exitosamente',
            'supplier' => $supplier
        ]);
    }

    public function destroy(string $id)
    {
        $supplier = Supplier::find($id);
        
        if (!$supplier) {
            return response()->json([
                'message' => 'Proveedor no encontrado'
            ], 404);
        }
        
        // Verificar si tiene usuarios asignados
        if ($supplier->users()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el proveedor porque tiene usuarios asignados'
            ], 400);
        }
        
        // Verificar si tiene contenedores
        if ($supplier->containers()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el proveedor porque tiene contenedores registrados'
            ], 400);
        }
        
        $companyName = $supplier->company_name;
        $supplier->delete();
        
        return response()->json([
            'message' => "Proveedor '{$companyName}' eliminado exitosamente"
        ]);
    }

    public function toggleStatus(string $id)
    {
        $supplier = Supplier::find($id);
        
        if (!$supplier) {
            return response()->json([
                'message' => 'Proveedor no encontrado'
            ], 404);
        }
        
        $supplier->active = !$supplier->active;
        $supplier->save();
        
        return response()->json([
            'message' => $supplier->active ? 'Proveedor activado exitosamente' : 'Proveedor desactivado exitosamente',
            'supplier' => $supplier
        ]);
    }
}