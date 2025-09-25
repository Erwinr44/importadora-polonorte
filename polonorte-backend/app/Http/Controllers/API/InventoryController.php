<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{

    public function index()
    {
        $inventory = Inventory::with(['product', 'warehouse'])->get();
        
        return response()->json($inventory);
    }

    public function getProductInventory(string $productId)
    {
        $product = Product::find($productId);
        
        if (!$product) {
            return response()->json([
                'message' => 'Producto no encontrado'
            ], 404);
        }
        
        $inventory = Inventory::where('product_id', $productId)
            ->with('warehouse')
            ->get();
        
        return response()->json($inventory);
    }

    public function getWarehouseInventory(string $warehouseId)
    {
        $warehouse = Warehouse::find($warehouseId);
        
        if (!$warehouse) {
            return response()->json([
                'message' => 'Bodega no encontrada'
            ], 404);
        }
        
        $inventory = Inventory::where('warehouse_id', $warehouseId)
            ->with('product')
            ->get();
        
        return response()->json($inventory);
    }

 
    public function updateQuantity(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|integer',
            'operation' => 'required|in:add,subtract,set',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Iniciar transacción para asegurar consistencia
        DB::beginTransaction();
        
        try {
            $inventory = Inventory::where('product_id', $request->product_id)
                ->where('warehouse_id', $request->warehouse_id)
                ->first();
            
            // Si no existe el registro en inventario, crearlo
            if (!$inventory && ($request->operation == 'add' || $request->operation == 'set')) {
                $inventory = new Inventory([
                    'product_id' => $request->product_id,
                    'warehouse_id' => $request->warehouse_id,
                    'quantity' => 0,
                ]);
            } elseif (!$inventory) {
                throw new \Exception('No existe inventario para este producto en la bodega especificada.');
            }
            
            // Realizar la operación correspondiente
            switch ($request->operation) {
                case 'add':
                    $inventory->quantity += $request->quantity;
                    break;
                case 'subtract':
                    if ($inventory->quantity < $request->quantity) {
                        throw new \Exception('No hay suficiente stock para realizar esta operación.');
                    }
                    $inventory->quantity -= $request->quantity;
                    break;
                case 'set':
                    $inventory->quantity = $request->quantity;
                    break;
            }
            
            $inventory->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Inventario actualizado exitosamente',
                'inventory' => $inventory,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Error al actualizar el inventario',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function transferInventory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Iniciar transacción para asegurar consistencia
        DB::beginTransaction();
        
        try {
            // Verificar inventario en bodega de origen
            $sourceInventory = Inventory::where('product_id', $request->product_id)
                ->where('warehouse_id', $request->from_warehouse_id)
                ->first();
            
            if (!$sourceInventory || $sourceInventory->quantity < $request->quantity) {
                throw new \Exception('No hay suficiente stock en la bodega de origen para realizar esta transferencia.');
            }
            
            // Reducir cantidad en bodega de origen
            $sourceInventory->quantity -= $request->quantity;
            $sourceInventory->save();
            
            // Buscar o crear inventario en bodega destino
            $destinationInventory = Inventory::where('product_id', $request->product_id)
                ->where('warehouse_id', $request->to_warehouse_id)
                ->first();
            
            if (!$destinationInventory) {
                $destinationInventory = new Inventory([
                    'product_id' => $request->product_id,
                    'warehouse_id' => $request->to_warehouse_id,
                    'quantity' => 0,
                ]);
            }
            
            // Aumentar cantidad en bodega destino
            $destinationInventory->quantity += $request->quantity;
            $destinationInventory->save();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Transferencia de inventario realizada exitosamente',
                'source_inventory' => $sourceInventory,
                'destination_inventory' => $destinationInventory,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Error al realizar la transferencia de inventario',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}