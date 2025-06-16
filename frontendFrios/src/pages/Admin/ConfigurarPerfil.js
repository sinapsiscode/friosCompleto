import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import { showAlert } from '../../utils/sweetAlert';
import adminService from '../../services/admin.service';

const ConfigurarPerfil = () => {
  const { data, updateItem, addItem } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    distrito: '',
    empresa: '',
    cargo: '',
    usuario: user?.username || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar datos del administrador desde el backend
  useEffect(() => {
    const loadAdminProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await adminService.getProfile();
        
        if (response.success) {
          const adminData = response.data;
          setFormData(prev => ({
            ...prev,
            nombre: adminData.nombre || '',
            apellido: adminData.apellido || '',
            email: adminData.email || '',
            telefono: adminData.telefono || '',
            direccion: adminData.direccion || '',
            distrito: '', // No existe en el modelo backend
            empresa: 'FríoService',
            cargo: 'Administrador'
          }));
        }
      } catch (error) {
        console.error('Error al cargar perfil del administrador:', error);
        showAlert('Error al cargar el perfil', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAdminProfile();
  }, [user]);

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'nombre':
      case 'apellido':
        if (!value.trim()) error = 'Este campo es requerido';
        else if (value.trim().length < 2) error = 'Debe tener al menos 2 caracteres';
        break;
      case 'email':
        if (!value) error = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido';
        break;
      case 'telefono':
        if (!value) error = 'El teléfono es requerido';
        else if (!/^[0-9+\-\s()]+$/.test(value)) error = 'Formato de teléfono inválido';
        break;
      case 'direccion':
        if (!value.trim()) error = 'La dirección es requerida';
        break;
      case 'newPassword':
        if (value && value.length < 6) error = 'Mínimo 6 caracteres';
        break;
      case 'confirmPassword':
        if (value && value !== formData.newPassword) error = 'Las contraseñas no coinciden';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = editMode 
      ? ['nombre', 'apellido', 'email', 'telefono', 'direccion']
      : [];
      
    const newErrors = {};
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    // Validate password fields if they have values
    if (formData.newPassword) {
      const passwordError = validateField('newPassword', formData.newPassword);
      if (passwordError) newErrors.newPassword = passwordError;
      
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion
      };

      // Solo incluir nueva contraseña si se proporcionó
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }

      const response = await adminService.updateProfile(updateData);
      
      if (response.success) {
        showAlert('Perfil actualizado exitosamente', 'success');
        setEditMode(false);
        setFormData(prev => ({
          ...prev,
          password: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        showAlert(response.message || 'Error al actualizar el perfil', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el perfil';
      showAlert(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8">
          <div className="flex items-center justify-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mr-4"></i>
            <span className="text-lg text-gray-600">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                <i className="fas fa-user-shield text-3xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Configurar Perfil</h1>
                <p className="text-white/80">Administra tu información personal</p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-user text-primary"></i>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.nombre && touched.nombre ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.nombre && touched.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.apellido && touched.apellido ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.apellido && touched.apellido && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.telefono && touched.telefono ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.telefono && touched.telefono && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-primary"></i>
              Información de Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  placeholder="Av. Principal 123"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.direccion && touched.direccion ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.direccion && touched.direccion && (
                  <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito
                </label>
                <input
                  type="text"
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={!editMode}
                  placeholder="San Isidro"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.distrito && touched.distrito ? 'border-red-500' : 'border-gray-300'
                  } ${!editMode ? 'bg-gray-50' : ''}`}
                  required
                />
                {errors.distrito && touched.distrito && (
                  <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-building text-primary"></i>
              Información Empresarial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Security Information */}
          {editMode && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-lock text-primary"></i>
                Cambiar Contraseña (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.newPassword && touched.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dejar en blanco para mantener la actual"
                  />
                  {errors.newPassword && touched.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirmar nueva contraseña"
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {editMode && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setErrors({});
                  setTouched({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ConfigurarPerfil;