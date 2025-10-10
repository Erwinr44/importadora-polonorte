<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Services\NotificationService;

class SendOrderCreatedNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(OrderCreated $event)
    {
        $order = $event->order;

        $message = "¡Hola {$order->customer_name}! Tu pedido ha sido registrado exitosamente.\n\n";
        $message .= "📦 Código de seguimiento: {$order->tracking_code}\n\n";
        $message .= "Puedes rastrear tu pedido en: " . env('APP_URL') . "/track/{$order->tracking_code}\n\n";
        $message .= "Total: Q" . number_format($order->total_amount, 2) . "\n\n";
        $message .= "Gracias por tu preferencia.\n- Importadora Polonorte";

        $this->notificationService->send(
            'order_created',
            $order->customer_phone,
            $message,
            null,
            ['order_id' => $order->id]
        );
    }
}