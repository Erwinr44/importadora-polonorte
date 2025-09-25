'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function ContainersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/containers');
        setContainers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching containers:', error);
        setError('Error al cargar los furgones. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchContainers();
  }, []);

  const filteredContainers = filterStatus === 'all'
    ? containers
    : containers.filter(container => container.status === filterStatus);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Recibido':
        return 'bg-green-100 text-green-800';
      case 'En tránsito':
        return 'bg-blue-100 text-blue-800';
      case 'En preparación':
        return 'bg-yellow-100 text-yellow-800';
      case 'Registrado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = (id) => {
    router.push(`/dashboard/containers/${id}/update-status`);
  };

  if (loading) {
    return <div className="text-center p-6">Cargando furgones...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Furgones</h1>
        <div className="flex space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">Todos los estados</option>
            <option value="Registrado">Registrado</option>
            <option value="En preparación">En preparación</option>
            <option value="En tránsito">En tránsito</option>
            <option value="Recibido">Recibido</option>
          </select>
          
          {/* Permitir a todos los roles (incluyendo Proveedor) crear furgones */}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push('/dashboard/containers/new')}
          >
            Nuevo Furgón
          </button>
        </div>
      </div>

      {filteredContainers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No hay furgones para mostrar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Salida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Esperada
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
              {filteredContainers.map((container) => (
                <tr key={container.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{container.tracking_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{container.supplier?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{container.origin_country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {container.departure_date ? new Date(container.departure_date).toLocaleDateString() : 'Pendiente'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {container.expected_arrival_date ? new Date(container.expected_arrival_date).toLocaleDateString() : 'No definida'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(container.status)}`}>
                      {container.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => router.push(`/dashboard/containers/${container.id}`)}
                    >
                      Ver Detalles
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900"
                      onClick={() => handleUpdateStatus(container.id)}
                    >
                      Actualizar Estado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}