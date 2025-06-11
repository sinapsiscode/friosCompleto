import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';

const TecnicoForm = ({ tecnico, onClose }) => {
  const { addItem, updateItem, getNextId } = useContext(DataContext);
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
    usuario: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (tecnico) {
      setFormData(tecnico);
    }
  }, [tecnico]);

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'nombre':
      case 'apellido':
        if (!value.trim()) error = 'Este campo es requerido';
        else if (value.trim().length < 2) error = 'Debe tener al menos 2 caracteres';
        break;
      case 'dni':
        if (!value) error = 'El DNI es requerido';
        else if (!/^[0-9]{8}$/.test(value)) error = 'El DNI debe tener 8 dígitos';
        break;
      case 'telefono':
        if (!value) error = 'El teléfono es requerido';
        else if (!/^[0-9+\-\s()]+$/.test(value)) error = 'Formato de teléfono inválido';
        break;
      case 'email':
        if (!value) error = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido';
        break;
      case 'usuario':
        if (!tecnico && !value) error = 'El usuario es requerido';
        else if (value && value.length < 4) error = 'Mínimo 4 caracteres';
        break;
      case 'password':
        if (!tecnico && !value) error = 'La contraseña es requerida';
        else if (value && value.length < 6) error = 'Mínimo 6 caracteres';
        break;
      case 'direccion':
        if (!value.trim()) error = 'La dirección es requerida';
        break;
      case 'distrito':
        if (!value.trim()) error = 'El distrito es requerido';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

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
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
            <i className="fas fa-user text-4xl text-gray-400"></i>
          </div>
        </div>
        
        <div className="text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="profile-image-input"
          />
          <label
            htmlFor="profile-image-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <i className="fas fa-camera"></i>
            <span className="text-sm">Cambiar foto</span>
          </label>
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
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI
          </label>
          <input
            type="text"
            name="dni"
            value={formData.dni || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
            pattern="[0-9]{8}"
            title="El DNI debe tener 8 dígitos"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especialidad
          </label>
          <select
            name="especialidad"
            value={formData.especialidad || 'general'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
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
            Años de Experiencia
          </label>
          <input
            type="number"
            name="experiencia"
            value={formData.experiencia || 0}
            onChange={handleChange}
            min="0"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
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
            placeholder="Av. Principal 123"
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
            value={formData.distrito || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.distrito && touched.distrito ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="San Isidro"
            required
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
                name="usuario"
                value={formData.usuario || ''}
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
          disabled={showSuccess}
        >
          <span>
            <i className={`fas ${tecnico ? 'fa-sync-alt' : 'fa-user-plus'} text-lg`}></i>
            <span>{tecnico ? 'Actualizar' : 'Crear'} Técnico</span>
          </span>
        </button>
      </div>
    </form>
  );
};

export default TecnicoForm;