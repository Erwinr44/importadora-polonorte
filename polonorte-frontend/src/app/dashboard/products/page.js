'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductsPage() {
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    price: '',
    unit_type: 'caja',
    unit_weight: '',
    weight_unit: '',
    min_stock: '',
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [productsRes, warehousesRes, unitTypesRes] = await Promise.all([
          axios.get('/products'),
          axios.get('/warehouses'),
          axios.get('/unit-types')
        ]);
        
        setProducts(productsRes.data);
        setWarehouses(warehousesRes.data);
        setUnitTypes(unitTypesRes.data.unit_types || []);
        setWeightUnits(unitTypesRes.data.weight_units || []);
        
        const uniqueCategories = [...new Set(
          productsRes.data
            .map(p => p.category)
            .filter(cat => cat && cat.trim())
        )].sort();
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    if (user && ['Admin', 'Operador'].includes(user.role)) {
      fetchData();
    }
  }, [user]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesActive = showActiveOnly ? product.active : true;
    
    let matchesStock = true;
    if (filterStock === 'out') {
      matchesStock = product.total_stock === 0;
    } else if (filterStock === 'low') {
      matchesStock = product.total_stock > 0 && product.total_stock < product.min_stock;
    } else if (filterStock === 'normal') {
      matchesStock = product.total_stock >= product.min_stock;
    }
    
    return matchesSearch && matchesCategory && matchesActive && matchesStock;
  });

  const getStockBadgeColor = (totalStock, minStock) => {
    if (totalStock === 0) return 'bg-red-100 text-red-800';
    if (totalStock < minStock * 0.5) return 'bg-orange-100 text-orange-800';
    if (totalStock < minStock) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (totalStock, minStock) => {
    if (totalStock === 0) return 'Sin Stock';
    if (totalStock < minStock * 0.5) return 'Crítico';
    if (totalStock < minStock) return 'Bajo';
    return 'Normal';
  };

  // Función helper para formatear unidades con pluralización
  const formatUnit = (unitType, quantity) => {
    if (!unitType) return 'unidades';
    const unit = unitType.toLowerCase();
    if (quantity === 1) return unit;
    if (unit.endsWith('z')) return unit.slice(0, -1) + 'ces';
    return unit + 's';
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      code: '',
      description: '',
      category: '',
      price: '',
      unit_type: 'caja',
      unit_weight: '',
      weight_unit: '',
      min_stock: '',
      active: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!productForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!productForm.code.trim()) {
      newErrors.code = 'El código es requerido';
    }
    
    if (productForm.price && (isNaN(productForm.price) || parseFloat(productForm.price) < 0)) {
      newErrors.price = 'El precio debe ser un número válido mayor o igual a 0';
    }
    
    if (productForm.min_stock && (isNaN(productForm.min_stock) || parseInt(productForm.min_stock) < 0)) {
      newErrors.min_stock = 'El stock mínimo debe ser un número entero mayor o igual a 0';
    }

    if (productForm.unit_weight && productForm.unit_weight.trim() !== '') {
      if (isNaN(productForm.unit_weight) || parseFloat(productForm.unit_weight) < 0) {
        newErrors.unit_weight = 'El peso debe ser un número válido';
      }
      if (!productForm.weight_unit || productForm.weight_unit.trim() === '') {
        newErrors.weight_unit = 'Debe seleccionar el tipo de peso';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const formData = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        min_stock: parseInt(productForm.min_stock) || 0,
        unit_weight: productForm.unit_weight ? parseFloat(productForm.unit_weight) : null,
        weight_unit: productForm.weight_unit || null
      };
      
      const response = await axios.post('/products', formData);
      
      setProducts([...products, response.data.product]);
      
      if (formData.category && !categories.includes(formData.category)) {
        setCategories([...categories, formData.category].sort());
      }
      
      setShowCreateModal(false);
      resetForm();
      
      alert('Producto creado exitosamente');
      
    } catch (error) {
      console.error('Error creando producto:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.message || 'Error al crear el producto');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const formData = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        min_stock: parseInt(productForm.min_stock) || 0,
        unit_weight: productForm.unit_weight ? parseFloat(productForm.unit_weight) : null,
        weight_unit: productForm.weight_unit || null
      };
      
      await axios.put(`/products/${selectedProduct.id}`, formData);
      
      const productsRes = await axios.get('/products');
      setProducts(productsRes.data);
      
      if (formData.category && !categories.includes(formData.category)) {
        setCategories([...categories, formData.category].sort());
      }
      
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      
      alert('Producto actualizado exitosamente');
      
    } catch (error) {
      console.error('Error actualizando producto:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.message || 'Error al actualizar el producto');
      }
    }
  };

  const handleDelete = async (product) => {
    const hasStock = product.total_stock > 0;
    
    if (hasStock) {
      alert(`No se puede eliminar el producto "${product.name}" porque tiene ${product.total_stock} ${formatUnit(product.unit_type, product.total_stock)} en inventario.`);
      return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`/products/${product.id}`);
      setProducts(products.filter(p => p.id !== product.id));
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert(error.response?.data?.message || 'Error al eliminar el producto');
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = !product.active;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de que deseas ${action} el producto "${product.name}"?`)) {
      return;
    }
    
    try {
      await axios.put(`/products/${product.id}`, {
        ...product,
        active: newStatus
      });
      
      const productsRes = await axios.get('/products');
      setProducts(productsRes.data);
      
      alert(`Producto ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del producto');
    }
  };

  const handleViewStock = async (product) => {
    try {
      const response = await axios.get(`/inventory/product/${product.id}`);
      setSelectedProduct({
        ...product,
        inventory: response.data
      });
      setShowStockModal(true);
    } catch (error) {
      console.error('Error cargando stock:', error);
      alert('Error al cargar el stock del producto');
    }
  };

  if (!user || !['Admin', 'Operador'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para gestionar productos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Productos</h3>
          <p className="text-2xl font-bold text-blue-600">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Productos Activos</h3>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Sin Stock</h3>
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => p.total_stock === 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Stock Bajo</h3>
          <p className="text-2xl font-bold text-orange-600">
            {products.filter(p => p.total_stock > 0 && p.total_stock < p.min_stock).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Categorías</h3>
          <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <input
                type="text"
                placeholder="Buscar productos por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                <span>Nuevo Producto</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los stocks</option>
                <option value="normal">Stock normal</option>
                <option value="low">Stock bajo</option>
                <option value="out">Sin stock</option>
              </select>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo activos</span>
              </label>

              <div className="text-sm text-gray-600 ml-auto">
                Mostrando {filteredProducts.length} de {products.length} productos
              </div>
            </div>
          </div>
        </div>

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
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Empaque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peso Total
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {product.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {product.category || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.unit_type ? product.unit_type.charAt(0).toUpperCase() + product.unit_type.slice(1) : 'Caja'}
                    </div>
                    {product.unit_weight && product.weight_unit && (
                      <div className="text-xs text-gray-500">
                        {product.unit_weight} {product.weight_unit} c/u
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      Q{parseFloat(product.price).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {product.total_stock}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          {formatUnit(product.unit_type, product.total_stock)}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStockBadgeColor(product.total_stock, product.min_stock)
                      }`}>
                        {getStockStatusText(product.total_stock, product.min_stock)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.total_weight ? (
                      <div className="text-sm font-medium text-blue-600">
                        {parseFloat(product.total_weight).toLocaleString()} {product.weight_unit}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No especificado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewStock(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver stock por bodega"
                    >
                      <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductForm({
                          name: product.name,
                          code: product.code,
                          description: product.description || '',
                          category: product.category || '',
                          price: product.price.toString(),
                          unit_type: product.unit_type || 'caja',
                          unit_weight: product.unit_weight || '',
                          weight_unit: product.weight_unit || '',
                          min_stock: product.min_stock.toString(),
                          active: product.active
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

                    <button
                      onClick={() => handleToggleStatus(product)}
                      className={`${product.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={product.active ? 'Desactivar' : 'Activar'}
                    >
                      {product.active ? (
                        <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                      disabled={product.total_stock > 0}
                    >
                      <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M4 6h16" />
                </svg>
              </div>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all' || filterStock !== 'all' 
                  ? 'No se encontraron productos que coincidan con los filtros' 
                  : 'No hay productos registrados'}
              </p>
            </div>
          )}
        </div>
      </div>

{/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Nuevo Producto</h3>
            <form onSubmit={handleCreate} className="space-y-5">
              
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Pacas de ropa"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código único <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: PACA001"
                    required
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del producto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Ropa"
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de venta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Precio por {productForm.unit_type || 'empaque'}</p>
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.min_stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, min_stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">En {formatUnit(productForm.unit_type, 2)}</p>
                  {errors.min_stock && <p className="text-red-500 text-xs mt-1">{errors.min_stock}</p>}
                </div>
              </div>

              {/* Sección: Tipo de Empaque */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📦</span>
                  Tipo de Empaque
                </h4>
                <div className="bg-blue-50 p-3 rounded-md mb-3">
                  <p className="text-sm text-blue-800">
                    <strong>¿Cómo se maneja este producto?</strong>
                    <br/>
                    Selecciona en qué tipo de empaque recibes y vendes este producto.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de empaque <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productForm.unit_type}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unit_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {unitTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ¿En qué unidad se cuenta? Ejemplo: cajas, pacas, bultos, etc.
                  </p>
                </div>
              </div>

              {/* Sección: Peso (Opcional) */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">⚖️</span>
                  Información de Peso (Opcional)
                </h4>
                <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Este dato es solo informativo.</strong>
                    <br/>
                    Llénalo si quieres ver el peso total en inventario. No es obligatorio.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso aproximado por empaque
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.unit_weight}
                      onChange={(e) => setProductForm(prev => ({ 
                        ...prev, 
                        unit_weight: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1000"
                    />
                    {errors.unit_weight && <p className="text-red-500 text-xs mt-1">{errors.unit_weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de peso
                    </label>
                    <select
                      value={productForm.weight_unit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, weight_unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!productForm.unit_weight}
                    >
                      <option value="">Seleccionar...</option>
                      {weightUnits.map(unit => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.weight_unit && <p className="text-red-500 text-xs mt-1">{errors.weight_unit}</p>}
                  </div>
                </div>
              </div>

              {/* Preview Dinámico */}
              {productForm.unit_type && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">
                    📊 Vista previa
                  </h5>
                  <p className="text-sm text-gray-700">
                    <strong>Si registras 10 en inventario:</strong>
                    <br/>
                    • Cantidad: 10 {formatUnit(productForm.unit_type, 10)}
                    {productForm.unit_weight && productForm.weight_unit && (
                      <>
                        <br/>
                        • Peso total: <strong className="text-blue-600">
                          {(parseFloat(productForm.unit_weight) * 10).toLocaleString()} {productForm.weight_unit}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(e) => setProductForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Producto activo</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Editar: {selectedProduct.name}
            </h3>
            <form onSubmit={handleUpdate} className="space-y-5">
              
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código único <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    list="categories-list-edit"
                  />
                  <datalist id="categories-list-edit">
                    {categories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de venta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">Q</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Precio por {productForm.unit_type || 'empaque'}</p>
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.min_stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, min_stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">En {formatUnit(productForm.unit_type, 2)}</p>
                  {errors.min_stock && <p className="text-red-500 text-xs mt-1">{errors.min_stock}</p>}
                </div>
              </div>

              {/* Sección: Tipo de Empaque */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📦</span>
                  Tipo de Empaque
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de empaque <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productForm.unit_type}
                    onChange={(e) => setProductForm(prev => ({ ...prev, unit_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {unitTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección: Peso (Opcional) */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">⚖️</span>
                  Información de Peso (Opcional)
                </h4>
                <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    💡 Este dato es solo informativo
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso aproximado por empaque
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.unit_weight}
                      onChange={(e) => setProductForm(prev => ({ 
                        ...prev, 
                        unit_weight: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de peso
                    </label>
                    <select
                      value={productForm.weight_unit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, weight_unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!productForm.unit_weight}
                    >
                      <option value="">Seleccionar...</option>
                      {weightUnits.map(unit => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Dinámico */}
              {productForm.unit_type && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">
                    📊 Vista previa
                  </h5>
                  <p className="text-sm text-gray-700">
                    <strong>Si registras 10 en inventario:</strong>
                    <br/>
                    • Cantidad: 10 {formatUnit(productForm.unit_type, 10)}
                    {productForm.unit_weight && productForm.weight_unit && (
                      <>
                        <br/>
                        • Peso total: <strong className="text-blue-600">
                          {(parseFloat(productForm.unit_weight) * 10).toLocaleString()} {productForm.weight_unit}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(e) => setProductForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Producto activo</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Actualizar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Stock */}
      {showStockModal && selectedProduct && selectedProduct.inventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Stock por Bodega: {selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">
                  Código: {selectedProduct.code} | Total: {selectedProduct.total_stock} {formatUnit(selectedProduct.unit_type, selectedProduct.total_stock)}
                  {selectedProduct.total_weight && (
                    <span className="ml-2 font-medium text-blue-600">
                      ({parseFloat(selectedProduct.total_weight).toLocaleString()} {selectedProduct.weight_unit})
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedProduct.inventory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Este producto no tiene stock en ninguna bodega</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProduct.inventory.map((item) => {
                  const percentage = selectedProduct.total_stock > 0 ? (item.quantity / selectedProduct.total_stock) * 100 : 0;
                  const itemWeight = selectedProduct.unit_weight ? (item.quantity * selectedProduct.unit_weight).toFixed(2) : null;
                  return (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.warehouse.name}</h5>
                          <p className="text-sm text-gray-600">{item.warehouse.location}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockBadgeColor(item.quantity, selectedProduct.min_stock)}`}>
                          {getStockStatusText(item.quantity, selectedProduct.min_stock)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {item.quantity} {formatUnit(selectedProduct.unit_type, item.quantity)}
                            </div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        {itemWeight && (
                          <div className="text-sm text-blue-600 font-medium">
                            Peso: {parseFloat(itemWeight).toLocaleString()} {selectedProduct.weight_unit}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end mt-6 pt-4 border-t space-x-2">
              <button 
                onClick={() => { 
                  setShowStockModal(false); 
                  window.location.href = '/dashboard/inventory'; 
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Gestionar Inventario
              </button>
              <button 
                onClick={() => setShowStockModal(false)} 
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