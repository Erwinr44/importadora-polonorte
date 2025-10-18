<?php

namespace App\Listeners;

use App\Events\ContainerArrived;
use App\Services\NotificationService;
use App\Models\User;

class SendContainerArrivedNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(ContainerArrived $event)
    {
        $container = $event->container;

        // Obtener teléfono del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->phone) {
            $message = "🚢 *Furgón Recibido*\n\n";
            $message .= "Código: {$container->tracking_code}\n";
            $message .= "País de origen: {$container->origin_country}\n";
            $message .= "Proveedor: {$container->supplier->company_name}\n\n";
            $message .= "Por favor, procede con el registro del inventario.\n\n";
            $message .= "- Importadora Polonorte";

            $this->notificationService->send(
                'container_arrived',
                $admin->phone,
                $message,
                null,
                ['container_id' => $container->id]
            );
        }
    }
}