<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Unidades de medida permitidas
     */
    private $allowedUnitTypes = [
        'unidad',
        'caja',
        'paca',
        'paquete',
        'bulto',
        'saco',
        'barril',
        'lote'
    ];

    private $allowedWeightUnits = [
        'libras',
        'kilogramos',
        'gramos',
        'onzas',
        'toneladas'
    ];

    /**
     * Obtener las unidades de medida disponibles
     */
    public function getUnitTypes()
    {
        return response()->json([
            'unit_types' => $this->allowedUnitTypes,
            'weight_units' => $this->allowedWeightUnits
        ]);
    }

    /**
     * Display a listing of the products.
     */
    public function index()
    {
        $products = Product::with(['inventory.warehouse'])->get();
        
        $products = $products->map(function ($product) {
            $totalStock = $product->inventory->sum('quantity');
            $stockByWarehouse = $product->inventory->mapWithKeys(function ($item) {
                return [$item->warehouse->name => $item->quantity];
            });
            
            // Calcular peso total si aplica
            $totalWeight = null;
            if ($product->unit_weight && $product->weight_unit) {
                $totalWeight = $product->calculateTotalWeight($totalStock);
            }
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'description' => $product->description,
                'category' => $product->category,
                'price' => $product->price,
                'unit_type' => $product->unit_type,
                'unit_weight' => $product->unit_weight,
                'weight_unit' => $product->weight_unit,
                'unit_description' => $product->unit_description,
                'min_stock' => $product->min_stock,
                'active' => $product->active,
                'total_stock' => $totalStock,
                'total_weight' => $totalWeight,
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
            'unit_type' => ['required', 'string', Rule::in($this->allowedUnitTypes)],
            'unit_weight' => 'nullable|numeric|min:0',
            'weight_unit' => [
                'nullable',
                'string',
                Rule::in($this->allowedWeightUnits),
                'required_with:unit_weight'
            ],
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
        
        $totalStock = $product->inventory->sum('quantity');
        $stockByWarehouse = $product->inventory->mapWithKeys(function ($item) {
            return [$item->warehouse->name => $item->quantity];
        });
        
        // Calcular peso total si aplica
        $totalWeight = null;
        if ($product->unit_weight && $product->weight_unit) {
            $totalWeight = $product->calculateTotalWeight($totalStock);
        }
        
        $productData = [
            'id' => $product->id,
            'name' => $product->name,
            'code' => $product->code,
            'description' => $product->description,
            'category' => $product->category,
            'price' => $product->price,
            'unit_type' => $product->unit_type,
            'unit_weight' => $product->unit_weight,
            'weight_unit' => $product->weight_unit,
            'unit_description' => $product->unit_description,
            'min_stock' => $product->min_stock,
            'active' => $product->active,
            'total_stock' => $totalStock,
            'total_weight' => $totalWeight,
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
            'unit_type' => ['sometimes', 'required', 'string', Rule::in($this->allowedUnitTypes)],
            'unit_weight' => 'nullable|numeric|min:0',
            'weight_unit' => [
                'nullable',
                'string',
                Rule::in($this->allowedWeightUnits),
                'required_with:unit_weight'
            ],
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
        if ($product->inventory()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el producto porque tiene inventario asociado'
            ], 400);
        }
        
        $product->delete();
        
        return response()->json([
            'message' => 'Producto eliminado exitosamente'
        ]);
    }
}