'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    channel: '',
    status: '',
  });

  useEffect(() => {
    // Verificar que sea Admin
    if (user && user.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadNotifications();
      loadStats();
    }
  }, [user, router, filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`/notifications?${params.toString()}`);
      setNotifications(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/notifications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRetry = async (id) => {
    try {
      setRetrying(id);
      await axios.post(`/notifications/${id}/retry`);
      alert('Notificación reenviada exitosamente');
      loadNotifications();
      loadStats();
    } catch (error) {
      console.error('Error retrying notification:', error);
      alert('Error al reenviar notificación');
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('¿Estás seguro de reintentar todas las notificaciones fallidas?')) {
      return;
    }

    try {
      await axios.post('/notifications/retry-all');
      alert('Se han reintentado todas las notificaciones fallidas');
      loadNotifications();
      loadStats();
    } catch (error) {
      console.error('Error retrying all:', error);
      alert('Error al reintentar notificaciones');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    const labels = {
      sent: '✓ Enviado',
      failed: '✗ Fallido',
      pending: '⏳ Pendiente',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getChannelIcon = (channel) => {
    return channel === 'email' ? '📧' : '💬';
  };

  const getTypeLabel = (type) => {
    const labels = {
      order_created: 'Pedido Creado',
      order_status_changed: 'Estado Cambiado',
      container_arrived: 'Furgón Recibido',
      low_stock: 'Stock Bajo',
      container_registered: 'Furgón Registrado',
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Historial de Notificaciones</h1>
        {stats && stats.failed > 0 && (
          <button
            onClick={handleRetryAll}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            🔄 Reintentar Todas las Fallidas ({stats.failed})
          </button>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Enviadas</div>
            <div className="text-2xl font-bold text-green-700">{stats.sent}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-600">Fallidas</div>
            <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-600">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Notificación
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="order_created">Pedido Creado</option>
              <option value="order_status_changed">Estado Cambiado</option>
              <option value="container_arrived">Furgón Recibido</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="container_registered">Furgón Registrado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Canal
            </label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="sent">Enviado</option>
              <option value="failed">Fallido</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Notificaciones */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay notificaciones que coincidan con los filtros
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinatario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(notification.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeLabel(notification.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="flex items-center">
                        <span className="mr-2">{getChannelIcon(notification.channel)}</span>
                        {notification.channel === 'email' ? 'Email' : 'WhatsApp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(notification.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {notification.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(notification.id)}
                          disabled={retrying === notification.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {retrying === notification.id ? 'Reenviando...' : '🔄 Reintentar'}
                        </button>
                      )}
                      {notification.error_message && (
                        <button
                          onClick={() => alert(notification.error_message)}
                          className="ml-3 text-red-600 hover:text-red-900"
                          title="Ver error"
                        >
                          ⚠️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}