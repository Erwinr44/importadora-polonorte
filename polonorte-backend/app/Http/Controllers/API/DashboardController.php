<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Container;
use App\Models\Order;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $user = $request->user();
        $isProvider = $user->role === 'Proveedor';
        
        $stats = [];
        
        if ($isProvider) {
            // Para proveedores, solo datos de contenedores
            $containers = Container::where('supplier_id', $user->id)
                ->select('id', 'tracking_code', 'status', 'origin_country', 'created_at', 'expected_arrival_date')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            $stats = [
                'activeContainers' => $containers->where('status', '!=', 'Recibido')->count(),
                'recentContainers' => $containers,
                'totalProducts' => 0,
                'pendingOrders' => 0,
                'warehouses' => 0,
            ];
        } else {

            $totalProducts = Product::where('active', true)->count();
            
            // Contenedores activos y recientes
            $containers = Container::select('id', 'tracking_code', 'status', 'origin_country', 'created_at', 'expected_arrival_date', 'supplier_id')
                ->with('supplier:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();
            
            $activeContainers = Container::where('status', '!=', 'Recibido')->count();
            
            // Pedidos pendientes y recientes
            $orders = Order::select('id', 'tracking_code', 'customer_name', 'status', 'created_at', 'total_amount', 'created_by')
                ->with('createdBy:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();
            
            $pendingOrders = Order::whereNotIn('status', ['Entregado', 'Cancelado'])->count();
            
            // Contar bodegas activas
            $warehouses = Warehouse::where('active', true)->count();
            
            $stats = [
                'totalProducts' => $totalProducts,
                'activeContainers' => $activeContainers,
                'pendingOrders' => $pendingOrders,
                'warehouses' => $warehouses,
                'recentContainers' => $containers,
                'recentOrders' => $orders,
            ];
        }
        
        return response()->json($stats);
    }
    

    public function getLowStockProducts()
    {
        $products = Product::select('id', 'name', 'code', 'min_stock', 'unit_type')
            ->with(['inventory' => function ($query) {
                $query->select('product_id', 'warehouse_id', 'quantity')
                      ->with('warehouse:id,name');
            }])
            ->where('active', true)
            ->get()
            ->map(function ($product) {
                $totalStock = $product->inventory->sum('quantity');
                return [
                    'product' => $product,
                    'totalStock' => $totalStock,
                ];
            })
            ->filter(function ($item) {
                return $item['totalStock'] < $item['product']->min_stock && $item['totalStock'] > 0;
            })
            ->take(10)
            ->map(function ($item) {
                return [
                    'id' => $item['product']->id,
                    'name' => $item['product']->name,
                    'code' => $item['product']->code,
                    'total_stock' => $item['totalStock'],
                    'min_stock' => $item['product']->min_stock,
                    'unit_type' => $item['product']->unit_type,
                ];
            })
            ->values();
        
        return response()->json($products);
    }
}