<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class SendOrderStatusNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(OrderStatusChanged $event)
    {
        Log::info('🟡 Listener OrderStatusChanged ejecutándose');

        $order = $event->order;
        $newStatus = $event->newStatus;

        Log::info('🟡 Datos del pedido', [
            'order_id' => $order->id,
            'tracking_code' => $order->tracking_code,
            'customer_phone' => $order->customer_phone,
            'new_status' => $newStatus
        ]);

        // Enviar notificación al ADMIN
        $admin = \App\Models\User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->phone) {
            Log::info('🟡 Admin encontrado', ['admin_phone' => $admin->phone]);

            $message = "📋 *Cambio de Estado de Pedido*\n\n";
            $message .= "Pedido: {$order->tracking_code}\n";
            $message .= "Cliente: {$order->customer_name}\n";
            $message .= "Nuevo estado: {$newStatus}\n\n";
            $message .= "- Importadora Polonorte";

            Log::info('🟡 Enviando notificación de cambio de estado');

            $result = $this->notificationService->send(
                'order_status_changed',
                $admin->phone,
                $message,
                null,
                ['order_id' => $order->id, 'new_status' => $newStatus]
            );

            Log::info('🟡 Resultado de envío', ['result' => $result]);
        } else {
            Log::warning('❌ Admin no encontrado o sin teléfono');
        }
    }
}