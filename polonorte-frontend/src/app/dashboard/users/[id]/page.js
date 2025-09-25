'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

export default function EditUserPage({ params }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    phone: '',
    active: true
  });
  const [errors, setErrors] = useState({});
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    // Verificar si el usuario es Admin
    if (user && user.role !== 'Admin') {
      // Redirigir si no es administrador
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener roles
        const rolesResponse = await axios.get('/roles');
        setRoles(rolesResponse.data);
        
        // Obtener información del usuario
        const userResponse = await axios.get(`/users/${id}`);
        
        setFormData({
          name: userResponse.data.name,
          email: userResponse.data.email,
          password: '', // No mostramos la contraseña actual
          role_id: userResponse.data.role_id.toString(),
          phone: userResponse.data.phone || '',
          active: userResponse.data.active
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        
        // Si el usuario no existe, redirigir a la lista
        if (error.response?.status === 404) {
          router.push('/dashboard/users');
        }
      }
    };

    if (user) {
      fetchData();
    }
  }, [id, user, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error específico cuando el usuario corrige el campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    
    if (changePassword) {
      if (!formData.password.trim()) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    
    if (!formData.role_id) {
      newErrors.role_id = 'El rol es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Preparar datos para enviar al servidor
      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
        phone: formData.phone,
        active: formData.active
      };
      
      // Solo incluir la contraseña si se va a cambiar
      if (changePassword && formData.password) {
        dataToUpdate.password = formData.password;
      }
      
      await axios.put(`/users/${id}`, dataToUpdate);
      
      // Redirigir a la lista de usuarios después de actualizar
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Manejar errores de validación del servidor
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al actualizar el usuario. Por favor, intenta de nuevo.');
      }
      
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Usuario</h1>
        <button
          onClick={() => router.push('/dashboard/users')}
          className="text-gray-600 hover:text-gray-800"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            {/* Cambiar Contraseña Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700" htmlFor="changePassword">
                Cambiar contraseña
              </label>
            </div>
            
            {/* Contraseña (condicional) */}
            {changePassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            )}
            
            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role_id">
                Rol
              </label>
              <select
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.role_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar rol</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="mt-1 text-sm text-red-500">{errors.role_id}</p>
              )}
            </div>
            
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Estado */}
            <div className="flex items-center mt-7">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700" htmlFor="active">
                Usuario activo
              </label>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard/users')}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Actualizar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}