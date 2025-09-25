'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeContainers: 0,
    pendingOrders: 0,
    warehouses: 0
  });
  const [recentContainers, setRecentContainers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isProvider = user?.role === 'Proveedor';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch containers (todos los roles necesitan esto)
        const containersResponse = await axios.get('/containers');
        
        // Para proveedores, solo mostrar información de furgones
        if (isProvider) {
          const activeContainers = containersResponse.data.filter(
            container => container.status !== 'Recibido'
          );
          // Get most recent containers
          const sortedContainers = [...containersResponse.data].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setRecentContainers(sortedContainers.slice(0, 5)); // Mostrar más para proveedores
          
          setStats({
            totalProducts: 0,
            activeContainers: activeContainers.length,
            pendingOrders: 0,
            warehouses: 0
          });
        } 
        // Para Admin y Operador, mostrar todas las estadísticas
        else {
          // Fetch products
          const productsResponse = await axios.get('/products');
          
          const activeContainers = containersResponse.data.filter(
            container => container.status !== 'Recibido'
          );
          // Get most recent containers
          const sortedContainers = [...containersResponse.data].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setRecentContainers(sortedContainers.slice(0, 3));
          
          // Fetch orders
          const ordersResponse = await axios.get('/orders');
          const pendingOrders = ordersResponse.data.filter(
            order => order.status !== 'Entregado'
          );
          // Get most recent orders
          const sortedOrders = [...ordersResponse.data].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setRecentOrders(sortedOrders.slice(0, 3));
          
          // Fetch warehouses
          const warehousesResponse = await axios.get('/warehouses');
          
          setStats({
            totalProducts: productsResponse.data.length,
            activeContainers: activeContainers.length,
            pendingOrders: pendingOrders.length,
            warehouses: warehousesResponse.data.length
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [isProvider, user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {user?.name}</h1>
      
      {!isProvider ? (
        // Dashboard para Admin y Operador
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Productos</h2>
              <p className="text-3xl font-bold">{loading ? '...' : stats.totalProducts}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Furgones Activos</h2>
              <p className="text-3xl font-bold">{loading ? '...' : stats.activeContainers}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Pedidos Pendientes</h2>
              <p className="text-3xl font-bold">{loading ? '...' : stats.pendingOrders}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Bodegas</h2>
              <p className="text-3xl font-bold">{loading ? '...' : stats.warehouses}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Furgones Recientes</h2>
              {loading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : recentContainers.length > 0 ? (
                <div className="space-y-4">
                  {recentContainers.map(container => (
                    <div key={container.id} className="border-b pb-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{container.tracking_code}</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          container.status === 'Recibido' ? 'bg-green-100 text-green-800' :
                          container.status === 'En tránsito' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {container.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Origen: {container.origin_country}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fecha esperada: {container.expected_arrival_date ? 
                          new Date(container.expected_arrival_date).toLocaleDateString() : 
                          'No definida'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay furgones recientes para mostrar.</p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Pedidos Recientes</h2>
              {loading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div key={order.id} className="border-b pb-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{order.tracking_code}</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'Entregado' ? 'bg-green-100 text-green-800' :
                          order.status === 'En preparación' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'En ruta' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Cliente: {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Monto: Q{order.total_amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fecha: {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay pedidos recientes para mostrar.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        // Dashboard para Proveedor
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Mis Furgones Activos</h2>
              <p className="text-3xl font-bold">{loading ? '...' : stats.activeContainers}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Acciones Rápidas</h2>
              <div className="mt-2">
                <a 
                  href="/dashboard/containers/new" 
                  className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mr-2"
                >
                  Nuevo Furgón
                </a>
                <a 
                  href="/dashboard/containers" 
                  className="inline-block bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Ver Todos
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mis Furgones</h2>
              <a 
                href="/dashboard/containers" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Ver todos
              </a>
            </div>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : recentContainers.length > 0 ? (
              <div className="space-y-4">
                {recentContainers.map(container => (
                  <div key={container.id} className="border-b pb-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{container.tracking_code}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        container.status === 'Recibido' ? 'bg-green-100 text-green-800' :
                        container.status === 'En tránsito' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {container.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Origen: {container.origin_country}
                    </div>
                    <div className="text-sm text-gray-500">
                      Fecha esperada: {container.expected_arrival_date ? 
                        new Date(container.expected_arrival_date).toLocaleDateString() : 
                        'No definida'}
                    </div>
                    <div className="mt-2">
                      <a 
                        href={`/dashboard/containers/${container.id}`} 
                        className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Ver Detalles
                      </a>
                      <a 
                        href={`/dashboard/containers/${container.id}/update-status`} 
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Actualizar Estado
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay furgones para mostrar.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}