<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Services\NotificationService;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SendOrderCreatedNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(OrderCreated $event)
    {
        Log::info('Listener de OrderCreated ejecutándose');
        
        $order = $event->order;

        // Obtener teléfono del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        Log::info('Admin encontrado para pedido', ['admin_phone' => $admin ? $admin->phone : 'NO ENCONTRADO']);

        if ($admin && $admin->phone) {
            $message = "🛒 *Nuevo Pedido Creado*\n\n";
            $message .= "📦 Código: {$order->tracking_code}\n";
            $message .= "👤 Cliente: {$order->customer_name}\n";
            $message .= "📞 Teléfono: {$order->customer_phone}\n";
            $message .= "💰 Total: Q" . number_format($order->total_amount, 2) . "\n";
            $message .= "📋 Estado: {$order->status}\n\n";
            $message .= "- Importadora Polonorte";

            Log::info('Enviando notificación de pedido creado');

            $result = $this->notificationService->send(
                'order_created',
                $admin->phone,
                $message,
                null,
                ['order_id' => $order->id]
            );

            Log::info('Resultado de envío', ['result' => $result]);
        } else {
            Log::warning('No se pudo enviar notificación: Admin sin teléfono');
        }
    }
}