'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function NewContainerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    origin_country: '',
    content_description: '',
    departure_date: '',
    expected_arrival_date: '',
    status: 'Registrado',
    location: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('🔍 USER DATA:', user);
    
    if (user) {
      // Si es proveedor, asignar automáticamente su ID
      if (user.role === 'Proveedor') {
        console.log('🔍 Supplier ID:', user.supplier_id);
        console.log('🔍 Role:', user.role);
        
        // CORRECCIÓN: No necesitamos hacer llamada a la API
        // El proveedor ya tiene su información en el objeto user
        setFormData(prev => ({
          ...prev,
          supplier_id: user.id.toString()
        }));
        setLoading(false);
      } else {
        // Solo Admin y Operador cargan la lista de proveedores
        const fetchSuppliers = async () => {
          try {
            const response = await axios.get('/container-suppliers');
            setSuppliers(response.data);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching suppliers:', error);
            setLoading(false);
          }
        };
        fetchSuppliers();
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!user || user.role !== 'Proveedor') {
      if (!formData.supplier_id) {
        newErrors.supplier_id = 'El proveedor es requerido';
      }
    }
    
    if (!formData.origin_country.trim()) {
      newErrors.origin_country = 'El país de origen es requerido';
    }
    
    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      const response = await axios.post('/containers', formData);
      
      router.push('/dashboard/containers');
    } catch (error) {
      console.error('Error creating container:', error);
      
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ 
          general: error.response?.data?.message || 'Error al crear el furgón. Por favor, intenta de nuevo.' 
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Furgón/Contenedor</h1>
        <button
          onClick={() => router.push('/dashboard/containers')}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Volver
        </button>
      </div>
      
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errors.general}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Proveedor - Solo visible para Admin y Operador */}
            {user?.role !== 'Proveedor' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="supplier_id">
                  Proveedor <span className="text-red-500">*</span>
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={submitting}
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.email})
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.supplier_id}</p>
                )}
              </div>
            )}

            {/* Mensaje informativo para proveedores */}
            {user?.role === 'Proveedor' && (
              <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Proveedor:</strong> {user.name} ({user.email})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Este contenedor se asignará automáticamente a tu empresa
                </p>
              </div>
            )}
            
            {/* País de Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="origin_country">
                País de Origen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="origin_country"
                name="origin_country"
                value={formData.origin_country}
                onChange={handleChange}
                placeholder="Ej: China, Estados Unidos"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.origin_country ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              {errors.origin_country && (
                <p className="mt-1 text-sm text-red-500">{errors.origin_country}</p>
              )}
            </div>
            
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Estado Inicial <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              >
                <option value="Registrado">Registrado</option>
                <option value="En tránsito">En tránsito</option>
                <option value="En aduana">En aduana</option>
                <option value="Entregado">Entregado</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
            
            {/* Fecha de Salida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departure_date">
                Fecha de Salida
              </label>
              <input
                type="date"
                id="departure_date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
            
            {/* Fecha Estimada de Llegada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expected_arrival_date">
                Fecha Estimada de Llegada
              </label>
              <input
                type="date"
                id="expected_arrival_date"
                name="expected_arrival_date"
                value={formData.expected_arrival_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
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
                placeholder="Ej: Puerto de Shanghai"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
            
            {/* Descripción del Contenido */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="content_description">
                Descripción del Contenido
              </label>
              <textarea
                id="content_description"
                name="content_description"
                value={formData.content_description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe el contenido del contenedor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/containers')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                'Crear Furgón'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}