<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class NotificationService
{

    public function send($type, $recipient, $message, $subject = null, $metadata = [])
    {
        // Verificar si el tipo de notificación está habilitado
        if (!$this->isNotificationEnabled($type)) {
            Log::info("Notificación deshabilitada: {$type}");
            return false;
        }

        // Determinar el canal según el tipo
        $channel = $this->getChannelForType($type);

        // Crear registro de notificación
        $notification = Notification::create([
            'type' => $type,
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'message' => $message,
            'status' => 'pending',
            'metadata' => $metadata
        ]);

        // Enviar según el canal
        try {
            if ($channel === 'email') {
                $this->sendEmail($recipient, $subject, $message);
            } elseif ($channel === 'whatsapp') {
                $this->sendWhatsApp($recipient, $message);
            }

            $notification->markAsSent();
            return true;

        } catch (\Exception $e) {
            $notification->markAsFailed($e->getMessage());
            Log::error("Error enviando notificación: " . $e->getMessage());
            return false;
        }
    }

    private function sendEmail($to, $subject, $message)
    {
        // Configurar mail con settings de BD
        $this->configureMailFromSettings();

        Mail::raw($message, function ($mail) use ($to, $subject) {
            $mail->to($to)->subject($subject);
        });
    }


    private function sendWhatsApp($to, $message)
    {
        $sid = SystemSetting::getValue('twilio_sid');
        $token = SystemSetting::getValue('twilio_token');
        $from = SystemSetting::getValue('twilio_whatsapp_from');

        if (empty($sid) || empty($token) || empty($from)) {
            throw new \Exception('Credenciales de Twilio no configuradas');
        }

        $twilio = new \Twilio\Rest\Client($sid, $token);

        // Asegurarse de que el número destino tenga el prefijo whatsapp:
        $toNumber = (strpos($to, 'whatsapp:') === 0) ? $to : "whatsapp:{$to}";

        $twilio->messages->create(
            $toNumber,
            [
                "from" => $from,
                "body" => $message
            ]
        );
    }


    private function isNotificationEnabled($type)
    {
        $settingKey = 'notify_' . $type;
        $value = SystemSetting::getValue($settingKey, 'true');
        return $value === 'true' || $value === true;
    }


    private function getChannelForType($type)
    {
        return 'whatsapp';
    }

    /**
     * Configurar Mail con settings de BD
     */
    private function configureMailFromSettings()
    {
        Config::set('mail.mailers.smtp.host', SystemSetting::getValue('mail_host'));
        Config::set('mail.mailers.smtp.port', SystemSetting::getValue('mail_port'));
        Config::set('mail.mailers.smtp.username', SystemSetting::getValue('mail_username'));
        Config::set('mail.mailers.smtp.password', SystemSetting::getValue('mail_password'));
        Config::set('mail.mailers.smtp.encryption', SystemSetting::getValue('mail_encryption'));
        Config::set('mail.from.address', SystemSetting::getValue('mail_from_address'));
        Config::set('mail.from.name', SystemSetting::getValue('mail_from_name'));
    }


    public function retryFailed()
    {
        $failedNotifications = Notification::failed()->get();

        foreach ($failedNotifications as $notification) {
            try {
                if ($notification->channel === 'email') {
                    $this->sendEmail(
                        $notification->recipient,
                        $notification->subject,
                        $notification->message
                    );
                } elseif ($notification->channel === 'whatsapp') {
                    $this->sendWhatsApp(
                        $notification->recipient,
                        $notification->message
                    );
                }

                $notification->markAsSent();

            } catch (\Exception $e) {
                Log::error("Error reintentando notificación {$notification->id}: " . $e->getMessage());
            }
        }
    }
}