'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isProvider = user?.role === 'Proveedor';
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    return 'Dashboard';
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', show: true },
    { name: 'Productos', href: '/dashboard/products', icon: '📦', show: !isProvider },
    { name: 'Inventario', href: '/dashboard/inventory', icon: '📋', show: !isProvider },
    { name: 'Furgones', href: '/dashboard/containers', icon: '🚢', show: true },
    { name: 'Pedidos', href: '/dashboard/orders', icon: '📝', show: !isProvider },
    { name: 'Usuarios', href: '/dashboard/users', icon: '👥', show: user?.role === 'Admin' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo y título */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/images/logo-1.jpeg"
                  alt="Polonorte"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Polonorte</h1>
                <p className="text-xs text-blue-100">Sistema de Gestión</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {navItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }
                  `}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getPageTitle()}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Bienvenido, {user.name}
                </p>
              </div>
            </div>

            {/* Quick actions / notifications */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Importadora Polonorte S.A. - Todos los derechos reservados
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}