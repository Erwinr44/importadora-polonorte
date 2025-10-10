<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Services\NotificationService;

class SendOrderStatusNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(OrderStatusChanged $event)
    {
        $order = $event->order;
        $newStatus = $event->newStatus;

        $message = "¡Hola {$order->customer_name}!\n\n";
        $message .= "📋 Tu pedido {$order->tracking_code} ha cambiado de estado:\n\n";
        $message .= "🔄 Nuevo estado: {$newStatus}\n\n";
        $message .= "Gracias por tu preferencia.\n- Importadora Polonorte";

        $this->notificationService->send(
            'order_status_changed',
            $order->customer_phone,
            $message,
            null,
            ['order_id' => $order->id, 'new_status' => $newStatus]
        );
    }
}