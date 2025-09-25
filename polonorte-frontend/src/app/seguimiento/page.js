'use client';

import { useState } from 'react';
import axios from '@/lib/axios';

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingType, setTrackingType] = useState('order');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const endpoint = trackingType === 'order' 
        ? `/orders/track/${trackingCode}` 
        : `/containers/track/${trackingCode}`;
      
      const response = await axios.get(endpoint);
      setTrackingData(response.data);
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'No se encontró información con el código proporcionado'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seguimiento de Envíos
          </h1>
          <p className="text-gray-600">
            Consulta el estado de tu pedido o furgón con el código de seguimiento
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">
                Tipo de Seguimiento
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="trackingType"
                    value="order"
                    checked={trackingType === 'order'}
                    onChange={() => setTrackingType('order')}
                  />
                  <span className="ml-2">Pedido</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="trackingType"
                    value="container"
                    checked={trackingType === 'container'}
                    onChange={() => setTrackingType('container')}
                  />
                  <span className="ml-2">Furgón</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label 
                htmlFor="trackingCode" 
                className="block text-gray-700 mb-2 font-medium"
              >
                Código de Seguimiento
              </label>
              <input
                type="text"
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={trackingType === 'order' ? 'Ej: ORD-12345678' : 'Ej: CONT-12345678'}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Consultar Estado'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded">
            <p>{error}</p>
          </div>
        )}

        {trackingData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Información de Seguimiento
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Código de Seguimiento</p>
              <p className="font-medium">{trackingData.tracking_code}</p>
            </div>

            {trackingType === 'order' && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{trackingData.customer_name}</p>
              </div>
            )}

            {trackingType === 'container' && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">País de Origen</p>
                <p className="font-medium">{trackingData.origin_country}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-500">Estado Actual</p>
              <p className="font-medium">{trackingData.current_status}</p>
            </div>

            <h3 className="font-semibold mb-2 mt-6">Historial de Seguimiento</h3>
            <div className="border rounded-md overflow-hidden">
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
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trackingData.tracking_history && trackingData.tracking_history.map((history, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {history.status}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {history.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}