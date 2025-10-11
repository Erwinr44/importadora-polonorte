<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Container;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function salesReport(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth());
        $dateTo = $request->input('date_to', now());

        // Total de ventas
        $totalSales = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->sum('total_amount');

        // Total de pedidos
        $totalOrders = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->count();

        // Ticket promedio
        $averageTicket = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        // Ventas por día
        $salesByDay = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Top 10 productos más vendidos
        $topProducts = DB::table('order_details')
            ->join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('products', 'order_details.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$dateFrom, $dateTo])
            ->select(
                'products.name',
                'products.code',
                DB::raw('SUM(order_details.quantity) as total_quantity'),
                DB::raw('SUM(order_details.subtotal) as total_sales')
            )
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderBy('total_sales', 'desc')
            ->limit(10)
            ->get();

        // Ventas por estado
        $salesByStatus = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select(
                'status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total')
            )
            ->groupBy('status')
            ->get();

        return response()->json([
            'summary' => [
                'total_sales' => $totalSales,
                'total_orders' => $totalOrders,
                'average_ticket' => $averageTicket,
            ],
            'sales_by_day' => $salesByDay,
            'top_products' => $topProducts,
            'sales_by_status' => $salesByStatus,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ]
        ]);
    }

    public function containersReport(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth());
        $dateTo = $request->input('date_to', now());

        // Total de furgones
        $totalContainers = Container::whereBetween('created_at', [$dateFrom, $dateTo])
            ->count();

        // Furgones por estado
        $containersByStatus = Container::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // Furgones por proveedor
        $containersBySupplier = Container::with('supplier')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->select('supplier_id', DB::raw('COUNT(*) as count'))
            ->groupBy('supplier_id')
            ->get()
            ->map(function ($item) {
                return [
                    'supplier_name' => $item->supplier->name ?? 'N/A',
                    'count' => $item->count
                ];
            });

        // Furgones por país de origen
        $containersByCountry = Container::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select('origin_country', DB::raw('COUNT(*) as count'))
            ->groupBy('origin_country')
            ->orderBy('count', 'desc')
            ->get();

        // Tiempo promedio de tránsito (solo furgones recibidos)
        $avgTransitTime = Container::whereBetween('created_at', [$dateFrom, $dateTo])
            ->where('status', 'Recibido')
            ->whereNotNull('departure_date')
            ->whereNotNull('actual_arrival_date')
            ->select(DB::raw('AVG(DATEDIFF(actual_arrival_date, departure_date)) as avg_days'))
            ->first();

        return response()->json([
            'summary' => [
                'total_containers' => $totalContainers,
                'avg_transit_days' => $avgTransitTime->avg_days ?? 0,
            ],
            'by_status' => $containersByStatus,
            'by_supplier' => $containersBySupplier,
            'by_country' => $containersByCountry,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ]
        ]);
    }

    public function inventoryReport(Request $request)
    {
        // Stock actual por bodega
        $stockByWarehouse = Inventory::with(['warehouse', 'product'])
            ->select('warehouse_id', DB::raw('COUNT(DISTINCT product_id) as products'), DB::raw('SUM(quantity) as total_quantity'))
            ->groupBy('warehouse_id')
            ->get();

        // Productos con stock bajo
        $lowStockProducts = Product::with('inventory.warehouse')
            ->get()
            ->filter(function ($product) {
                $totalStock = $product->inventory->sum('quantity');
                return $totalStock < $product->min_stock;
            })
            ->map(function ($product) {
                $totalStock = $product->inventory->sum('quantity');
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'current_stock' => $totalStock,
                    'min_stock' => $product->min_stock,
                    'difference' => $totalStock - $product->min_stock,
                ];
            })
            ->values();

        // Valor total del inventario
        $totalInventoryValue = Product::with('inventory')
            ->get()
            ->sum(function ($product) {
                $totalStock = $product->inventory->sum('quantity');
                return $totalStock * $product->price;
            });

        // Top 10 productos con más stock
        $topStockProducts = Product::with('inventory')
            ->get()
            ->map(function ($product) {
                return [
                    'name' => $product->name,
                    'code' => $product->code,
                    'total_stock' => $product->inventory->sum('quantity'),
                    'value' => $product->inventory->sum('quantity') * $product->price,
                ];
            })
            ->sortByDesc('total_stock')
            ->take(10)
            ->values();

        return response()->json([
            'summary' => [
                'total_products' => Product::count(),
                'total_warehouses' => DB::table('warehouses')->count(),
                'total_inventory_value' => $totalInventoryValue,
                'low_stock_count' => $lowStockProducts->count(),
            ],
            'stock_by_warehouse' => $stockByWarehouse,
            'low_stock_products' => $lowStockProducts,
            'top_stock_products' => $topStockProducts,
        ]);
    }

    public function customersReport(Request $request)
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth());
        $dateTo = $request->input('date_to', now());

        // Total de clientes únicos
        $totalCustomers = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->distinct('customer_phone')
            ->count('customer_phone');

        // Top 10 clientes por monto
        $topCustomers = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select(
                'customer_name',
                'customer_phone',
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_spent'),
                DB::raw('AVG(total_amount) as avg_ticket')
            )
            ->groupBy('customer_phone', 'customer_name')
            ->orderBy('total_spent', 'desc')
            ->limit(10)
            ->get();

        // Clientes más frecuentes
        $frequentCustomers = Order::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select(
                'customer_name',
                'customer_phone',
                DB::raw('COUNT(*) as total_orders')
            )
            ->groupBy('customer_phone', 'customer_name')
            ->orderBy('total_orders', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'total_customers' => $totalCustomers,
            ],
            'top_customers' => $topCustomers,
            'frequent_customers' => $frequentCustomers,
            'period' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ]
        ]);
    }


    public function exportSalesPDF(Request $request)
    {
        $data = $this->salesReport($request)->getData();
        
        $pdf = Pdf::loadView('reports.sales', ['data' => $data]);
        
        return $pdf->download('reporte-ventas-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportContainersPDF(Request $request)
    {
        $data = $this->containersReport($request)->getData();
        
        $pdf = Pdf::loadView('reports.containers', ['data' => $data]);
        
        return $pdf->download('reporte-furgones-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportInventoryPDF(Request $request)
    {
        $data = $this->inventoryReport($request)->getData();
        
        $pdf = Pdf::loadView('reports.inventory', ['data' => $data]);
        
        return $pdf->download('reporte-inventario-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportCustomersPDF(Request $request)
    {
        $data = $this->customersReport($request)->getData();
        
        $pdf = Pdf::loadView('reports.customers', ['data' => $data]);
        
        return $pdf->download('reporte-clientes-' . now()->format('Y-m-d') . '.pdf');
    }
}