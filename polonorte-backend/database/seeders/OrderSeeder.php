<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // Crear una orden de ejemplo
        DB::transaction(function () {
            $order = Order::create([
                'tracking_code' => 'ORD-' . strtoupper(Str::random(8)),
                'customer_name' => 'Juan Pérez',
                'customer_phone' => '55123456',
                'customer_email' => 'juan@example.com',
                'status' => 'En preparación',
                'notes' => 'Pedido para entrega en zona 10',
                'created_by' => 2, // Operador
                'total_amount' => 800, // Monto fijo para simplificar
            ]);
            
            // Crear registros de seguimiento
            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Pendiente',
                'notes' => 'Pedido registrado en el sistema',
                'updated_by' => 2, // Operador
            ]);
            
            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'En preparación',
                'notes' => 'Pedido en proceso de preparación',
                'updated_by' => 2, // Operador
            ]);
            
            // Asociar productos simplemente, sin actualizar inventario
            $order->products()->attach(1, [
                'quantity' => 2,
                'price' => 250,
                'warehouse_id' => 1,
            ]);
            
            $order->products()->attach(3, [
                'quantity' => 1,
                'price' => 300,
                'warehouse_id' => 1,
            ]);
        });
    }
}