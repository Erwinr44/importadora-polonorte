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

        // Obtener email del Admin
        $admin = User::whereHas('role', function($query) {
            $query->where('name', 'Admin');
        })->first();

        if ($admin && $admin->email) {
            $subject = "Nuevo Furgón Registrado - {$container->tracking_code}";
            $message = "Se ha registrado un nuevo furgón en el sistema.\n\n";
            $message .= "Código de seguimiento: {$container->tracking_code}\n";
            $message .= "País de origen: {$container->origin_country}\n";
            $message .= "Proveedor: {$container->supplier->name}\n";
            $message .= "Estado: {$container->status}";

            $this->notificationService->send(
                'container_registered',
                $admin->email,
                $message,
                $subject,
                ['container_id' => $container->id]
            );
        }
    }
}