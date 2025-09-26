'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlusIcon, 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function SuppliersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el modal de nuevo/editar proveedor
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    tax_id: '',
    active: true
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Verificar permisos y cargar datos
  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchSuppliers();
  }, [user, router]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/suppliers');
      setSuppliers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Error al cargar proveedores');
      setLoading(false);
    }
  };

  // Abrir modal para crear proveedor
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSupplier(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      tax_id: '',
      active: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir modal para editar proveedor
  const openEditModal = (supplier) => {
    setModalMode('edit');
    setSelectedSupplier(supplier);
    setFormData({
      company_name: supplier.company_name,
      contact_person: supplier.contact_person || '',
      email: supplier.email,
      phone: supplier.phone || '',
      address: supplier.address || '',
      country: supplier.country || '',
      tax_id: supplier.tax_id || '',
      active: supplier.active
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      tax_id: '',
      active: true
    });
    setFormErrors({});
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.company_name.trim()) {
      errors.company_name = 'El nombre de la empresa es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    return errors;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const submitData = {
        company_name: formData.company_name,
        contact_person: formData.contact_person || null,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        country: formData.country || null,
        tax_id: formData.tax_id || null,
        active: formData.active
      };
      
      let response;
      if (modalMode === 'create') {
        response = await axios.post('/suppliers', submitData);
        alert('Proveedor creado exitosamente');
      } else {
        response = await axios.put(`/suppliers/${selectedSupplier.id}`, submitData);
        alert('Proveedor actualizado exitosamente');
      }
      
      closeModal();
      fetchSuppliers();
      
    } catch (error) {
      console.error('Error saving supplier:', error);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setError(error.response?.data?.message || 'Error al guardar proveedor');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar estado del proveedor (activar/desactivar)
  const toggleSupplierStatus = async (supplierId) => {
    const targetSupplier = suppliers.find(s => s.id === supplierId);
    const action = targetSupplier.active ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Estás seguro de que deseas ${action} este proveedor?`)) {
      return;
    }
    
    try {
      await axios.post(`/suppliers/${supplierId}/toggle-status`);
      alert(`Proveedor ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      fetchSuppliers();
    } catch (error) {
      console.error('Error toggling supplier status:', error);
      alert('Error al cambiar estado: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  // Eliminar proveedor
  const deleteSupplier = async (supplierId) => {
    const targetSupplier = suppliers.find(s => s.id === supplierId);
    
    if (!confirm(`¿Estás SEGURO de que deseas ELIMINAR PERMANENTEMENTE al proveedor "${targetSupplier.company_name}"?\n\nEsta acción eliminará también todos sus datos relacionados y NO se puede deshacer.`)) {
      return;
    }
    
    // Confirmación adicional para eliminar
    const confirmText = prompt('Escribe "ELIMINAR" (en mayúsculas) para confirmar la eliminación:');
    if (confirmText !== 'ELIMINAR') {
      alert('Eliminación cancelada');
      return;
    }
    
    try {
      await axios.delete(`/suppliers/${supplierId}`);
      alert('Proveedor eliminado exitosamente');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error al eliminar proveedor: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
          <p className="text-gray-600 mt-1">Administra empresas proveedoras y sus datos de contacto</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {suppliers.filter(s => s.active).length}
              </p>
            </div>
            <CheckIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Países</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(suppliers.filter(s => s.country).map(s => s.country)).size}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                País
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuarios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className={!supplier.active ? 'bg-gray-50 opacity-75' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.company_name}</div>
                      {supplier.tax_id && (
                        <div className="text-sm text-gray-500">NIT: {supplier.tax_id}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supplier.contact_person || '-'}</div>
                  {supplier.phone && (
                    <div className="text-sm text-gray-500">{supplier.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supplier.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.country || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    supplier.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {supplier.users_count || 0} usuarios
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar proveedor"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleSupplierStatus(supplier.id)}
                      className={`p-1 ${supplier.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                      title={supplier.active ? 'Desactivar proveedor' : 'Activar proveedor'}
                    >
                      {supplier.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar proveedor permanentemente"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {suppliers.length === 0 && (
          <div className="text-center py-8">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo proveedor.</p>
          </div>
        )}
      </div>

      {/* Modal para crear/editar proveedor */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'create' ? 'Nuevo Proveedor' : `Editar Proveedor: ${selectedSupplier?.company_name}`}
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.company_name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIT/Tax ID
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Proveedor activo
                  </label>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {modalMode === 'create' ? 'Creando...' : 'Actualizando...'}
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {modalMode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}