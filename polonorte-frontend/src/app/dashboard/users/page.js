'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  // Estados para el modal de nuevo/editar usuario
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para formulario
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

  // Estados para gestión de contraseñas
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [passwordMode, setPasswordMode] = useState(''); // 'reset', 'generate'
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Verificar permisos y cargar datos
  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchUsers();
    fetchRoles();
    fetchSuppliers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar usuarios');
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/user-suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Abrir modal para crear usuario
  const openCreateModal = () => {
    setModalMode('create');
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
    setShowModal(true);
  };

  // Abrir modal para editar usuario
  const openEditModal = (user) => {
    setModalMode('edit');
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

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Si cambia el rol y no es Proveedor, limpiar supplier_id
    if (name === 'role_id') {
      const selectedRole = roles.find(r => r.id == value);
      if (selectedRole && selectedRole.name !== 'Proveedor') {
        setFormData(prev => ({
          ...prev,
          role_id: value,
          supplier_id: ''
        }));
      }
    }
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validar formulario
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

    // Validar que si es Proveedor, debe tener supplier_id
    const selectedRole = roles.find(r => r.id == formData.role_id);
    if (selectedRole && selectedRole.name === 'Proveedor' && !formData.supplier_id) {
      errors.supplier_id = 'Debe seleccionar un proveedor para usuarios con rol Proveedor';
    }
    
    // Validar contraseña solo en creación o si se está cambiando
    if (modalMode === 'create') {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (modalMode === 'edit' && formData.password) {
      // Si está editando y escribió contraseña, validarla
      if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    return errors;
  };

  // Enviar formulario
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
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        phone: formData.phone || null,
        active: formData.active
      };
      
      // Solo incluir contraseña si se especificó
      if (formData.password) {
        submitData.password = formData.password;
      }
      
      let response;
      if (modalMode === 'create') {
        response = await axios.post('/users', submitData);
        alert('Usuario creado exitosamente');
      } else {
        response = await axios.put(`/users/${selectedUser.id}`, submitData);
        alert('Usuario actualizado exitosamente');
      }
      
      closeModal();
      fetchUsers();
      
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

  // Cambiar estado del usuario (activar/desactivar)
  const toggleUserStatus = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const action = targetUser.active ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Estás seguro de que deseas ${action} este usuario?`)) {
      return;
    }
    
    try {
      await axios.post(`/users/${userId}/toggle-status`);
      alert(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error al cambiar estado: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    
    if (!confirm(`¿Estás SEGURO de que deseas ELIMINAR PERMANENTEMENTE al usuario "${targetUser.name}"?\n\nEsta acción NO se puede deshacer. Si solo quieres deshabilitarlo temporalmente, usa el botón de desactivar.`)) {
      return;
    }
    
    // Confirmación adicional para eliminar
    const confirmText = prompt('Escribe "ELIMINAR" (en mayúsculas) para confirmar la eliminación:');
    if (confirmText !== 'ELIMINAR') {
      alert('Eliminación cancelada');
      return;
    }
    
    try {
      await axios.delete(`/users/${userId}`);
      alert('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  // Gestión de contraseñas
  const openPasswordModal = (user, mode) => {
    setSelectedUserForPassword(user);
    setPasswordMode(mode);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUserForPassword(null);
    setPasswordMode('');
    setNewPassword('');
  };

  // Resetear contraseña con contraseña específica
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
      
      alert(`Contraseña actualizada exitosamente para ${selectedUserForPassword.name}`);
      closePasswordModal();
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error al actualizar contraseña: ' + (error.response?.data?.message || 'Error desconocido'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Generar contraseña temporal
  const generateTempPassword = async (userId) => {
    const user = users.find(u => u.id === userId);
    
    if (!confirm(`¿Generar una contraseña temporal para ${user.name}?`)) {
      return;
    }
    
    try {
      const response = await axios.post(`/users/${userId}/generate-temp-password`);
      
      // Mostrar la contraseña temporal en un alert grande
      alert(`CONTRASEÑA TEMPORAL GENERADA\n\nUsuario: ${response.data.user}\nContraseña temporal: ${response.data.temporary_password}\n\n⚠️ IMPORTANTE:\n- Proporciona esta contraseña al usuario\n- El usuario debe cambiarla en su próximo login\n- Esta información no se volverá a mostrar\n\n${response.data.instructions}`);
      
    } catch (error) {
      console.error('Error generating temp password:', error);
      alert('Error al generar contraseña temporal: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  // Obtener color del badge de rol
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

  // Obtener nombre del rol por ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id == roleId);
    return role ? role.name : 'Desconocido';
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <UserIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.active).length}
              </p>
            </div>
            <CheckIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role?.name === 'Admin').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role?.name === 'Proveedor').length}
              </p>
            </div>
            <UserIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                Rol / Proveedor
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
              <tr key={user.id} className={!user.active ? 'bg-gray-50 opacity-75' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
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
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role?.name)}`}>
                    {user.role?.name || 'Sin rol'}
                  </span>
                  {user.supplier && (
                    <div className="text-xs text-gray-500 mt-1">
                      {user.supplier.company_name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Editar usuario"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openPasswordModal(user, 'reset')}
                      className="text-purple-600 hover:text-purple-900 p-1"
                      title="Resetear contraseña"
                    >
                      <KeyIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateTempPassword(user.id)}
                      className="text-orange-600 hover:text-orange-900 p-1"
                      title="Generar contraseña temporal"
                    >
                      <LockClosedIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`p-1 ${user.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                      title={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Eliminar usuario permanentemente"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {modalMode === 'create' ? 'Nuevo Usuario' : `Editar Usuario: ${selectedUser?.name}`}
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Información básica */}
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
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Rol y proveedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol *
                    </label>
                    <select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

                  {/* Mostrar selector de proveedor solo si el rol es "Proveedor" */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getRoleName(formData.role_id) === 'Proveedor' ? 'Proveedor Asignado *' : 'Proveedor (opcional)'}
                    </label>
                    <select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.supplier_id ? 'border-red-500' : getRoleName(formData.role_id) === 'Proveedor' ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                      }`}
                      required={getRoleName(formData.role_id) === 'Proveedor'}
                      disabled={getRoleName(formData.role_id) !== 'Proveedor'}
                    >
                      <option value="">
                        {getRoleName(formData.role_id) === 'Proveedor' ? 'Seleccionar proveedor' : 'Sin proveedor asignado'}
                      </option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                          {supplier.contact_person && ` (${supplier.contact_person})`}
                        </option>
                      ))}
                    </select>
                    {formErrors.supplier_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.supplier_id}</p>
                    )}
                    {getRoleName(formData.role_id) === 'Proveedor' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Este usuario solo podrá gestionar contenedores de este proveedor
                      </p>
                    )}
                    {getRoleName(formData.role_id) !== 'Proveedor' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Solo usuarios con rol "Proveedor" necesitan asignación
                      </p>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Contraseñas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {modalMode === 'create' ? 'Contraseña *' : 'Nueva Contraseña (opcional)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={modalMode === 'create'}
                    />
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                    )}
                    {modalMode === 'edit' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Deja en blanco para mantener la contraseña actual
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {modalMode === 'create' ? 'Confirmar Contraseña *' : 'Confirmar Nueva Contraseña'}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={modalMode === 'create' || formData.password}
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Estado activo */}
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

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {modalMode === 'create' ? 'Creando...' : 'Actualizando...'}
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {modalMode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para resetear contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/4 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
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

              {/* Información del usuario */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">Usuario:</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedUserForPassword?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedUserForPassword?.email}
                </p>
              </div>

              {/* Nueva contraseña */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El usuario podrá usar esta contraseña inmediatamente
                </p>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  disabled={isResettingPassword}
                >
                  Cancelar
                </button>
                <button
                  onClick={resetUserPassword}
                  disabled={isResettingPassword || !newPassword || newPassword.length < 6}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
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