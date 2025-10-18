<?php

namespace App\Listeners;

use App\Events\ContainerRegistered;
use App\Services\NotificationService;
use App\Models\User;

class SendContainerRegisteredNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(ContainerRegistered $event)
    {
        $container = $event->container;

        // Obtener teléfono del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->phone) {
            $message = "📦 *Nuevo Furgón Registrado*\n\n";
            $message .= "Código: {$container->tracking_code}\n";
            $message .= "País de origen: {$container->origin_country}\n";
            $message .= "Proveedor: {$container->supplier->company_name}\n";
            $message .= "Estado: {$container->status}\n\n";
            $message .= "- Importadora Polonorte";

            $this->notificationService->send(
                'container_registered',
                $admin->phone,
                $message,
                null,
                ['container_id' => $container->id]
            );
        }
    }
}