'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function UpdateContainerStatusPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    location: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/containers/${id}`);
        setContainer(response.data);
        
        // Inicializar el formulario con los datos actuales
        setFormData({
          status: response.data.status,
          location: response.data.tracking_history?.length > 0 
            ? response.data.tracking_history[0].location || ''
            : '',
          notes: '',
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching container:', error);
        setLoading(false);
        
        // Si el furgón no existe o el usuario no tiene permisos, redirigir
        if (error.response?.status === 404 || error.response?.status === 403) {
          router.push('/dashboard/containers');
        }
      }
    };

    fetchContainer();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await axios.post(`/containers/${id}/update-status`, formData);
      
      // Redirigir a los detalles del furgón después de actualizar
      router.push(`/dashboard/containers/${id}`);
    } catch (error) {
      console.error('Error updating container status:', error);
      
      // Manejar errores de validación del servidor
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al actualizar el estado del furgón. Por favor, intenta de nuevo.');
      }
      
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Cargando...</div>;
  }

  if (!container) {
    return <div className="text-center p-6">No se encontró información del furgón</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Actualizar Estado del Furgón</h1>
        <button
          onClick={() => router.push(`/dashboard/containers/${id}`)}
          className="text-gray-600 hover:text-gray-800"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Información del Furgón</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Código de Seguimiento</p>
            <p className="font-medium">{container.tracking_code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">País de Origen</p>
            <p className="font-medium">{container.origin_country}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Proveedor</p>
            <p className="font-medium">{container.supplier?.name || '-'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Registrado">Registrado</option>
                <option value="En preparación">En preparación</option>
                <option value="En tránsito">En tránsito</option>
                <option value="Recibido">Recibido</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
            
            {/* Ubicación Actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
                Ubicación Actual
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ej: Puerto de Shanghai, Océano Pacífico, etc."
              />
            </div>
          </div>
          
          {/* Notas */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              Notas o Comentarios
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Agregue comentarios adicionales sobre este cambio de estado..."
            ></textarea>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/containers/${id}`)}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}