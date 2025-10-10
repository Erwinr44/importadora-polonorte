<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Listar todas las notificaciones con filtros
     */
    public function index(Request $request)
    {
        $query = Notification::query()->orderBy('created_at', 'desc');

        // Filtrar por tipo
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filtrar por canal
        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }

        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrar por fecha
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $notifications = $query->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Obtener una notificación específica
     */
    public function show($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        return response()->json($notification);
    }

    /**
     * Reintentar una notificación fallida
     */
    public function retry($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Notificación no encontrada'
            ], 404);
        }

        if ($notification->status !== 'failed') {
            return response()->json([
                'message' => 'Solo se pueden reintentar notificaciones fallidas'
            ], 400);
        }

        try {
            if ($notification->channel === 'email') {
                $this->notificationService->send(
                    $notification->type,
                    $notification->recipient,
                    $notification->message,
                    $notification->subject
                );
            } elseif ($notification->channel === 'whatsapp') {
                $this->notificationService->send(
                    $notification->type,
                    $notification->recipient,
                    $notification->message
                );
            }

            return response()->json([
                'message' => 'Notificación reenviada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al reenviar notificación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reintentar todas las notificaciones fallidas
     */
    public function retryAll()
    {
        $this->notificationService->retryFailed();

        return response()->json([
            'message' => 'Se han reintentado todas las notificaciones fallidas'
        ]);
    }

    /**
     * Estadísticas de notificaciones
     */
    public function stats()
    {
        $stats = [
            'total' => Notification::count(),
            'sent' => Notification::sent()->count(),
            'failed' => Notification::failed()->count(),
            'pending' => Notification::pending()->count(),
            'by_type' => Notification::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->get(),
            'by_channel' => Notification::selectRaw('channel, COUNT(*) as count')
                ->groupBy('channel')
                ->get(),
        ];

        return response()->json($stats);
    }
}