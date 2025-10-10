'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  
  // Estados para configuraciones
  const [emailSettings, setEmailSettings] = useState({});
  const [whatsappSettings, setWhatsappSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  
  // Estados para pruebas
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Verificar que sea Admin
    if (user && user.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadSettings();
    }
  }, [user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/settings');
      
      // Organizar configuraciones por categoría
      const email = {};
      const whatsapp = {};
      const notifications = {};
      
      response.data.forEach(setting => {
        if (setting.category === 'email') {
          email[setting.key] = setting.value;
        } else if (setting.category === 'whatsapp') {
          whatsapp[setting.key] = setting.value;
        } else if (setting.category === 'notifications') {
          notifications[setting.key] = setting.value === 'true' || setting.value === true;
        }
      });
      
      setEmailSettings(email);
      setWhatsappSettings(whatsapp);
      setNotificationSettings(notifications);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleEmailChange = (key, value) => {
    setEmailSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWhatsAppChange = (key, value) => {
    setWhatsappSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveEmailSettings = async () => {
    try {
      setSaving(true);
      const settings = Object.entries(emailSettings).map(([key, value]) => ({
        key,
        value
      }));
      
      await axios.post('/settings/bulk', { settings });
      
      setMessage({ type: 'success', text: 'Configuración de email guardada exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    try {
      setSaving(true);
      const settings = Object.entries(whatsappSettings).map(([key, value]) => ({
        key,
        value
      }));
      
      await axios.post('/settings/bulk', { settings });
      
      setMessage({ type: 'success', text: 'Configuración de WhatsApp guardada exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving whatsapp settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      const settings = Object.entries(notificationSettings).map(([key, value]) => ({
        key,
        value: value.toString()
      }));
      
      await axios.post('/settings/bulk', { settings });
      
      setMessage({ type: 'success', text: 'Preferencias de notificaciones guardadas exitosamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar preferencias' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Ingresa un email para probar' });
      return;
    }

    try {
      setTestingEmail(true);
      setMessage({ type: '', text: '' });
      
      const response = await axios.post('/settings/test-email', { email: testEmail });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al enviar email de prueba' 
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) {
      setMessage({ type: 'error', text: 'Ingresa un número de teléfono para probar' });
      return;
    }

    try {
      setTestingWhatsApp(true);
      setMessage({ type: '', text: '' });
      
      const response = await axios.post('/settings/test-whatsapp', { phone: testPhone });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Error testing whatsapp:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al enviar WhatsApp de prueba' 
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración del Sistema</h1>

      {/* Mensaje de éxito/error */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📧 Configuración Email
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'whatsapp'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💬 Configuración WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔔 Notificaciones
          </button>
        </nav>
      </div>

      {/* Contenido de Tabs */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Tab Email */}
        {activeTab === 'email' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Configuración SMTP</h2>
            <p className="text-sm text-gray-600 mb-6">
              Configura el servidor SMTP para el envío de correos electrónicos. Puedes usar Gmail, Outlook, SendGrid, etc.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    value={emailSettings.mail_host || ''}
                    onChange={(e) => handleEmailChange('mail_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">Ejemplo: smtp.gmail.com, smtp.office365.com</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puerto
                  </label>
                  <input
                    type="number"
                    value={emailSettings.mail_port || ''}
                    onChange={(e) => handleEmailChange('mail_port', e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">587 para TLS, 465 para SSL</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario SMTP
                  </label>
                  <input
                    type="text"
                    value={emailSettings.mail_username || ''}
                    onChange={(e) => handleEmailChange('mail_username', e.target.value)}
                    placeholder="tu-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña SMTP
                  </label>
                  <input
                    type="password"
                    value={emailSettings.mail_password || ''}
                    onChange={(e) => handleEmailChange('mail_password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">Para Gmail, usa una App Password</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Encriptación
                  </label>
                  <select
                    value={emailSettings.mail_encryption || 'tls'}
                    onChange={(e) => handleEmailChange('mail_encryption', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Remitente
                  </label>
                  <input
                    type="email"
                    value={emailSettings.mail_from_address || ''}
                    onChange={(e) => handleEmailChange('mail_from_address', e.target.value)}
                    placeholder="noreply@polonorte.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Remitente
                </label>
                <input
                  type="text"
                  value={emailSettings.mail_from_name || ''}
                  onChange={(e) => handleEmailChange('mail_from_name', e.target.value)}
                  placeholder="Importadora Polonorte"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Prueba de Email */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold mb-3">Probar Conexión SMTP</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {testingEmail ? 'Enviando...' : 'Enviar Prueba'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Se enviará un email de prueba a la dirección especificada
                </p>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={saveEmailSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab WhatsApp */}
        {activeTab === 'whatsapp' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Configuración WhatsApp (Twilio)</h2>
            <p className="text-sm text-gray-600 mb-6">
              Configura tu cuenta de Twilio para enviar mensajes de WhatsApp. 
              <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Obtén tus credenciales aquí
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account SID
                </label>
                <input
                  type="text"
                  value={whatsappSettings.twilio_sid || ''}
                  onChange={(e) => handleWhatsAppChange('twilio_sid', e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">Encuentra tu Account SID en el dashboard de Twilio</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={whatsappSettings.twilio_token || ''}
                  onChange={(e) => handleWhatsAppChange('twilio_token', e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">Tu Auth Token secreto de Twilio</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número WhatsApp de Twilio
                </label>
                <input
                  type="text"
                  value={whatsappSettings.twilio_whatsapp_from || ''}
                  onChange={(e) => handleWhatsAppChange('twilio_whatsapp_from', e.target.value)}
                  placeholder="whatsapp:+14155238886"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">Formato: whatsapp:+14155238886</p>
              </div>

              {/* Prueba de WhatsApp */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold mb-3">Probar Conexión WhatsApp</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+502XXXXXXXX"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleTestWhatsApp}
                    disabled={testingWhatsApp}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {testingWhatsApp ? 'Enviando...' : 'Enviar Prueba'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Se enviará un mensaje de WhatsApp al número especificado
                </p>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={saveWhatsAppSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Notificaciones */}
        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Preferencias de Notificaciones</h2>
            <p className="text-sm text-gray-600 mb-6">
              Activa o desactiva las notificaciones automáticas para cada evento del sistema.
            </p>

            <div className="space-y-4">
              {/* Nuevo Pedido */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Nuevo pedido creado</h3>
                  <p className="text-sm text-gray-600">Enviar WhatsApp al cliente con código de seguimiento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_order_created || false}
                    onChange={(e) => handleNotificationChange('notify_order_created', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Cambio de Estado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Cambio de estado de pedido</h3>
                  <p className="text-sm text-gray-600">Notificar al cliente cuando el estado de su pedido cambia</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_order_status_changed || false}
                    onChange={(e) => handleNotificationChange('notify_order_status_changed', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Furgón Llegó */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Furgón llegó a destino</h3>
                  <p className="text-sm text-gray-600">Enviar email al personal interno cuando un furgón es recibido</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_container_arrived || false}
                    onChange={(e) => handleNotificationChange('notify_container_arrived', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Stock Bajo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Stock bajo el mínimo</h3>
                  <p className="text-sm text-gray-600">Enviar email al Admin cuando un producto tiene stock bajo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_low_stock || false}
                    onChange={(e) => handleNotificationChange('notify_low_stock', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Furgón Registrado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Nuevo furgón registrado</h3>
                  <p className="text-sm text-gray-600">Enviar email interno cuando se registra un nuevo furgón</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notify_container_registered || false}
                    onChange={(e) => handleNotificationChange('notify_container_registered', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={saveNotificationSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}