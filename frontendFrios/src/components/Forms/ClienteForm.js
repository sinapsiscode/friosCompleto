import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import clienteService from '../../services/cliente.service';
import { showAlert } from '../../utils/sweetAlert';

const ClienteForm = ({ cliente, onClose, onSuccess }) => {
  const { addItem, updateItem, getNextId } = useContext(DataContext);
  const { useBackend } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Ubicaciones predefinidas para empresas
  const ubicacionesDisponibles = [
    {
      nombre: 'Lima',
      direccion: '09 asentamiento humano Simón Bolívar mz f-1',
      telefono: '901 93 63 15',
      ciudad: 'Lima, Lima',
      distrito: 'San Juan de Lurigancho'
    },
    {
      nombre: 'Rimac',
      direccion: '09 asentamiento humano Simón Bolívar mz f-1',
      telefono: '901 93 63 15',
      ciudad: 'Lima, Lima',
      distrito: 'Miraflores'
    },
    {
      nombre: 'Norte',
      direccion: 'Av. Universitaria 1801',
      telefono: '901 93 63 15',
      ciudad: 'Lima, Lima',
      distrito: 'Los Olivos'
    }
  ];
  
  const [formData, setFormData] = useState({
    tipo: 'persona',
    // Empresa
    razonSocial: '',
    ruc: '',
    sector: 'alimentacion',
    // Personal
    nombre: '',
    apellido: '',
    dni: '',
    // Comunes
    email: '',
    telefono: '',
    direccion: '',
    ciudad: 'Lima',
    distrito: '',
    usuario: '',
    password: '',
    equipos: []
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (cliente) {
      const clienteData = {
        ...cliente,
        ciudad: cliente.ciudad || 'Lima',
        distrito: cliente.distrito || ''
      };
      setFormData(clienteData);
      setOriginalData(clienteData); // Guardar datos originales para comparar
      
      // Si el cliente tiene una imagen, no necesitamos preview ya que se mostrará la imagen actual
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [cliente]);

  // Función de validación
  const validateField = (name, value) => {
    let error = '';
    
    // Solo validar si estamos creando (no editando)
    if (cliente) return error; // Si estamos editando, no validar
    
    switch(name) {
      case 'nombre':
      case 'apellido':
        if (!value?.trim()) error = 'Este campo es requerido';
        else if (value.trim().length < 2) error = 'Debe tener al menos 2 caracteres';
        break;
      case 'dni':
        if (formData.tipo === 'persona') {
          if (!value?.trim()) error = 'El DNI es requerido';
          else if (!/^[0-9]{8}$/.test(value)) error = 'El DNI debe tener 8 dígitos';
        }
        break;
      case 'telefono':
        if (!value?.trim()) error = 'El teléfono es requerido';
        else if (!/^[0-9+\-\s()]+$/.test(value)) error = 'Formato de teléfono inválido';
        break;
      case 'email':
        if (!value?.trim()) error = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido';
        break;
      case 'direccion':
        if (!value?.trim()) error = 'La dirección es requerida';
        break;
      case 'distrito':
        if (!value?.trim()) error = 'El distrito es requerido';
        break;
      case 'razonSocial':
        if (formData.tipo === 'empresa' && !value?.trim()) error = 'La razón social es requerida';
        break;
      case 'ruc':
        if (formData.tipo === 'empresa') {
          if (!value?.trim()) error = 'El RUC es requerido';
          else if (!/^[0-9]{11}$/.test(value)) error = 'El RUC debe tener 11 dígitos';
        }
        break;
      case 'username':
        if (!value?.trim()) error = 'El usuario es requerido';
        else if (value.length < 4) error = 'Mínimo 4 caracteres';
        break;
      case 'password':
        if (!value?.trim()) error = 'La contraseña es requerida';
        else if (value.length < 6) error = 'Mínimo 6 caracteres';
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
    console.log('🚀 === INICIO SUBMIT CLIENTE FRONTEND ===');
    e.preventDefault();
    console.log('📝 Datos del formulario:', JSON.stringify(formData, null, 2));
    console.log('📷 Archivo seleccionado:', avatarFile ? {
      name: avatarFile.name,
      size: avatarFile.size,
      type: avatarFile.type
    } : 'No hay archivo');
    
    // Validar todos los campos si estamos creando
    if (!cliente) {
      const errors = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key]);
        if (error) errors[key] = error;
      });
      
      if (Object.keys(errors).length > 0) {
        console.log('❌ Errores de validación:', errors);
        // Mostrar primer error encontrado
        const firstError = Object.values(errors)[0];
        showAlert(firstError, 'error');
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    try {
      if (useBackend) {
        console.log('🌐 Usando backend real...');
        
        let clienteData;
        
        if (cliente) {
          // MODO EDICIÓN: Solo enviar campos que han cambiado
          console.log('🔄 Actualizando cliente existente - solo campos modificados...');
          clienteData = {};
          
          // Comparar cada campo y solo incluir los que han cambiado
          Object.keys(formData).forEach(key => {
            // Excluir campos que no queremos actualizar en edición
            if (key === 'equipos' || key === 'id') return;
            
            const newValue = formData[key] || '';
            const originalValue = originalData[key] || '';
            if (newValue !== originalValue) {
              clienteData[key] = newValue;
              console.log(`🔄 Campo modificado: ${key} = "${originalValue}" -> "${newValue}"`);
            }
          });
          
          console.log('📝 Solo enviando campos modificados:', clienteData);
          console.log('📷 Archivo de avatar:', avatarFile ? avatarFile.name : 'Sin cambio');
        } else {
          // MODO CREACIÓN: Enviar todos los datos
          console.log('➕ Creando nuevo cliente...');
          clienteData = {
            ...formData,
            username: formData.username || formData.email.split('@')[0], // Generar username si no existe
            password: formData.password || '123456' // Contraseña por defecto si no se proporciona
          };
        }
        
        let result;
        if (cliente) {
          result = await clienteService.update(cliente.id, clienteData, avatarFile);
        } else {
          result = await clienteService.create(clienteData, avatarFile);
        }
        console.log('📡 Respuesta del servicio:', result);
        
        if (result.success) {
          console.log('✅ Éxito en la creación/actualización');
          setShowSuccess(true);
          showAlert(result.message || `Cliente ${cliente ? 'actualizado' : 'creado'} exitosamente`, 'success');
          
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
        const clienteData = {
          ...formData,
          equipos: cliente ? formData.equipos : []
        };

        if (cliente) {
          updateItem('clientes', cliente.id, clienteData);
        } else {
          addItem('clientes', {
            ...clienteData,
            id: getNextId('clientes')
          });
        }

        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('💥 ERROR EN FRONTEND:', error);
      showAlert('Error al procesar la solicitud', 'error');
    } finally {
      setLoading(false);
    }
    console.log('🏁 === FIN SUBMIT CLIENTE ===');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideInRight z-50">
          <i className="fas fa-check-circle text-xl"></i>
          <span className="font-medium">Cliente {cliente ? 'actualizado' : 'creado'} exitosamente</span>
        </div>
      )}
      
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 overflow-hidden">
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Vista previa" 
                className="w-full h-full object-cover"
              />
            ) : cliente?.profileImage ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:2001'}/uploads/${cliente.profileImage}`} 
                alt="Foto actual" 
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
            id="profile-image-input-cliente"
            onChange={handleAvatarChange}
          />
          <label
            htmlFor="profile-image-input-cliente"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <i className="fas fa-camera"></i>
            <span className="text-sm">{avatarPreview || cliente?.profileImage ? 'Cambiar foto' : 'Agregar foto'}</span>
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
        {/* Tipo de cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Cliente
          </label>
          <select
            name="tipo"
            value={formData.tipo || 'persona'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="persona">Persona Natural</option>
            <option value="empresa">Empresa</option>
          </select>
        </div>

        {formData.tipo === 'empresa' ? (
          <>
            {/* Información básica de la empresa */}
            <div className="bg-gradient-to-br from-primary/5 to-primary-light/5 rounded-xl p-6 border border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-building text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 m-0">Información de la Empresa</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="Ej: Mi Empresa S.A.C."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="ruc"
                    value={formData.ruc || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    pattern="[0-9]{11}"
                    title="El RUC debe tener 11 dígitos"
                    placeholder="12345678901"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Corporativo {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Principal *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                    placeholder="01-1234567"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sector
                  </label>
                  <select
                    name="sector"
                    value={formData.sector || 'alimentacion'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="alimentacion">Alimentación</option>
                    <option value="salud">Salud</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="educacion">Educación</option>
                    <option value="hoteleria">Hotelería</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dirección de la empresa */}
            <div className="bg-gradient-to-br from-secondary/5 to-secondary-light/5 rounded-xl p-6 border border-secondary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-map-marked-alt text-secondary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 m-0">Ubicación de la Empresa</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccione la ubicación *
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedOption = e.target.value;
                      if (selectedOption) {
                        const [direccion, distrito] = selectedOption.split('|');
                        setFormData(prev => ({
                          ...prev,
                          direccion: direccion,
                          distrito: distrito,
                          ciudad: 'Lima'
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                    value={formData.direccion && formData.distrito ? `${formData.direccion}|${formData.distrito}` : ''}
                  >
                    <option value="">Seleccione una ubicación</option>
                    <option value="Av. Javier Prado Este 2875|San Borja">Av. Javier Prado Este 2875 - San Borja</option>
                    <option value="Av. Larco 1301|Miraflores">Av. Larco 1301 - Miraflores</option>
                    <option value="Av. Primavera 2390|Santiago de Surco">Av. Primavera 2390 - Santiago de Surco</option>
                    <option value="Av. Salaverry 3100|San Isidro">Av. Salaverry 3100 - San Isidro</option>
                    <option value="Av. La Marina 2000|San Miguel">Av. La Marina 2000 - San Miguel</option>
                    <option value="Av. Universitaria 1801|Los Olivos">Av. Universitaria 1801 - Los Olivos</option>
                    <option value="Av. Brasil 2600|Jesús María">Av. Brasil 2600 - Jesús María</option>
                    <option value="Av. Angamos Este 2520|Surquillo">Av. Angamos Este 2520 - Surquillo</option>
                    <option value="Av. Benavides 5440|Santiago de Surco">Av. Benavides 5440 - Santiago de Surco</option>
                    <option value="Av. Arequipa 2450|Lince">Av. Arequipa 2450 - Lince</option>
                  </select>
                </div>
                
                {formData.direccion && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
                      <p className="text-gray-800">{formData.direccion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Distrito</label>
                      <p className="text-gray-800">{formData.distrito}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                      <p className="text-gray-800">{formData.ciudad || 'Lima'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Formulario simplificado para persona natural */}
            <div className="bg-gradient-to-br from-info/5 to-info-light/5 rounded-xl p-6 border border-info/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-user text-info text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 m-0">Información Personal</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    pattern="[0-9]{8}"
                    title="El DNI debe tener 8 dígitos"
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="987654321"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="juan.perez@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="Av. Principal 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distrito {!cliente && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="distrito"
                    value={formData.distrito || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required={!cliente}
                    placeholder="Miraflores"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad || 'Lima'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Lima"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {!cliente && (
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
                  name="usuario"
                  value={formData.usuario || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                  placeholder="usuario.cliente"
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
      </div>

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
          disabled={showSuccess}
        >
          <span>
            <i className={`fas ${cliente ? 'fa-sync-alt' : 'fa-user-plus'} text-lg`}></i>
            <span>{cliente ? 'Actualizar' : 'Crear'} Cliente</span>
          </span>
        </button>
      </div>
    </form>
  );
};

export default ClienteForm;