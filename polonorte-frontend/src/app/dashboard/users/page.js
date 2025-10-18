'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlusIcon, 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '',
    supplier_id: '',
    phone: '',
    active: true
  });
  
  const [formErrors, setFormErrors] = useState({});

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const selectedRole = roles.find(r => r.id === parseInt(formData.role_id));
  const isProveedorRole = selectedRole?.name === 'Proveedor';

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesResponse, suppliersResponse] = await Promise.all([
        axios.get('/users'),
        axios.get('/roles'),
        axios.get('/suppliers')
      ]);
      
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
      setSuppliers(suppliersResponse.data.filter(s => s.active));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar datos');
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role_id: user.role_id.toString(),
      supplier_id: user.supplier_id ? user.supplier_id.toString() : '',
      phone: user.phone || '',
      active: user.active
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role_id: '',
      supplier_id: '',
      phone: '',
      active: true
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'role_id') {
      const role = roles.find(r => r.id === parseInt(value));
      if (role?.name !== 'Proveedor') {
        setFormData(prev => ({ ...prev, supplier_id: '' }));
      }
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!formData.role_id) {
      errors.role_id = 'El rol es requerido';
    }
    
    if (isProveedorRole && !formData.supplier_id) {
      errors.supplier_id = 'Debes seleccionar un proveedor';
    }
    
    if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        role_id: parseInt(formData.role_id),
        phone: formData.phone || null,
        active: formData.active
      };
      
      if (isProveedorRole && formData.supplier_id) {
        submitData.supplier_id = parseInt(formData.supplier_id);
      }
      
      if (formData.password) {
        submitData.password = formData.password;
      }
      
      await axios.put(`/users/${selectedUser.id}`, submitData);
      alert('Usuario actualizado exitosamente');
      
      closeModal();
      fetchData();
      
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        setError(error.response?.data?.message || 'Error al guardar usuario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const action = targetUser.active ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Estás seguro de que deseas ${action} este usuario?`)) {
      return;
    }
    
    try {
      await axios.post(`/users/${userId}/toggle-status`);
      alert(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      fetchData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error al cambiar estado: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    
    if (!confirm(`¿Estás SEGURO de que deseas ELIMINAR PERMANENTEMENTE al usuario "${targetUser.name}"?\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }
    
    const confirmText = prompt('Escribe "ELIMINAR" (en mayúsculas) para confirmar:');
    if (confirmText !== 'ELIMINAR') {
      alert('Eliminación cancelada');
      return;
    }
    
    try {
      await axios.delete(`/users/${userId}`);
      alert('Usuario eliminado exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error.response?.status === 403) {
        alert('❌ ' + error.response.data.message);
      } else if (error.response?.status === 409) {
        const data = error.response.data;
        let message = '❌ ' + data.message + '\n\n';
        
        if (data.details) {
          message += '📊 Registros asociados:\n';
          if (data.details.containers > 0) {
            message += `   • ${data.details.containers} furgón(es)\n`;
          }
          if (data.details.orders > 0) {
            message += `   • ${data.details.orders} pedido(s)\n`;
          }
          if (data.details.tracking_updates > 0) {
            message += `   • ${data.details.tracking_updates} actualización(es) de seguimiento\n`;
          }
          
          if (data.suggestion) {
            message += '\n💡 ' + data.suggestion;
          }
        }
        
        alert(message);
      } else {
        alert('Error al eliminar usuario: ' + (error.response?.data?.message || 'Error desconocido'));
      }
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUserForPassword(null);
    setNewPassword('');
  };

  const resetUserPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsResettingPassword(true);
    
    try {
      await axios.post(`/users/${selectedUserForPassword.id}/reset-password`, {
        new_password: newPassword
      });
      
      alert(`✅ Contraseña actualizada exitosamente para ${selectedUserForPassword.name}`);
      closePasswordModal();
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('❌ Error al actualizar contraseña: ' + (error.response?.data?.message || 'Error desconocido'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const generateTempPassword = async (userId) => {
    const user = users.find(u => u.id === userId);
    
    if (!confirm(`¿Generar una contraseña temporal para ${user.name}?`)) {
      return;
    }
    
    try {
      const response = await axios.post(`/users/${userId}/generate-temp-password`);
      
      alert(`🔐 CONTRASEÑA TEMPORAL GENERADA\n\n👤 Usuario: ${response.data.user}\n🔑 Contraseña temporal: ${response.data.temporary_password}\n\n⚠️ IMPORTANTE:\n• Proporciona esta contraseña al usuario\n• El usuario debe cambiarla en su próximo login`);
      
    } catch (error) {
      console.error('Error generating temp password:', error);
      alert('❌ Error al generar contraseña temporal: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Operador':
        return 'bg-blue-100 text-blue-800';
      case 'Proveedor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <Link
          href="/dashboard/users/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role?.name === 'Admin').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proveedores</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role?.name === 'Proveedor').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={!user.active ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role?.name)}`}>
                      {user.role?.name || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuario"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Resetear contraseña"
                      >
                        <KeyIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => generateTempPassword(user.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Generar contraseña temporal"
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={user.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                        title={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.active ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar usuario"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Editar Usuario: {selectedUser?.name}
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.role_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.role_id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.role_id}</p>
                  )}
                </div>

                {isProveedorRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor *
                    </label>
                    <select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.supplier_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.supplier_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.supplier_id}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+502 1234-5678"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Deja en blanco para mantener la contraseña actual
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Usuario activo
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Actualizar Usuario
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/4 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Resetear Contraseña
                </h3>
                <button 
                  onClick={closePasswordModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Usuario:</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedUserForPassword?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedUserForPassword?.email}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El usuario podrá usar esta contraseña inmediatamente
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isResettingPassword}
                >
                  Cancelar
                </button>
                <button
                  onClick={resetUserPassword}
                  disabled={isResettingPassword || !newPassword || newPassword.length < 6}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Reseteando...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="h-4 w-4" />
                      Resetear Contraseña
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}