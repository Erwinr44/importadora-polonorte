<?php

namespace App\Listeners;

use App\Events\LowStockDetected;
use App\Services\NotificationService;
use App\Models\User;

class SendLowStockNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(LowStockDetected $event)
    {
        $product = $event->product;
        $currentStock = $event->currentStock;

        // Obtener email del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->email) {
            $subject = "⚠️ Alerta de Stock Bajo - {$product->name}";
            $message = "El producto '{$product->name}' (Código: {$product->code}) tiene stock bajo.\n\n";
            $message .= "Stock actual: {$currentStock} unidades\n";
            $message .= "Stock mínimo: {$product->min_stock} unidades\n\n";
            $message .= "Por favor, considera reabastecer este producto.";

            $this->notificationService->send(
                'low_stock',
                $admin->email,
                $message,
                $subject,
                ['product_id' => $product->id, 'current_stock' => $currentStock]
            );
        }
    }
}