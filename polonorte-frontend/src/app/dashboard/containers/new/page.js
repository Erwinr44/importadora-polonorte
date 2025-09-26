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
    if (user) {
      const fetchSuppliers = async () => {
        try {
          setLoading(true);
          
          // Si es proveedor, usar su proveedor asignado automáticamente
          if (user.role === 'Proveedor') {
            if (!user.supplier_id) {
              alert('Tu usuario no tiene un proveedor asignado. Contacta al administrador.');
              router.push('/dashboard/containers');
              return;
            }
            
            // Obtener datos del proveedor asignado
            const response = await axios.get(`/suppliers/${user.supplier_id}`);
            setSuppliers([response.data]);
            setFormData(prev => ({
              ...prev,
              supplier_id: user.supplier_id.toString()
            }));
          } else {
            // Admin y Operador pueden seleccionar cualquier proveedor
            const response = await axios.get('/container-suppliers');
            setSuppliers(response.data);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching suppliers:', error);
          setLoading(false);
          alert('Error al cargar proveedores. Contacta al administrador.');
        }
      };

      fetchSuppliers();
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error específico cuando el usuario corrige el campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'El proveedor es requerido';
    }
    
    if (!formData.origin_country) {
      newErrors.origin_country = 'El país de origen es requerido';
    }
    
    if (!formData.status) {
      newErrors.status = 'El estado es requerido';
    }
    
    if (formData.departure_date && formData.expected_arrival_date) {
      if (new Date(formData.departure_date) > new Date(formData.expected_arrival_date)) {
        newErrors.expected_arrival_date = 'La fecha de llegada debe ser posterior a la fecha de salida';
      }
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
    
    try {
      const response = await axios.post('/containers', {
        supplier_id: parseInt(formData.supplier_id),
        origin_country: formData.origin_country,
        content_description: formData.content_description || null,
        departure_date: formData.departure_date || null,
        expected_arrival_date: formData.expected_arrival_date || null,
        status: formData.status,
        location: formData.location || null,
      });
      
      alert(`Contenedor creado exitosamente. Código de seguimiento: ${response.data.tracking_code}`);
      router.push('/dashboard/containers');
      
    } catch (error) {
      console.error('Error creating container:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al crear el contenedor: ' + (error.response?.data?.message || 'Error desconocido'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Contenedor</h1>
        <p className="text-gray-600 mt-1">Registra un nuevo contenedor en el sistema</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            {user?.role === 'Proveedor' ? (
              <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <p className="text-sm text-gray-900">
                  {suppliers[0]?.company_name || 'Cargando...'}
                </p>
                <p className="text-xs text-gray-500">
                  Proveedor asignado a tu usuario
                </p>
              </div>
            ) : (
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                    {supplier.country && ` (${supplier.country})`}
                  </option>
                ))}
              </select>
            )}
            {errors.supplier_id && (
              <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>
            )}
          </div>

          {/* País de origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País de Origen *
            </label>
            <input
              type="text"
              name="origin_country"
              value={formData.origin_country}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.origin_country ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: China, Estados Unidos"
              required
            />
            {errors.origin_country && (
              <p className="text-red-500 text-xs mt-1">{errors.origin_country}</p>
            )}
          </div>

          {/* Descripción del contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Contenido
            </label>
            <textarea
              name="content_description"
              value={formData.content_description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el contenido del contenedor..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Salida
              </label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Estimada de Llegada
              </label>
              <input
                type="date"
                name="expected_arrival_date"
                value={formData.expected_arrival_date}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.expected_arrival_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expected_arrival_date && (
                <p className="text-red-500 text-xs mt-1">{errors.expected_arrival_date}</p>
              )}
            </div>
          </div>

          {/* Estado y ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Inicial *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="Registrado">Registrado</option>
                <option value="En preparación">En preparación</option>
                <option value="En tránsito">En tránsito</option>
                <option value="Recibido">Recibido</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">{errors.status}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación Actual
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Puerto de Shanghai"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/containers')}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </div>
              ) : (
                'Crear Contenedor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}