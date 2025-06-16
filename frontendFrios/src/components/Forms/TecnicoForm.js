import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import tecnicoService from '../../services/tecnico.service';
import { showAlert } from '../../utils/sweetAlert';

const TecnicoForm = ({ tecnico, onClose, onSuccess }) => {
  const { addItem, updateItem, getNextId } = useContext(DataContext);
  const { useBackend } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    especialidad: 'general',
    dni: '',
    telefono: '',
    email: '',
    experiencia: 0,
    direccion: '',
    distrito: '',
    username: '',
    password: '',
    certificaciones: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (tecnico) {
      setFormData(tecnico);
      setOriginalData(tecnico); // Guardar datos originales para comparar
    }
  }, [tecnico]);

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'nombre':
      case 'apellido':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value?.trim()) error = 'Este campo es requerido';
        else if (value && value.trim().length < 2) error = 'Debe tener al menos 2 caracteres';
        break;
      case 'dni':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value?.trim()) error = 'El DNI es requerido';
        else if (value && !/^[0-9]{8}$/.test(value)) error = 'El DNI debe tener 8 dígitos';
        break;
      case 'telefono':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value?.trim()) error = 'El teléfono es requerido';
        else if (value && !/^[0-9+\-\s()]+$/.test(value)) error = 'Formato de teléfono inválido';
        break;
      case 'email':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value) error = 'El email es requerido';
        else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido';
        break;
      case 'especialidad':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value) error = 'La especialidad es requerida';
        break;
      case 'experiencia':
        // OBLIGATORIO para crear (puede ser 0), opcional para editar
        if (!tecnico && (value === undefined || value === null || value === '')) error = 'Los años de experiencia son requeridos';
        else if (value !== undefined && value !== null && value !== '' && (isNaN(value) || value < 0)) error = 'Debe ser un número válido mayor o igual a 0';
        break;
      case 'direccion':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value?.trim()) error = 'La dirección es requerida';
        else if (value && value.trim().length < 5) error = 'La dirección debe tener al menos 5 caracteres';
        break;
      case 'distrito':
        // OBLIGATORIO para crear, opcional para editar
        if (!tecnico && !value?.trim()) error = 'El distrito es requerido';
        else if (value && value.trim().length < 2) error = 'El distrito debe tener al menos 2 caracteres';
        break;
      case 'username':
        // OBLIGATORIO para crear, no aplica para editar
        if (!tecnico && !value) error = 'El usuario es requerido';
        else if (value && value.length < 4) error = 'Mínimo 4 caracteres';
        break;
      case 'password':
        // OBLIGATORIO para crear, no aplica para editar
        if (!tecnico && !value) error = 'La contraseña es requerida';
        else if (value && value.length < 6) error = 'Mínimo 6 caracteres';
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
      [name]: name === 'experiencia' ? parseInt(value) || 0 : value
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

  // Manejar cambio de archivo de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert('Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('El archivo es demasiado grande. Máximo 5MB', 'error');
        return;
      }
      
      setAvatarFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    console.log('🚀 === INICIO SUBMIT FRONTEND ===');
    e.preventDefault();
    
    console.log('📝 Datos del formulario:', JSON.stringify(formData, null, 2));
    console.log('📷 Archivo seleccionado:', avatarFile ? {
      name: avatarFile.name,
      size: avatarFile.size,
      type: avatarFile.type
    } : 'No hay archivo');
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Errores de validación:', newErrors);
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    console.log('✅ Validación exitosa, enviando al backend...');
    setLoading(true);

    try {
      if (useBackend) {
        console.log('🌐 Usando backend real...');
        
        let tecnicoData;
        
        if (tecnico) {
          // MODO EDICIÓN: Enviar todos los campos, backend detecta cambios
          console.log('🔄 Actualizando técnico existente - enviando todos los campos...');
          tecnicoData = {
            ...formData,
            experiencia: parseInt(formData.experiencia) || 0
          };
          console.log('📝 Enviando todos los campos al backend:', tecnicoData);
          console.log('📷 Archivo de avatar:', avatarFile ? avatarFile.name : 'Sin cambio');
        } else {
          // MODO CREACIÓN: Enviar todos los datos
          console.log('➕ Creando nuevo técnico...');
          tecnicoData = {
            ...formData,
            experiencia: parseInt(formData.experiencia) || 0
          };
        }

        console.log('🔄 Llamando al servicio tecnico...');
        let result;
        if (tecnico) {
          result = await tecnicoService.update(tecnico.id, tecnicoData, avatarFile);
        } else {
          result = await tecnicoService.create(tecnicoData, avatarFile);
        }
        console.log('📡 Respuesta del servicio:', result);

        if (result.success) {
          console.log('✅ Éxito en la creación/actualización');
          setShowSuccess(true);
          showAlert(result.message || `Técnico ${tecnico ? 'actualizado' : 'creado'} exitosamente`, 'success');
          
          if (onSuccess) {
            console.log('🔄 Llamando callback onSuccess...');
            onSuccess(result.data);
          }
          
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          console.log('❌ Error en la respuesta:', result.message);
          showAlert(result.message || 'Error al procesar la solicitud', 'error');
        }
      } else {
        // Usar DataContext (modo estático)
        const tecnicoData = {
          ...formData,
          experiencia: parseInt(formData.experiencia) || 0
        };

        if (tecnico) {
          updateItem('tecnicos', tecnico.id, tecnicoData);
        } else {
          addItem('tecnicos', {
            ...tecnicoData,
            id: getNextId('tecnicos')
          });
        }

        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('💥 ERROR EN FRONTEND:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      console.error('Error en handleSubmit:', error);
      showAlert('Error inesperado al procesar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideInRight z-50">
          <i className="fas fa-check-circle text-xl"></i>
          <span className="font-medium">Técnico {tecnico ? 'actualizado' : 'creado'} exitosamente</span>
        </div>
      )}
      
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 overflow-hidden">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            ) : tecnico?.profileImage ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:2001'}/uploads/${tecnico.profileImage}`} 
                alt={`${tecnico.nombre} ${tecnico.apellido}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('❌ Error cargando imagen:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<i class="fas fa-user text-4xl text-gray-400"></i>';
                }}
              />
            ) : (
              <i className="fas fa-user text-4xl text-gray-400"></i>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="profile-image-input"
            onChange={handleAvatarChange}
          />
          <label
            htmlFor="profile-image-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <i className="fas fa-camera"></i>
            <span className="text-sm">{avatarPreview || tecnico?.profileImage ? 'Cambiar foto' : 'Agregar foto'}</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Foto de perfil opcional (máximo 5MB)
          </p>
          {avatarFile && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Archivo seleccionado: {avatarFile.name}
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-user text-primary text-xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 m-0">Información Personal</h3>
          </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre {!tecnico && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required={!tecnico}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido {!tecnico && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required={!tecnico}
            />
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            name="dni"
            value={formData.dni || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={!tecnico}
            pattern="[0-9]{8}"
            title="El DNI debe tener 8 dígitos"
            placeholder="12345678"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={!tecnico}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={!tecnico}
            placeholder="987654321"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especialidad {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <select
            name="especialidad"
            value={formData.especialidad || 'general'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={!tecnico}
          >
            <option value="general">General</option>
            <option value="refrigeracion">Refrigeración</option>
            <option value="aire_acondicionado">Aire Acondicionado</option>
            <option value="sistemas_comerciales">Sistemas Comerciales</option>
            <option value="sistemas_industriales">Sistemas Industriales</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Años de Experiencia {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            name="experiencia"
            value={formData.experiencia || 0}
            onChange={handleChange}
            min="0"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={!tecnico}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.direccion && touched.direccion ? 'border-red-500' : 'border-gray-300'
            }`}
            required={!tecnico}
            placeholder="Av. Principal 123"
          />
          {errors.direccion && touched.direccion && (
            <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distrito {!tecnico && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            name="distrito"
            value={formData.distrito || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.distrito && touched.distrito ? 'border-red-500' : 'border-gray-300'
            }`}
            required={!tecnico}
            placeholder="San Isidro"
          />
          {errors.distrito && touched.distrito && (
            <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>
          )}
        </div>
      </div>
      </div>

      {!tecnico && (
        <div className="bg-gradient-to-br from-info/5 to-info-light/5 rounded-xl p-6 border border-info/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
              <i className="fas fa-lock text-info text-xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 m-0">Credenciales de Acceso</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
                placeholder="usuario.tecnico"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
            transition-all duration-200 flex items-center gap-2"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn-primary-enhanced group"
          disabled={showSuccess || loading}
        >
          <span>
            {loading ? (
              <i className="fas fa-spinner fa-spin text-lg"></i>
            ) : (
              <i className={`fas ${tecnico ? 'fa-sync-alt' : 'fa-user-plus'} text-lg`}></i>
            )}
            <span>
              {loading ? 'Procesando...' : `${tecnico ? 'Actualizar' : 'Crear'} Técnico`}
            </span>
          </span>
        </button>
      </div>
    </form>
  );
};

export default TecnicoForm;