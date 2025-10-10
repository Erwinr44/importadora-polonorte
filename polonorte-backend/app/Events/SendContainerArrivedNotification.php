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

        // Obtener email del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->email) {
            $subject = "Furgón Recibido - {$container->tracking_code}";
            $message = "El furgón {$container->tracking_code} ha llegado a su destino.\n\n";
            $message .= "País de origen: {$container->origin_country}\n";
            $message .= "Proveedor: {$container->supplier->name}\n\n";
            $message .= "Por favor, procede con el registro del inventario.";

            $this->notificationService->send(
                'container_arrived',
                $admin->email,
                $message,
                $subject,
                ['container_id' => $container->id]
            );
        }
    }
}