'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// 📍 UBICACIÓN: polonorte-frontend/src/app/dashboard/layout.js

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
    if (pathname === '/dashboard/warehouses') return 'Bodegas'; // 🆕 NUEVO
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
            Dashboard
          </Link>
          
          {/* Ocultar estas opciones para el rol Proveedor */}
          {!isProvider && (
            <>
              <Link 
                href="/dashboard/products" 
                className={`block py-2 px-6 ${pathname === '/dashboard/products' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              >
                Productos
              </Link>
              <Link 
                href="/dashboard/inventory" 
                className={`block py-2 px-6 ${pathname === '/dashboard/inventory' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              >
                Inventario
              </Link>
              {/* 🆕 NUEVA OPCIÓN: Bodegas */}
              <Link 
                href="/dashboard/warehouses" 
                className={`block py-2 px-6 ${pathname === '/dashboard/warehouses' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              >
                Bodegas
              </Link>
            </>
          )}
          
          <Link 
            href="/dashboard/containers" 
            className={`block py-2 px-6 ${pathname === '/dashboard/containers' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
          >
            Furgones
          </Link>
          
          {/* Ocultar Pedidos para el rol Proveedor */}
          {!isProvider && (
            <Link 
              href="/dashboard/orders" 
              className={`block py-2 px-6 ${pathname === '/dashboard/orders' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              Pedidos
            </Link>
          )}
          
          {/* Mostrar gestión de usuarios solo para Admin */}
          {user && user.role === 'Admin' && (
            <Link 
              href="/dashboard/users" 
              className={`block py-2 px-6 ${pathname === '/dashboard/users' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              Usuarios
            </Link>
          )}

          {/* Mostrar gestión de proveedores solo para Admin */}
          {user && user.role === 'Admin' && (
            <Link 
              href="/dashboard/suppliers" 
              className={`block py-2 px-6 ${pathname === '/dashboard/suppliers' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
            >
              Proveedores
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">
            {user.name} ({user.role})
          </div>
          <button 
            onClick={logout} 
            className="text-sm text-red-600 hover:text-red-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="mx-auto py-4 px-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}