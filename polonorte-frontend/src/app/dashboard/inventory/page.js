'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

// 📍 UBICACIÓN: polonorte-frontend/src/app/dashboard/inventory/page.js

export default function InventoryPage() {
  const { user } = useAuth();
  
  // Estados para datos principales
  const [inventory, setInventory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, low-stock, transfers
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modals y formularios
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [transferForm, setTransferForm] = useState({
    product_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    quantity: 1
  });
  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    operation: 'set' // add, subtract, set
  });

  // 🔄 Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar inventario, productos con stock bajo, bodegas y productos en paralelo
        const [inventoryRes, lowStockRes, warehousesRes, productsRes] = await Promise.all([
          axios.get('/inventory'),
          axios.get('/inventory/low-stock'),
          axios.get('/warehouses'),
          axios.get('/products')
        ]);
        
        setInventory(inventoryRes.data);
        setLowStockProducts(lowStockRes.data.products || []);
        setWarehouses(warehousesRes.data);
        setProducts(productsRes.data);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar los datos del inventario');
      } finally {
        setLoading(false);
      }
    };

    if (user && ['Admin', 'Operador'].includes(user.role)) {
      fetchData();
    }
  }, [user]);

  // 🔍 Filtrar inventario por término de búsqueda
  const filteredInventory = inventory.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🎨 Obtener color de badge según nivel de stock
  const getStockBadgeColor = (quantity, minStock) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < minStock * 0.5) return 'bg-orange-100 text-orange-800';
    if (quantity < minStock) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // 🎨 Obtener color de alerta según nivel
  const getAlertColor = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // 📝 Manejar transferencia de inventario
  const handleTransfer = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/inventory/transfer', transferForm);
      
      // Recargar inventario
      const inventoryRes = await axios.get('/inventory');
      setInventory(inventoryRes.data);
      
      // Cerrar modal y resetear formulario
      setShowTransferModal(false);
      setTransferForm({
        product_id: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        quantity: 1
      });
      
      alert('Transferencia realizada exitosamente');
      
    } catch (error) {
      console.error('Error en transferencia:', error);
      alert(error.response?.data?.error || 'Error al realizar la transferencia');
    }
  };

  // 📝 Manejar ajuste de cantidad
  const handleAdjustQuantity = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/inventory/update-quantity', adjustForm);
      
      // Recargar inventario
      const inventoryRes = await axios.get('/inventory');
      setInventory(inventoryRes.data);
      
      // Cerrar modal y resetear formulario
      setShowAdjustModal(false);
      setAdjustForm({
        product_id: '',
        warehouse_id: '',
        quantity: '',
        operation: 'set'
      });
      
      alert('Cantidad ajustada exitosamente');
      
    } catch (error) {
      console.error('Error en ajuste:', error);
      alert(error.response?.data?.error || 'Error al ajustar la cantidad');
    }
  };

  // 🚫 Verificar permisos
  if (!user || !['Admin', 'Operador'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para ver el inventario.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
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
      {/* 📊 Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Productos</h3>
          <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Productos Críticos</h3>
          <p className="text-2xl font-bold text-red-600">
            {lowStockProducts.filter(p => p.alert_level === 'critical').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Stock Bajo</h3>
          <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Bodegas Activas</h3>
          <p className="text-2xl font-bold text-green-600">
            {warehouses.filter(w => w.active).length}
          </p>
        </div>
      </div>

      {/* 🗂️ Pestañas de navegación */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventario General
            </button>
            <button
              onClick={() => setActiveTab('low-stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'low-stock'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alertas de Stock
              {lowStockProducts.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transfers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transferencias
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 🔍 Barra de búsqueda y acciones */}
          {activeTab === 'inventory' && (
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por producto, código o bodega..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="ml-4 space-x-2">
                <button
                  onClick={() => setShowAdjustModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Ajustar Cantidad
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Nueva Transferencia
                </button>
              </div>
            </div>
          )}

          {/* 📋 Contenido según pestaña activa */}
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bodega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Mínimo
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
                  {filteredInventory.map((item) => (
                    <tr key={`${item.product_id}-${item.warehouse_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {item.product.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.warehouse.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.warehouse.location}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {item.product.min_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStockBadgeColor(item.quantity, item.product.min_stock)
                        }`}>
                          {item.quantity === 0 ? 'Sin Stock' :
                           item.quantity < item.product.min_stock * 0.5 ? 'Crítico' :
                           item.quantity < item.product.min_stock ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedInventory(item);
                            setAdjustForm({
                              product_id: item.product_id,
                              warehouse_id: item.warehouse_id,
                              quantity: item.quantity.toString(),
                              operation: 'set'
                            });
                            setShowAdjustModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => {
                            setTransferForm(prev => ({
                              ...prev,
                              product_id: item.product_id,
                              from_warehouse_id: item.warehouse_id
                            }));
                            setShowTransferModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Transferir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay inventario disponible'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 🚨 Pestaña de Alertas de Stock */}
          {activeTab === 'low-stock' && (
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-green-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h3>
                  <p className="text-gray-500">No hay productos con stock bajo actualmente</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 ${getAlertColor(product.alert_level)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-lg">{product.name}</h4>
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {product.code}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              product.alert_level === 'critical' ? 'bg-red-600 text-white' :
                              product.alert_level === 'high' ? 'bg-orange-600 text-white' :
                              product.alert_level === 'medium' ? 'bg-yellow-600 text-white' :
                              'bg-blue-600 text-white'
                            }`}>
                              {product.alert_level === 'critical' ? 'CRÍTICO' :
                               product.alert_level === 'high' ? 'ALTO' :
                               product.alert_level === 'medium' ? 'MEDIO' : 'BAJO'}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Stock Actual:</span>
                              <span className="ml-2 font-bold">{product.total_stock}</span>
                            </div>
                            <div>
                              <span className="font-medium">Stock Mínimo:</span>
                              <span className="ml-2">{product.min_stock}</span>
                            </div>
                            <div>
                              <span className="font-medium">Déficit:</span>
                              <span className="ml-2 text-red-600 font-bold">{product.deficit}</span>
                            </div>
                            <div>
                              <span className="font-medium">Categoría:</span>
                              <span className="ml-2">{product.category || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-2">Stock por Bodega:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {product.inventory_by_warehouse.map((inventory, index) => (
                                <div key={index} className="flex justify-between items-center bg-white bg-opacity-50 px-3 py-2 rounded">
                                  <span className="font-medium">{inventory.warehouse_name}</span>
                                  <span className="font-bold">{inventory.quantity} unidades</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 space-y-2">
                          <button
                            onClick={() => {
                              setAdjustForm({
                                product_id: product.id,
                                warehouse_id: product.inventory_by_warehouse[0]?.warehouse_id || '',
                                quantity: '',
                                operation: 'add'
                              });
                              setShowAdjustModal(true);
                            }}
                            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Reponer Stock
                          </button>
                          <button
                            onClick={() => {
                              setTransferForm({
                                product_id: product.id,
                                from_warehouse_id: '',
                                to_warehouse_id: '',
                                quantity: 1
                              });
                              setShowTransferModal(true);
                            }}
                            className="block w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                          >
                            Transferir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🔄 Pestaña de Transferencias */}
          {activeTab === 'transfers' && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-blue-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Transferencias</h3>
              <p className="text-gray-500 mb-6">
                Utiliza los botones de "Nueva Transferencia" para mover inventario entre bodegas
              </p>
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
              >
                Nueva Transferencia
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🔄 Modal de Transferencia */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Transferencia</h3>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={transferForm.product_id}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega Origen
                </label>
                <select
                  value={transferForm.from_warehouse_id}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, from_warehouse_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar bodega origen</option>
                  {warehouses.filter(w => w.active).map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega Destino
                </label>
                <select
                  value={transferForm.to_warehouse_id}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, to_warehouse_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar bodega destino</option>
                  {warehouses
                    .filter(w => w.active && w.id != transferForm.from_warehouse_id)
                    .map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferForm({
                      product_id: '',
                      from_warehouse_id: '',
                      to_warehouse_id: '',
                      quantity: 1
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📝 Modal de Ajuste de Cantidad */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ajustar Cantidad</h3>
            
            <form onSubmit={handleAdjustQuantity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={adjustForm.product_id}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega
                </label>
                <select
                  value={adjustForm.warehouse_id}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar bodega</option>
                  {warehouses.filter(w => w.active).map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operación
                </label>
                <select
                  value={adjustForm.operation}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, operation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="set">Establecer cantidad exacta</option>
                  <option value="add">Agregar cantidad</option>
                  <option value="subtract">Restar cantidad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {adjustForm.operation === 'set' && 'La cantidad actual será reemplazada'}
                  {adjustForm.operation === 'add' && 'Se agregará esta cantidad al stock actual'}
                  {adjustForm.operation === 'subtract' && 'Se restará esta cantidad del stock actual'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustForm({
                      product_id: '',
                      warehouse_id: '',
                      quantity: '',
                      operation: 'set'
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ajustar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}