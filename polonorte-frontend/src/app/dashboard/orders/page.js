'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { PlusIcon, XMarkIcon, CheckIcon, EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el modal de nuevo pedido
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para el modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Estados para cambio de estado
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Estados para formulario de nuevo pedido
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    products: []
  });
  
  // Estados para productos y bodegas
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Cargar órdenes
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar los pedidos. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  // Cargar productos y bodegas cuando se abre el modal
  const openModal = async () => {
    setLoadingData(true);
    setShowModal(true);
    
    try {
      const [productsResponse, warehousesResponse] = await Promise.all([
        axios.get('/products'),
        axios.get('/warehouses')
      ]);
      
      setProducts(productsResponse.data);
      setWarehouses(warehousesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar productos y bodegas');
    } finally {
      setLoadingData(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      notes: '',
      products: []
    });
  };

  // Agregar producto al pedido
  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        product_id: '',
        warehouse_id: '',
        quantity: 1,
        available_stock: 0,
        product_name: '',
        price: 0
      }]
    }));
  };

  // Remover producto del pedido
  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  // Actualizar producto en el pedido
  const updateProduct = (index, field, value) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = { ...newProducts[index], [field]: value };
      
      // Si cambia el producto, actualizar información
      if (field === 'product_id') {
        const selectedProduct = products.find(p => p.id == value);
        if (selectedProduct) {
          newProducts[index].product_name = selectedProduct.name;
          newProducts[index].price = selectedProduct.price;
          // Resetear bodega cuando cambia producto
          newProducts[index].warehouse_id = '';
          newProducts[index].available_stock = 0;
        }
      }
      
      // Si cambia la bodega, actualizar stock disponible
      if (field === 'warehouse_id' && newProducts[index].product_id) {
        const selectedProduct = products.find(p => p.id == newProducts[index].product_id);
        if (selectedProduct && selectedProduct.stock_by_warehouse) {
          const warehouseName = warehouses.find(w => w.id == value)?.name;
          newProducts[index].available_stock = selectedProduct.stock_by_warehouse[warehouseName] || 0;
        }
      }
      
      return { ...prev, products: newProducts };
    });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      setError('Nombre y teléfono del cliente son obligatorios');
      return;
    }
    
    if (formData.products.length === 0) {
      setError('Debes agregar al menos un producto al pedido');
      return;
    }
    
    // Validar que todos los productos estén completos
    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      if (!product.product_id || !product.warehouse_id || !product.quantity) {
        setError(`Producto ${i + 1}: Todos los campos son obligatorios`);
        return;
      }
      if (product.quantity > product.available_stock) {
        setError(`Producto ${i + 1}: Cantidad solicitada (${product.quantity}) excede stock disponible (${product.available_stock})`);
        return;
      }
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Preparar datos para envío
      const orderData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        notes: formData.notes || null,
        products: formData.products.map(p => ({
          product_id: parseInt(p.product_id),
          warehouse_id: parseInt(p.warehouse_id),
          quantity: parseInt(p.quantity)
        }))
      };
      
      const response = await axios.post('/orders', orderData);
      
      // Éxito
      alert(`Pedido creado exitosamente. Código de seguimiento: ${response.data.tracking_code}`);
      closeModal();
      fetchOrders(); // Recargar lista
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError('Error al crear el pedido. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancelar pedido
  const cancelOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Esto restaurará el inventario.')) {
      return;
    }
    
    try {
      await axios.post(`/orders/${orderId}/cancel`, {
        notes: 'Pedido cancelado desde el panel de administración'
      });
      
      alert('Pedido cancelado exitosamente. El inventario ha sido restaurado.');
      fetchOrders(); // Recargar lista
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Error al cancelar el pedido: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  // Ver detalles del pedido
  const viewOrderDetails = async (orderId) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error loading order details:', error);
      setError('Error al cargar los detalles del pedido');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  // Abrir modal para cambiar estado
  const openStatusModal = (order) => {
    setSelectedOrderForStatus(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrderForStatus(null);
    setNewStatus('');
    setStatusNotes('');
  };

  // Cambiar estado del pedido
  const updateOrderStatus = async () => {
    if (!selectedOrderForStatus || !newStatus) return;
    
    setUpdatingStatus(true);
    
    try {
      await axios.post(`/orders/${selectedOrderForStatus.id}/update-status`, {
        status: newStatus,
        notes: statusNotes || `Estado actualizado a: ${newStatus}`
      });
      
      alert('Estado del pedido actualizado exitosamente');
      closeStatusModal();
      fetchOrders(); // Recargar lista
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado: ' + (error.response?.data?.error || 'Error desconocido'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Estados disponibles
  const orderStatuses = [
    'Pendiente',
    'En preparación', 
    'En tránsito',
    'Entregado',
    'Cancelado'
  ];

  // Obtener próximo estado lógico
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'Pendiente': 'En preparación',
      'En preparación': 'En tránsito',
      'En tránsito': 'Entregado',
      'Entregado': 'Entregado',
      'Cancelado': 'Cancelado'
    };
    return statusFlow[currentStatus] || 'Pendiente';
  };

  // Calcular total del pedido
  const calculateTotal = () => {
    return formData.products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0).toFixed(2);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Entregado':
        return 'bg-green-100 text-green-800';
      case 'En tránsito':
        return 'bg-blue-100 text-blue-800';
      case 'En preparación':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center p-6">Cargando pedidos...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Pedido
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabla de pedidos */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No hay pedidos para mostrar.</p>
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
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
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
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{order.tracking_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Q{order.total_amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button 
                      onClick={() => viewOrderDetails(order.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Botón para cambiar estado (solo si no está entregado o cancelado) */}
                    {!['Entregado', 'Cancelado'].includes(order.status) && (
                      <button 
                        onClick={() => openStatusModal(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Cambiar estado"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    )}

                    {/* Botón de cancelar (solo si no está cancelado o entregado) */}
                    {!['Cancelado', 'Entregado'].includes(order.status) && (
                      <button 
                        onClick={() => cancelOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Cancelar pedido"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para nuevo pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Pedido</h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {loadingData ? (
                <div className="text-center py-4">Cargando productos y bodegas...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  {/* Productos */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Productos del Pedido
                      </label>
                      <button
                        type="button"
                        onClick={addProduct}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        + Agregar Producto
                      </button>
                    </div>

                    {formData.products.map((product, index) => (
                      <div key={index} className="border rounded p-4 mb-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Producto *
                            </label>
                            <select
                              value={product.product_id}
                              onChange={(e) => updateProduct(index, 'product_id', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              required
                            >
                              <option value="">Seleccionar producto</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - Q{p.price}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bodega *
                            </label>
                            <select
                              value={product.warehouse_id}
                              onChange={(e) => updateProduct(index, 'warehouse_id', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              required
                              disabled={!product.product_id}
                            >
                              <option value="">Seleccionar bodega</option>
                              {warehouses.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={product.available_stock}
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              required
                            />
                            {product.available_stock > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Stock disponible: {product.available_stock}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  {formData.products.length > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        Total: Q{calculateTotal()}
                      </p>
                    </div>
                  )}

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows="3"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creando...' : 'Crear Pedido'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado del pedido */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/4 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Cambiar Estado del Pedido
                </h3>
                <button 
                  onClick={closeStatusModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Información del pedido */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">Pedido:</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedOrderForStatus?.tracking_code}
                </p>
                <p className="text-sm text-gray-600">
                  Cliente: {selectedOrderForStatus?.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  Estado actual: 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrderForStatus?.status)}`}>
                    {selectedOrderForStatus?.status}
                  </span>
                </p>
              </div>

              {/* Selector de nuevo estado */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {orderStatuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas del cambio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Motivo del cambio de estado..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Advertencia para cancelación */}
              {newStatus === 'Cancelado' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">
                    ⚠️ Al cancelar este pedido, se restaurará automáticamente el inventario.
                  </p>
                </div>
              )}

              {/* Advertencia para reactivación */}
              {selectedOrderForStatus?.status === 'Cancelado' && newStatus !== 'Cancelado' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-600">
                    ⚠️ Al reactivar este pedido, se verificará y reducirá nuevamente el inventario.
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeStatusModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  disabled={updatingStatus}
                >
                  Cancelar
                </button>
                <button
                  onClick={updateOrderStatus}
                  disabled={updatingStatus || !newStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Actualizar Estado
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del pedido */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedOrder ? `Pedido ${selectedOrder.tracking_code}` : 'Detalles del Pedido'}
                </h3>
                <button 
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando detalles...</p>
                </div>
              ) : selectedOrder ? (
                <div className="space-y-6">
                  {/* Información del cliente */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nombre:</p>
                        <p className="text-gray-900">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Teléfono:</p>
                        <p className="text-gray-900">{selectedOrder.customer_phone}</p>
                      </div>
                      {selectedOrder.customer_email && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email:</p>
                          <p className="text-gray-900">{selectedOrder.customer_email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Estado:</p>
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                    {selectedOrder.notes && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700">Notas:</p>
                        <p className="text-gray-900">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Productos del pedido */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Productos</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.products && selectedOrder.products.map((product, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.code}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.pivot.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                Q{parseFloat(product.pivot.price).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Q{(parseFloat(product.pivot.price) * parseInt(product.pivot.quantity)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              Total:
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                              Q{parseFloat(selectedOrder.total_amount).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Historial de seguimiento */}
                  {selectedOrder.tracking_history && selectedOrder.tracking_history.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Historial de Seguimiento</h4>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="divide-y divide-gray-200">
                          {selectedOrder.tracking_history.map((track, index) => (
                            <div key={index} className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{track.status}</p>
                                  {track.notes && (
                                    <p className="text-sm text-gray-600 mt-1">{track.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">
                                    {new Date(track.created_at).toLocaleString()}
                                  </p>
                                  {track.updated_by && track.updated_by.name && (
                                    <p className="text-xs text-gray-400">por {track.updated_by.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Fecha de creación:</p>
                        <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Última actualización:</p>
                        <p className="text-gray-900">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                      </div>
                      {selectedOrder.created_by && (
                        <div>
                          <p className="font-medium text-gray-700">Creado por:</p>
                          <p className="text-gray-900">{selectedOrder.created_by.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No se pudieron cargar los detalles del pedido
                </div>
              )}

              {/* Botón de cerrar */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}