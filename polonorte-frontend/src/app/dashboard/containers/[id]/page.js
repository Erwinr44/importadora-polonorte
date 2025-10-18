'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function ContainerDetailsPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/containers/${id}`);
        setContainer(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching container:', error);
        setError(error.response?.data?.message || 'Error al cargar el furgón');
        setLoading(false);
      }
    };

    fetchContainer();
  }, [id]);

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

  if (loading) {
    return <div className="text-center p-6">Cargando detalles del furgón...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
        <p>{error}</p>
        <button 
          className="mt-2 text-blue-600 hover:text-blue-800"
          onClick={() => router.push('/dashboard/containers')}
        >
          Volver a la lista de furgones
        </button>
      </div>
    );
  }

  if (!container) {
    return <div className="text-center p-6">No se encontró información del furgón</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Detalles del Furgón</h1>
        <div className="flex space-x-2">
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => router.push('/dashboard/containers')}
          >
            Volver
          </button>
          
          {user && ['Admin', 'Operador'].includes(user.role) && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => router.push(`/dashboard/containers/${id}/edit`)}
            >
              Editar
            </button>
          )}
          
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => router.push(`/dashboard/containers/${id}/update-status`)}
          >
            Actualizar Estado
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Información General</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Código de Seguimiento</p>
              <p className="font-medium">{container.tracking_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado Actual</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(container.status)}`}>
                {container.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Proveedor</p>
              <p className="font-medium">{container.supplier?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">País de Origen</p>
              <p className="font-medium">{container.origin_country}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Fechas</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Fecha de Registro</p>
              <p className="font-medium">{new Date(container.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Salida</p>
              <p className="font-medium">
                {container.departure_date 
                  ? new Date(container.departure_date).toLocaleDateString() 
                  : 'No definida'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Esperada de Llegada</p>
              <p className="font-medium">
                {container.expected_arrival_date 
                  ? new Date(container.expected_arrival_date).toLocaleDateString() 
                  : 'No definida'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Real de Llegada</p>
              <p className="font-medium">
                {container.actual_arrival_date 
                  ? new Date(container.actual_arrival_date).toLocaleDateString() 
                  : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Contenido</h2>
          <p className="text-gray-700">
            {container.content_description || 'No hay descripción del contenido'}
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de Seguimiento</h2>
        
        {container.tracking_history && container.tracking_history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizado por
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {container.tracking_history.map((track) => (
                  <tr key={track.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(track.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(track.status)}`}>
                        {track.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.location || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {track.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.updated_by?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay registros de seguimiento disponibles</p>
        )}
      </div>
    </div>
  );
}