'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function WarehousesPage() {
  const { user } = useAuth();
  
  // Estados para datos principales
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseInventory, setWarehouseInventory] = useState({});
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Estados para modals y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    location: '',
    description: '',
    active: true
  });
  const [errors, setErrors] = useState({});

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar bodegas
        const warehousesRes = await axios.get('/warehouses');
        setWarehouses(warehousesRes.data);
        
        // Cargar conteo de productos por bodega
        const inventoryCountPromises = warehousesRes.data.map(async (warehouse) => {
          try {
            const inventoryRes = await axios.get(`/inventory/warehouse/${warehouse.id}`);
            return {
              warehouseId: warehouse.id,
              productCount: inventoryRes.data.length,
              totalItems: inventoryRes.data.reduce((sum, item) => sum + item.quantity, 0)
            };
          } catch (error) {
            return {
              warehouseId: warehouse.id,
              productCount: 0,
              totalItems: 0
            };
          }
        });
        
        const inventoryCounts = await Promise.all(inventoryCountPromises);
        const inventoryMap = {};
        inventoryCounts.forEach(count => {
          inventoryMap[count.warehouseId] = count;
        });
        setWarehouseInventory(inventoryMap);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar las bodegas');
      } finally {
        setLoading(false);
      }
    };

    if (user && ['Admin', 'Operador'].includes(user.role)) {
      fetchData();
    }
  }, [user]);

  // 🔍 Filtrar bodegas por término de búsqueda y estado activo
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActiveFilter = showActiveOnly ? warehouse.active : true;
    
    return matchesSearch && matchesActiveFilter;
  });

  // 📝 Resetear formulario
  const resetForm = () => {
    setWarehouseForm({
      name: '',
      location: '',
      description: '',
      active: true
    });
    setErrors({});
  };

  // 📝 Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!warehouseForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (warehouseForm.name.length > 255) {
      newErrors.name = 'El nombre no puede exceder 255 caracteres';
    }
    
    if (warehouseForm.location && warehouseForm.location.length > 255) {
      newErrors.location = 'La ubicación no puede exceder 255 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear nueva bodega
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.post('/warehouses', warehouseForm);
      
      // Actualizar lista de bodegas
      setWarehouses([...warehouses, response.data.warehouse]);
      
      // Cerrar modal y resetear formulario
      setShowCreateModal(false);
      resetForm();
      
      alert('Bodega creada exitosamente');
      
    } catch (error) {
      console.error('Error creando bodega:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al crear la bodega');
      }
    }
  };

  // Actualizar bodega existente
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.put(`/warehouses/${selectedWarehouse.id}`, warehouseForm);
      
      // Actualizar lista de bodegas
      setWarehouses(warehouses.map(w => 
        w.id === selectedWarehouse.id ? response.data.warehouse : w
      ));
      
      // Cerrar modal y resetear formulario
      setShowEditModal(false);
      setSelectedWarehouse(null);
      resetForm();
      
      alert('Bodega actualizada exitosamente');
      
    } catch (error) {
      console.error('Error actualizando bodega:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al actualizar la bodega');
      }
    }
  };

  // Eliminar bodega
  const handleDelete = async (warehouse) => {
    const inventoryInfo = warehouseInventory[warehouse.id];
    
    if (inventoryInfo && inventoryInfo.productCount > 0) {
      alert(`No se puede eliminar la bodega "${warehouse.name}" porque contiene ${inventoryInfo.productCount} productos en inventario.`);
      return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la bodega "${warehouse.name}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`/warehouses/${warehouse.id}`);
      
      // Actualizar lista de bodegas
      setWarehouses(warehouses.filter(w => w.id !== warehouse.id));
      
      alert('Bodega eliminada exitosamente');
      
    } catch (error) {
      console.error('Error eliminando bodega:', error);
      alert(error.response?.data?.message || 'Error al eliminar la bodega');
    }
  };

  // 🔄 Toggle estado activo/inactivo
  const handleToggleStatus = async (warehouse) => {
    const newStatus = !warehouse.active;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de que deseas ${action} la bodega "${warehouse.name}"?`)) {
      return;
    }
    
    try {
      const response = await axios.put(`/warehouses/${warehouse.id}`, {
        ...warehouse,
        active: newStatus
      });
      
      // Actualizar lista de bodegas
      setWarehouses(warehouses.map(w => 
        w.id === warehouse.id ? response.data.warehouse : w
      ));
      
      alert(`Bodega ${newStatus ? 'activada' : 'desactivada'} exitosamente`);
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la bodega');
    }
  };

  // Ver inventario de bodega
  const handleViewInventory = async (warehouse) => {
    try {
      const response = await axios.get(`/inventory/warehouse/${warehouse.id}`);
      setSelectedWarehouse({
        ...warehouse,
        inventory: response.data
      });
      setShowInventoryModal(true);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      alert('Error al cargar el inventario de la bodega');
    }
  };

  // Verificar permisos
  if (!user || !['Admin', 'Operador'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para gestionar bodegas.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando bodegas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/*  Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Bodegas</h3>
          <p className="text-2xl font-bold text-blue-600">{warehouses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Bodegas Activas</h3>
          <p className="text-2xl font-bold text-green-600">
            {warehouses.filter(w => w.active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Bodegas Inactivas</h3>
          <p className="text-2xl font-bold text-red-600">
            {warehouses.filter(w => !w.active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Con Inventario</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Object.values(warehouseInventory).filter(inv => inv.productCount > 0).length}
          </p>
        </div>
      </div>

      {/*  Panel de control */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* 🔍 Búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Buscar bodegas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo activas</span>
              </label>
            </div>

            {/* Botón crear bodega */}
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Bodega</span>
            </button>
          </div>
        </div>

        {/* Tabla de bodegas */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarehouses.map((warehouse) => {
                const inventory = warehouseInventory[warehouse.id] || { productCount: 0, totalItems: 0 };
                return (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {warehouse.name}
                        </div>
                        {warehouse.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {warehouse.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {warehouse.location || 'No especificada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {inventory.productCount} productos
                        </div>
                        <div className="text-gray-500">
                          {inventory.totalItems} unidades
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        warehouse.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {warehouse.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(warehouse.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* 👁️ Ver inventario */}
                      <button
                        onClick={() => handleViewInventory(warehouse)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver inventario"
                      >
                        <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* ✏️ Editar */}
                      <button
                        onClick={() => {
                          setSelectedWarehouse(warehouse);
                          setWarehouseForm({
                            name: warehouse.name,
                            location: warehouse.location || '',
                            description: warehouse.description || '',
                            active: warehouse.active
                          });
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* 🔄 Toggle estado */}
                      <button
                        onClick={() => handleToggleStatus(warehouse)}
                        className={`${warehouse.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={warehouse.active ? 'Desactivar' : 'Activar'}
                      >
                        {warehouse.active ? (
                          <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>

                      {/* 🗑️ Eliminar */}
                      <button
                        onClick={() => handleDelete(warehouse)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                        disabled={inventory.productCount > 0}
                      >
                        <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredWarehouses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron bodegas que coincidan con la búsqueda' : 'No hay bodegas registradas'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Bodega */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Bodega</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Bodega Central"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Ciudad de Guatemala, Zona 10"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={warehouseForm.description}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional de la bodega..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={warehouseForm.active}
                    onChange={(e) => setWarehouseForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Bodega activa</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Solo las bodegas activas aparecerán en los formularios de inventario
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Bodega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Bodega */}
      {showEditModal && selectedWarehouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Editar Bodega: {selectedWarehouse.name}
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Bodega Central"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Ciudad de Guatemala, Zona 10"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={warehouseForm.description}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional de la bodega..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={warehouseForm.active}
                    onChange={(e) => setWarehouseForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Bodega activa</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Solo las bodegas activas aparecerán en los formularios de inventario
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedWarehouse(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Inventario de Bodega */}
      {showInventoryModal && selectedWarehouse && selectedWarehouse.inventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Inventario: {selectedWarehouse.name}
              </h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedWarehouse.inventory.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M4 6h16" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Bodega Vacía</h4>
                <p className="text-gray-500">Esta bodega no tiene productos en inventario</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedWarehouse.inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900">
                            {item.product.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-900">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.quantity === 0 ? 'bg-red-100 text-red-800' :
                            item.quantity < item.product.min_stock * 0.5 ? 'bg-orange-100 text-orange-800' :
                            item.quantity < item.product.min_stock ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.quantity === 0 ? 'Sin Stock' :
                             item.quantity < item.product.min_stock * 0.5 ? 'Crítico' :
                             item.quantity < item.product.min_stock ? 'Bajo' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Total: {selectedWarehouse.inventory.length} productos, {' '}
                {selectedWarehouse.inventory.reduce((sum, item) => sum + item.quantity, 0)} unidades
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}