'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isProvider = user?.role === 'Proveedor';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return null;
  }

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/dashboard/products') return 'Productos';
    if (pathname === '/dashboard/inventory') return 'Inventario';
    if (pathname === '/dashboard/containers') return 'Furgones';
    if (pathname.startsWith('/dashboard/containers/')) {
      if (pathname.includes('/new')) return 'Nuevo Furgón';
      if (pathname.includes('/edit')) return 'Editar Furgón';
      if (pathname.includes('/update-status')) return 'Actualizar Estado';
      return 'Detalle de Furgón';
    }
    if (pathname === '/dashboard/orders') return 'Pedidos';
    if (pathname === '/dashboard/users') return 'Gestión de Usuarios';
    if (pathname === '/dashboard/users/new') return 'Nuevo Usuario';
    if (pathname.startsWith('/dashboard/users/') && pathname !== '/dashboard/users/new') return 'Editar Usuario';
    if (pathname === '/dashboard/reports') return 'Reportes';
    if (pathname === '/dashboard/settings') return 'Configuración del Sistema';
    if (pathname === '/dashboard/notifications') return 'Historial de Notificaciones';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Polonorte</h1>
        </div>

        <nav className="mt-6">
          <Link 
            href="/dashboard" 
            className={`block py-2 px-6 ${pathname === '/dashboard' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
          >
            📊 Dashboard
          </Link>
          
          {/* Ocultar estas opciones para el rol Proveedor */}
          {!isProvider && (
            <>
              <Link 
                href="/dashboard/products" 
                className={`block py-2 px-6 ${pathname === '/dashboard/products' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              >
                📦 Productos
              </Link>
              <Link 
                href="/dashboard/inventory" 
                className={`block py-2 px-6 ${pathname === '/dashboard/inventory' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              >
                🏪 Inventario
              </Link>
            </>
          )}
          
          <Link 
            href="/dashboard/containers" 
            className={`block py-2 px-6 ${pathname.startsWith('/dashboard/containers') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
          >
            🚚 Furgones
          </Link>
          
          {/* Ocultar pedidos para proveedores */}
          {!isProvider && (
            <Link 
              href="/dashboard/orders" 
              className={`block py-2 px-6 ${pathname.startsWith('/dashboard/orders') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              📋 Pedidos
            </Link>
          )}

          {/* Reportes - visible para Admin y Operador */}
          {!isProvider && (
            <Link 
              href="/dashboard/reports" 
              className={`block py-2 px-6 ${pathname === '/dashboard/reports' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              📊 Reportes
            </Link>
          )}

          {/* Configuración - solo visible para Admin */}
          {user?.role === 'Admin' && (
            <Link 
              href="/dashboard/settings" 
              className={`block py-2 px-6 ${pathname === '/dashboard/settings' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              ⚙️ Configuración
            </Link>
          )}

          {/* Notificaciones - solo visible para Admin */}
          {user?.role === 'Admin' && (
            <Link 
              href="/dashboard/notifications" 
              className={`block py-2 px-6 ${pathname === '/dashboard/notifications' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              🔔 Notificaciones
            </Link>
          )}
          
          {/* Usuarios - solo visible para Admin */}
          {user?.role === 'Admin' && (
            <Link 
              href="/dashboard/users" 
              className={`block py-2 px-6 ${pathname.startsWith('/dashboard/users') ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              👥 Usuarios
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}