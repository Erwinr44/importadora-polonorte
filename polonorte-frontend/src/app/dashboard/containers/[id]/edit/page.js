'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function EditContainerPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    origin_country: '',
    content_description: '',
    departure_date: '',
    expected_arrival_date: '',
    status: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && !['Admin', 'Operador'].includes(user.role)) {
      router.push('/dashboard/containers');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener proveedores
        const suppliersResponse = await axios.get('/container-suppliers');
        setSuppliers(suppliersResponse.data);
        
        // Obtener datos del furgón
        const containerResponse = await axios.get(`/containers/${id}`);
        setContainer(containerResponse.data);
        
        // Formatear fechas para input type="date"
        const formatDate = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          supplier_id: containerResponse.data.supplier_id.toString(),
          origin_country: containerResponse.data.origin_country,
          content_description: containerResponse.data.content_description || '',
          departure_date: formatDate(containerResponse.data.departure_date),
          expected_arrival_date: formatDate(containerResponse.data.expected_arrival_date),
          status: containerResponse.data.status,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        
        // Si el furgón no existe o el usuario no tiene permisos, redirigir
        if (error.response?.status === 404 || error.response?.status === 403) {
          router.push('/dashboard/containers');
        }
      }
    };

    fetchData();
  }, [id, user, router]);

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
    
    // Validar que la fecha esperada sea posterior a la fecha de salida
    if (formData.departure_date && formData.expected_arrival_date) {
      const departureDate = new Date(formData.departure_date);
      const expectedDate = new Date(formData.expected_arrival_date);
      
      if (expectedDate < departureDate) {
        newErrors.expected_arrival_date = 'La fecha esperada debe ser posterior a la fecha de salida';
      }
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
      await axios.put(`/containers/${id}`, formData);
      
      // Redirigir a los detalles del furgón después de actualizar
      router.push(`/dashboard/containers/${id}`);
    } catch (error) {
      console.error('Error updating container:', error);
      
      // Manejar errores de validación del servidor
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al actualizar el furgón. Por favor, intenta de nuevo.');
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
        <h1 className="text-2xl font-bold">Editar Furgón</h1>
        <button
          onClick={() => router.push(`/dashboard/containers/${id}`)}
          className="text-gray-600 hover:text-gray-800"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="supplier_id">
                Proveedor
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                }`}
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
            
            {/* País de Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="origin_country">
                País de Origen
              </label>
              <input
                type="text"
                id="origin_country"
                name="origin_country"
                value={formData.origin_country}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.origin_country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: China"
              />
              {errors.origin_country && (
                <p className="mt-1 text-sm text-red-500">{errors.origin_country}</p>
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
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.departure_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.departure_date && (
                <p className="mt-1 text-sm text-red-500">{errors.departure_date}</p>
              )}
            </div>
            
            {/* Fecha Esperada de Llegada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expected_arrival_date">
                Fecha Esperada de Llegada
              </label>
              <input
                type="date"
                id="expected_arrival_date"
                name="expected_arrival_date"
                value={formData.expected_arrival_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.expected_arrival_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expected_arrival_date && (
                <p className="mt-1 text-sm text-red-500">{errors.expected_arrival_date}</p>
              )}
            </div>
            
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
          </div>
          
          {/* Descripción del Contenido */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="content_description">
              Descripción del Contenido
            </label>
            <textarea
              id="content_description"
              name="content_description"
              value={formData.content_description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describa el contenido del furgón..."
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
              {submitting ? 'Guardando...' : 'Actualizar Furgón'}
            </button>
          </div>
        </form>
      </div>
    </div>
      );
}