<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Display a listing of the products.
     */
    public function index()
    {
        $products = Product::with(['inventory.warehouse'])->get();
        
        // Transformar los datos para incluir el stock total y por bodega
        $products = $products->map(function ($product) {
            $totalStock = $product->inventory->sum('quantity');
            $stockByWarehouse = $product->inventory->mapWithKeys(function ($item) {
                return [$item->warehouse->name => $item->quantity];
            });
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'description' => $product->description,
                'category' => $product->category,
                'price' => $product->price,
                'min_stock' => $product->min_stock,
                'active' => $product->active,
                'total_stock' => $totalStock,
                'stock_by_warehouse' => $stockByWarehouse,
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at,
            ];
        });
        
        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:products',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::create($request->all());

        return response()->json([
            'message' => 'Producto creado exitosamente',
            'product' => $product
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(string $id)
    {
        $product = Product::with(['inventory.warehouse'])->find($id);
        
        if (!$product) {
            return response()->json([
                'message' => 'Producto no encontrado'
            ], 404);
        }
        
        // Transformar los datos para incluir el stock total y por bodega
        $totalStock = $product->inventory->sum('quantity');
        $stockByWarehouse = $product->inventory->mapWithKeys(function ($item) {
            return [$item->warehouse->name => $item->quantity];
        });
        
        $productData = [
            'id' => $product->id,
            'name' => $product->name,
            'code' => $product->code,
            'description' => $product->description,
            'category' => $product->category,
            'price' => $product->price,
            'min_stock' => $product->min_stock,
            'active' => $product->active,
            'total_stock' => $totalStock,
            'stock_by_warehouse' => $stockByWarehouse,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
        
        return response()->json($productData);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'message' => 'Producto no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:products,code,' . $id,
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'min_stock' => 'sometimes|required|integer|min:0',
            'active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $product->update($request->all());

        return response()->json([
            'message' => 'Producto actualizado exitosamente',
            'product' => $product
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(string $id)
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json([
                'message' => 'Producto no encontrado'
            ], 404);
        }
        
        // Verificar si el producto tiene inventario
        $hasInventory = $product->inventory()->sum('quantity') > 0;
        
        if ($hasInventory) {
            return response()->json([
                'message' => 'No se puede eliminar el producto porque tiene existencias en inventario.'
            ], 400);
        }
        
        // Verificar si el producto está en alguna orden
        $hasOrders = $product->orders()->exists();
        
        if ($hasOrders) {
            return response()->json([
                'message' => 'No se puede eliminar el producto porque está asociado a pedidos.'
            ], 400);
        }
        
        $product->delete();
        
        return response()->json([
            'message' => 'Producto eliminado exitosamente'
        ]);
    }
}