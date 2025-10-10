<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ==================== CONFIGURACIÓN DE EMAIL ====================
            [
                'key' => 'mail_driver',
                'value' => 'smtp',
                'category' => 'email',
                'type' => 'select',
                'label' => 'Servicio de Email',
                'description' => 'Tipo de servicio de correo electrónico',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_host',
                'value' => 'smtp.gmail.com',
                'category' => 'email',
                'type' => 'text',
                'label' => 'Servidor SMTP',
                'description' => 'Dirección del servidor SMTP (ej: smtp.gmail.com, smtp.office365.com)',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_port',
                'value' => '587',
                'category' => 'email',
                'type' => 'number',
                'label' => 'Puerto SMTP',
                'description' => 'Puerto del servidor SMTP (587 para TLS, 465 para SSL)',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_username',
                'value' => '',
                'category' => 'email',
                'type' => 'text',
                'label' => 'Usuario SMTP',
                'description' => 'Email o usuario para autenticación SMTP',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_password',
                'value' => '',
                'category' => 'email',
                'type' => 'password',
                'label' => 'Contraseña SMTP',
                'description' => 'Contraseña o App Password del servicio de email',
                'is_sensitive' => true,
            ],
            [
                'key' => 'mail_encryption',
                'value' => 'tls',
                'category' => 'email',
                'type' => 'select',
                'label' => 'Encriptación',
                'description' => 'Tipo de encriptación (tls o ssl)',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_from_address',
                'value' => 'noreply@polonorte.com',
                'category' => 'email',
                'type' => 'email',
                'label' => 'Email Remitente',
                'description' => 'Dirección de correo que aparecerá como remitente',
                'is_sensitive' => false,
            ],
            [
                'key' => 'mail_from_name',
                'value' => 'Importadora Polonorte',
                'category' => 'email',
                'type' => 'text',
                'label' => 'Nombre Remitente',
                'description' => 'Nombre que aparecerá como remitente',
                'is_sensitive' => false,
            ],

            // ==================== CONFIGURACIÓN DE WHATSAPP (TWILIO) ====================
            [
                'key' => 'twilio_sid',
                'value' => '',
                'category' => 'whatsapp',
                'type' => 'text',
                'label' => 'Twilio Account SID',
                'description' => 'Account SID de tu cuenta de Twilio',
                'is_sensitive' => true,
            ],
            [
                'key' => 'twilio_token',
                'value' => '',
                'category' => 'whatsapp',
                'type' => 'password',
                'label' => 'Twilio Auth Token',
                'description' => 'Token de autenticación de Twilio',
                'is_sensitive' => true,
            ],
            [
                'key' => 'twilio_whatsapp_from',
                'value' => '',
                'category' => 'whatsapp',
                'type' => 'text',
                'label' => 'Número WhatsApp',
                'description' => 'Número de WhatsApp de Twilio (formato: whatsapp:+14155238886)',
                'is_sensitive' => false,
            ],

            // ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================
            [
                'key' => 'notify_order_created',
                'value' => 'true',
                'category' => 'notifications',
                'type' => 'boolean',
                'label' => 'Notificar nuevo pedido',
                'description' => 'Enviar WhatsApp al cliente cuando se crea un pedido',
                'is_sensitive' => false,
            ],
            [
                'key' => 'notify_order_status_changed',
                'value' => 'true',
                'category' => 'notifications',
                'type' => 'boolean',
                'label' => 'Notificar cambio de estado',
                'description' => 'Enviar WhatsApp al cliente cuando cambia el estado del pedido',
                'is_sensitive' => false,
            ],
            [
                'key' => 'notify_container_arrived',
                'value' => 'true',
                'category' => 'notifications',
                'type' => 'boolean',
                'label' => 'Notificar llegada de furgón',
                'description' => 'Enviar email interno cuando un furgón llega a destino',
                'is_sensitive' => false,
            ],
            [
                'key' => 'notify_low_stock',
                'value' => 'true',
                'category' => 'notifications',
                'type' => 'boolean',
                'label' => 'Notificar stock bajo',
                'description' => 'Enviar email a Admin cuando un producto tiene stock bajo',
                'is_sensitive' => false,
            ],
            [
                'key' => 'notify_container_registered',
                'value' => 'true',
                'category' => 'notifications',
                'type' => 'boolean',
                'label' => 'Notificar furgón registrado',
                'description' => 'Enviar email interno cuando se registra un nuevo furgón',
                'is_sensitive' => false,
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}