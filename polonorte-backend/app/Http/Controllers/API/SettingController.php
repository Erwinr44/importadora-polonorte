<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class SettingController extends Controller
{
    /**
     * Obtener todas las configuraciones por categoría
     */
    public function index(Request $request)
    {
        $category = $request->query('category');
        
        if ($category) {
            $settings = SystemSetting::where('category', $category)->get();
        } else {
            $settings = SystemSetting::all();
        }
        
        // Para valores sensibles, no enviar el valor real al frontend
        $settings = $settings->map(function ($setting) {
            if ($setting->is_sensitive && !empty($setting->value)) {
                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'value' => '••••••••', // Ocultar valor
                    'has_value' => true,
                    'category' => $setting->category,
                    'type' => $setting->type,
                    'label' => $setting->label,
                    'description' => $setting->description,
                    'is_sensitive' => $setting->is_sensitive,
                ];
            }
            return $setting;
        });
        
        return response()->json($settings);
    }

    /**
     * Actualizar una configuración
     */
    public function update(Request $request, $key)
    {
        $setting = SystemSetting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json([
                'message' => 'Configuración no encontrada'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'value' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $setting->value = $request->value;
        $setting->save();
        
        return response()->json([
            'message' => 'Configuración actualizada exitosamente',
            'setting' => $setting
        ]);
    }

    /**
     * Actualizar múltiples configuraciones a la vez
     */
    public function updateBulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        foreach ($request->settings as $settingData) {
            $setting = SystemSetting::where('key', $settingData['key'])->first();
            if ($setting) {
                $setting->value = $settingData['value'];
                $setting->save();
            }
        }

        return response()->json([
            'message' => 'Configuraciones actualizadas exitosamente'
        ]);
    }

    /**
     * Probar conexión SMTP
     */
    public function testEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Configurar mail temporalmente con settings de BD
            $this->configureMailFromSettings();
            
            // Enviar email de prueba
            Mail::raw('Este es un email de prueba desde Importadora Polonorte. Si recibiste este mensaje, la configuración SMTP está funcionando correctamente.', function ($message) use ($request) {
                $message->to($request->email)
                        ->subject('Prueba de Configuración SMTP - Polonorte');
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Email de prueba enviado exitosamente a ' . $request->email
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar email: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Probar conexión WhatsApp (Twilio)
     */
    public function testWhatsApp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $sid = SystemSetting::getValue('twilio_sid');
            $token = SystemSetting::getValue('twilio_token');
            $from = SystemSetting::getValue('twilio_whatsapp_from');
            
            if (empty($sid) || empty($token) || empty($from)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Las credenciales de Twilio no están configuradas'
                ], 400);
            }
            
            $twilio = new \Twilio\Rest\Client($sid, $token);
            
            $message = $twilio->messages->create(
                "whatsapp:" . $request->phone,
                [
                    "from" => $from,
                    "body" => "Este es un mensaje de prueba desde Importadora Polonorte. Si recibiste este mensaje, la configuración de WhatsApp está funcionando correctamente."
                ]
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Mensaje de WhatsApp enviado exitosamente a ' . $request->phone,
                'message_sid' => $message->sid
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar WhatsApp: ' . $e->getMessage()
            ], 500);
        }
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
}