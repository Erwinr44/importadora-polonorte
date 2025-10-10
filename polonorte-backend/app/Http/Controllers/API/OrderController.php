<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Display a listing of orders.
     */
    public function index()
    {
        $orders = Order::with(['trackingHistory', 'createdBy', 'products'])->get();
        return response()->json($orders);
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
            'products.*.warehouse_id' => 'required|exists:warehouses,id',
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
            // Verificar disponibilidad de todos los productos
            foreach ($request->products as $item) {
                $inventory = Inventory::where('product_id', $item['product_id'])
                    ->where('warehouse_id', $item['warehouse_id'])
                    ->first();
                
                if (!$inventory || $inventory->quantity < $item['quantity']) {
                    throw new \Exception("No hay suficiente stock del producto ID {$item['product_id']} en la bodega seleccionada.");
                }
            }
            
            // Generar código único de seguimiento
            $trackingCode = 'ORD-' . strtoupper(Str::random(8));
            
            // Crear la orden
            $order = Order::create([
                'tracking_code' => $trackingCode,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'customer_email' => $request->customer_email,
                'status' => 'Pendiente',
                'notes' => $request->notes,
                'created_by' => $request->user()->id,
            ]);
            
            // Calcular el total y asociar productos
            $totalAmount = 0;
            
            foreach ($request->products as $item) {
                $product = Product::find($item['product_id']);
                $price = $product->price;
                $subtotal = $price * $item['quantity'];
                $totalAmount += $subtotal;
                
                // Asociar producto a la orden
                $order->products()->attach($item['product_id'], [
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'warehouse_id' => $item['warehouse_id'],
                ]);
                
                // Actualizar inventario
                $inventory = Inventory::where('product_id', $item['product_id'])
                    ->where('warehouse_id', $item['warehouse_id'])
                    ->first();
                    
                $inventory->quantity -= $item['quantity'];
                $inventory->save();
            }
            
            // Actualizar el total de la orden
            $order->total_amount = $totalAmount;
            $order->save();
            
            // Crear primer registro de seguimiento
            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Pendiente',
                'notes' => 'Pedido registrado en el sistema',
                'updated_by' => $request->user()->id,
            ]);
            
            DB::commit();

            event(new \App\Events\OrderCreated($order));

            return response()->json([
                'message' => 'Pedido creado exitosamente',
                'order' => $order,
                'tracking_code' => $trackingCode
            ], 201);
            
            return response()->json([
                'message' => 'Pedido creado exitosamente',
                'order' => $order,
                'tracking_code' => $trackingCode
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Error al crear el pedido',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(string $id)
    {
        $order = Order::with(['trackingHistory.updatedBy', 'products', 'createdBy'])->find($id);
        
        if (!$order) {
            return response()->json([
                'message' => 'Pedido no encontrado'
            ], 404);
        }
        
        return response()->json($order);
    }

    /**
     * Update order status and handle inventory restoration if cancelled
     */
    public function updateStatus(Request $request, string $id)
    {
        $order = Order::with('products')->find($id);
        
        if (!$order) {
            return response()->json([
                'message' => 'Pedido no encontrado'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:Pendiente,En preparación,En tránsito,Entregado,Cancelado',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldStatus = $order->status;
        $newStatus = $request->status;

        DB::beginTransaction();
        
        try {
            // Si el pedido se cancela, restaurar inventario
            if ($newStatus === 'Cancelado' && $oldStatus !== 'Cancelado') {
                foreach ($order->products as $product) {
                    $inventory = Inventory::where('product_id', $product->id)
                        ->where('warehouse_id', $product->pivot->warehouse_id)
                        ->first();
                    
                    if ($inventory) {
                        // Restaurar la cantidad que se había reducido
                        $inventory->quantity += $product->pivot->quantity;
                        $inventory->save();
                    }
                }
            }
            
            if ($oldStatus === 'Cancelado' && $newStatus !== 'Cancelado') {
                // Verificar que hay suficiente stock para reactivar
                foreach ($order->products as $product) {
                    $inventory = Inventory::where('product_id', $product->id)
                        ->where('warehouse_id', $product->pivot->warehouse_id)
                        ->first();
                    
                    if (!$inventory || $inventory->quantity < $product->pivot->quantity) {
                        throw new \Exception("No hay suficiente stock para reactivar este pedido. Producto: {$product->name}");
                    }
                }
                
                foreach ($order->products as $product) {
                    $inventory = Inventory::where('product_id', $product->id)
                        ->where('warehouse_id', $product->pivot->warehouse_id)
                        ->first();
                    
                    $inventory->quantity -= $product->pivot->quantity;
                    $inventory->save();
                }
            }
            
            $oldStatus = $order->status;
            $order->status = $request->status;
            $order->save();

            // Disparar evento de cambio de estado
            event(new \App\Events\OrderStatusChanged($order, $oldStatus, $request->status));

            // Crear tracking
            OrderTracking::create([
                'order_id' => $order->id,
                'status' => $request->status,
                'notes' => $request->notes ?? '',
                'updated_by' => $request->user()->id,
            ]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Estado del pedido actualizado exitosamente',
                'order' => $order->load(['trackingHistory', 'products'])
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Error al actualizar el estado del pedido',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function cancel(Request $request, string $id)
    {
        $cancelRequest = new Request([
            'status' => 'Cancelado',
            'notes' => $request->input('notes', 'Pedido cancelado desde el panel de administración')
        ]);
        
        $cancelRequest->setUserResolver($request->getUserResolver());
        
        return $this->updateStatus($cancelRequest, $id);
    }


    public function trackByCode(string $trackingCode)
    {
        $order = Order::with('trackingHistory')->where('tracking_code', $trackingCode)->first();
        
        if (!$order) {
            return response()->json([
                'message' => 'Pedido no encontrado'
            ], 404);
        }
        
        // Formatear la respuesta para mostrar solo información relevante
        $trackingData = [
            'tracking_code' => $order->tracking_code,
            'customer_name' => $order->customer_name,
            'order_date' => $order->created_at->format('Y-m-d H:i:s'),
            'current_status' => $order->status,
            'tracking_history' => $order->trackingHistory->map(function ($track) {
                return [
                    'date' => $track->created_at->format('Y-m-d H:i:s'),
                    'status' => $track->status,
                    'notes' => $track->notes,
                ];
            }),
        ];
        
        return response()->json($trackingData);
    }
}