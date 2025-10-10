'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Estados para datos de reportes
  const [salesData, setSalesData] = useState(null);
  const [containersData, setContainersData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customersData, setCustomersData] = useState(null);

  // Estados para filtros de fecha
  const [dateRange, setDateRange] = useState('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Colores para gráficas
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    // Verificar que no sea Proveedor
    if (user && user.role === 'Proveedor') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadReports();
    }
  }, [user, router, dateRange, customDateFrom, customDateTo]);

  const getDateRange = () => {
    const today = new Date();
    let dateFrom, dateTo;

    switch (dateRange) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'week':
        dateFrom = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
        break;
      case 'custom':
        dateFrom = customDateFrom;
        dateTo = customDateTo;
        break;
      default:
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date().toISOString().split('T')[0];
    }

    return { date_from: dateFrom, date_to: dateTo };
  };

  const loadReports = async () => {
    if (dateRange === 'custom' && (!customDateFrom || !customDateTo)) {
      return;
    }

    setLoading(true);
    const dates = getDateRange();

    try {
      // Cargar todos los reportes en paralelo
      const [sales, containers, inventory, customers] = await Promise.all([
        axios.post('/reports/sales', dates),
        axios.post('/reports/containers', dates),
        axios.post('/reports/inventory'),
        axios.post('/reports/customers', dates),
      ]);

      setSalesData(sales.data);
      setContainersData(containers.data);
      setInventoryData(inventory.data);
      setCustomersData(customers.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (type) => {
    setExporting(true);
    const dates = getDateRange();

    try {
      const response = await axios.post(`/reports/${type}/pdf`, dates, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !salesData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Período</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Última Semana
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Año
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Ventas
          </button>
          <button
            onClick={() => setActiveTab('containers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'containers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚚 Furgones
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📦 Inventario
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Clientes
          </button>
        </nav>
      </div>

      {/* Contenido de Tabs */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Tab de Ventas */}
        {activeTab === 'sales' && salesData && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Reporte de Ventas</h2>
              <button
                onClick={() => exportPDF('sales')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {exporting ? 'Exportando...' : '📄 Exportar PDF'}
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Ventas</div>
                <div className="text-2xl font-bold text-blue-700">
                  Q{salesData.summary.total_sales.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Total Pedidos</div>
                <div className="text-2xl font-bold text-green-700">{salesData.summary.total_orders}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Ticket Promedio</div>
                <div className="text-2xl font-bold text-purple-700">
                  Q{salesData.summary.average_ticket.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Gráfica de Ventas por Día */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Ventas por Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData.sales_by_day}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Ventas" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Pedidos" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top 10 Productos */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Top 10 Productos Más Vendidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData.top_products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_sales" fill="#8884d8" name="Total Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de Productos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalle de Productos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Ventas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.top_products.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.total_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Q{product.total_sales.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab de Furgones */}
        {activeTab === 'containers' && containersData && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Reporte de Furgones</h2>
              <button
                onClick={() => exportPDF('containers')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {exporting ? 'Exportando...' : '📄 Exportar PDF'}
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Furgones</div>
                <div className="text-2xl font-bold text-blue-700">
                  {containersData.summary.total_containers}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Tiempo Promedio Tránsito</div>
                <div className="text-2xl font-bold text-green-700">
                  {containersData.summary.avg_transit_days.toFixed(1)} días
                </div>
              </div>
            </div>

            {/* Gráfica de Furgones por Estado */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Furgones por Estado</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={containersData.by_status}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {containersData.by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Furgones por Proveedor */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Furgones por Proveedor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={containersData.by_supplier}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de Países */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Furgones por País de Origen</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        País
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {containersData.by_country.map((country, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {country.origin_country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {country.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab de Inventario */}
        {activeTab === 'inventory' && inventoryData && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Reporte de Inventario</h2>
              <button
                onClick={() => exportPDF('inventory')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {exporting ? 'Exportando...' : '📄 Exportar PDF'}
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Productos</div>
                <div className="text-2xl font-bold text-blue-700">
                  {inventoryData.summary.total_products}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Bodegas</div>
                <div className="text-2xl font-bold text-green-700">
                  {inventoryData.summary.total_warehouses}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Valor Inventario</div>
                <div className="text-2xl font-bold text-purple-700">
                  Q{inventoryData.summary.total_inventory_value.toLocaleString('es-GT', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Alertas Stock Bajo</div>
                <div className="text-2xl font-bold text-red-700">
                  {inventoryData.summary.low_stock_count}
                </div>
              </div>
            </div>

            {/* Gráfica de Stock por Bodega */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Stock por Bodega</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={inventoryData.stock_by_warehouse.map((item) => ({
                    name: item.warehouse.name,
                    quantity: item.total_quantity,
                    products: item.products,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" name="Cantidad Total" />
                  <Bar dataKey="products" fill="#82ca9d" name="Productos Diferentes" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Productos con Stock Bajo */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Productos con Stock Bajo ({inventoryData.low_stock_products.length})
              </h3>
              {inventoryData.low_stock_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock Actual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock Mínimo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Diferencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryData.low_stock_products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {product.current_stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.min_stock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                            {product.difference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  ✅ No hay productos con stock bajo
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Clientes */}
        {activeTab === 'customers' && customersData && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Reporte de Clientes</h2>
              <button
                onClick={() => exportPDF('customers')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {exporting ? 'Exportando...' : '📄 Exportar PDF'}
              </button>
            </div>

            {/* Resumen */}
            <div className="bg-blue-50 p-4 rounded-lg mb-8">
              <div className="text-sm text-blue-600">Total Clientes</div>
              <div className="text-2xl font-bold text-blue-700">{customersData.summary.total_customers}</div>
            </div>

            {/* Top 10 Clientes por Monto */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Top 10 Clientes por Monto</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customersData.top_customers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customer_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_spent" fill="#8884d8" name="Total Gastado" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de Top Clientes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalle de Clientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pedidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Gastado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ticket Promedio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customersData.top_customers.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.customer_phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Q{customer.total_spent.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Q{customer.avg_ticket.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}