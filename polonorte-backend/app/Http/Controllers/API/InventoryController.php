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

    public function getLowStockProducts()
    {
        // Subconsulta para obtener el stock total por producto
        $productsWithTotalStock = DB::table('products')
            ->leftJoin('inventory', 'products.id', '=', 'inventory.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.code',
                'products.min_stock',
                'products.category',
                DB::raw('COALESCE(SUM(inventory.quantity), 0) as total_stock')
            )
            ->where('products.active', true)
            ->groupBy('products.id', 'products.name', 'products.code', 'products.min_stock', 'products.category');
        
        // Filtrar productos donde el stock total es menor al mínimo
        $lowStockProducts = DB::table(DB::raw("({$productsWithTotalStock->toSql()}) as products_stock"))
            ->mergeBindings($productsWithTotalStock)
            ->whereRaw('products_stock.total_stock < products_stock.min_stock')
            ->orderBy('products_stock.total_stock', 'asc')
            ->get();

        // Si no hay productos con stock bajo, retornar array vacío
        if ($lowStockProducts->isEmpty()) {
            return response()->json([
                'message' => 'No hay productos con stock bajo actualmente',
                'products' => []
            ]);
        }

        // Obtener detalles de inventario por bodega para cada producto con stock bajo
        $productsWithDetails = [];
        
        foreach ($lowStockProducts as $product) {
            $inventoryDetails = Inventory::where('product_id', $product->id)
                ->with('warehouse')
                ->get()
                ->map(function ($inventory) {
                    return [
                        'warehouse_name' => $inventory->warehouse->name,
                        'warehouse_location' => $inventory->warehouse->location,
                        'quantity' => $inventory->quantity
                    ];
                });

            $productsWithDetails[] = [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'category' => $product->category,
                'min_stock' => $product->min_stock,
                'total_stock' => $product->total_stock,
                'deficit' => $product->min_stock - $product->total_stock, // Cuánto falta para llegar al mínimo
                'inventory_by_warehouse' => $inventoryDetails,
                'alert_level' => $this->getAlertLevel($product->total_stock, $product->min_stock)
            ];
        }

        return response()->json([
            'message' => 'Productos con stock bajo encontrados',
            'count' => count($productsWithDetails),
            'products' => $productsWithDetails
        ]);
    }

    /**
     * 🔧 MÉTODO AUXILIAR: Determinar nivel de alerta basado en stock
     */
    private function getAlertLevel($currentStock, $minStock)
    {
        $percentage = ($currentStock / $minStock) * 100;
        
        if ($currentStock == 0) {
            return 'critical'; // Sin stock
        } elseif ($percentage <= 25) {
            return 'high'; // Stock muy bajo (≤25% del mínimo)
        } elseif ($percentage <= 50) {
            return 'medium'; // Stock bajo (≤50% del mínimo)
        } else {
            return 'low'; // Stock ligeramente bajo
        }
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

            // Verificar si el stock está bajo el mínimo
            $product = Product::find($request->product_id);
            $totalStock = Inventory::where('product_id', $request->product_id)->sum('quantity');

            if ($totalStock < $product->min_stock) {
                event(new \App\Events\LowStockDetected($product, $totalStock));
            }

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