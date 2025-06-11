import React, { useState, useEffect } from 'react';
import equipoService from '../../services/equipo.service';
import { showAlert } from '../../utils/sweetAlert';

const EquipoForm = ({ equipo, clienteId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    capacidad: '',
    ubicacion: '',
    descripcion: '',
    estadoOperativo: 'operativo',
    fechaInstalacion: '',
    nombre: ''
  });
  const [imagenEquipo, setImagenEquipo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (equipo) {
      setFormData({
        tipo: equipo.tipo || '',
        marca: equipo.marca || '',
        modelo: equipo.modelo || '',
        numeroSerie: equipo.numeroSerie || '',
        fechaCompra: equipo.fechaCompra ? equipo.fechaCompra.split('T')[0] : new Date().toISOString().split('T')[0],
        capacidad: equipo.capacidad || '',
        ubicacion: equipo.ubicacion || '',
        descripcion: equipo.descripcion || '',
        estadoOperativo: equipo.estadoOperativo || 'operativo',
        fechaInstalacion: equipo.fechaInstalacion ? equipo.fechaInstalacion.split('T')[0] : '',
        nombre: equipo.nombre || ''
      });
      if (equipo.imagenEquipo) {
        setPreviewImage(`${process.env.REACT_APP_API_URL || 'http://localhost:2001'}/uploads/${equipo.imagenEquipo}`);
      }
    }
  }, [equipo]);

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'tipo':
        if (!value) error = 'El tipo de equipo es requerido';
        break;
      case 'marca':
        if (!value.trim()) error = 'La marca es requerida';
        break;
      case 'modelo':
        if (!value.trim()) error = 'El modelo es requerido';
        break;
      case 'ubicacion':
        if (!value.trim()) error = 'La ubicación es requerida';
        break;
      case 'numeroSerie':
        if (value && value.trim().length < 3) error = 'El número de serie debe tener al menos 3 caracteres';
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen no puede superar los 5MB', 'error');
        return;
      }
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('Solo se permiten archivos JPG, PNG, GIF o WebP', 'error');
        return;
      }
      
      setImagenEquipo(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Verificar que tenemos un clienteId válido
    const clienteIdToUse = equipo ? equipo.clienteId : clienteId;
    if (!clienteIdToUse || isNaN(parseInt(clienteIdToUse))) {
      showAlert('Error: No se ha seleccionado un cliente válido', 'error');
      return;
    }
    
    // Validate all fields
    const newErrors = {};
    ['tipo', 'marca', 'modelo', 'ubicacion'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(['tipo', 'marca', 'modelo', 'ubicacion'].reduce((acc, field) => ({ ...acc, [field]: true }), {}));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const equipoData = {
        ...formData,
        clienteId: parseInt(clienteIdToUse),
        fechaInstalacion: formData.fechaInstalacion || new Date().toISOString().split('T')[0]
      };
      
      // Agregar imagen si se seleccionó una
      if (imagenEquipo) {
        equipoData.imagenEquipo = imagenEquipo;
      }

      let result;
      if (equipo) {
        result = await equipoService.update(equipo.id, equipoData);
        showAlert('Equipo actualizado exitosamente', 'success');
      } else {
        result = await equipoService.create(equipoData);
        showAlert('Equipo registrado exitosamente', 'success');
      }
      
      // Llamar callback si existe
      if (onSave) {
        onSave(result.data);
      }
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      
      let errorMessage = 'Error al guardar el equipo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      operativo: 'green',
      mantenimiento: 'yellow',
      reparacion: 'red',
      inactivo: 'gray'
    };
    return colors[estado] || 'gray';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-xl p-6 border border-blue-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-cogs text-blue-500 text-xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 m-0">Información del Equipo</h3>
        </div>
        
        <div className="form-field-enhanced">
          <label htmlFor="tipo" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-snowflake text-blue-500/60"></i>
            Tipo de Equipo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select 
              id="tipo"
              name="tipo" 
              value={formData.tipo} 
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white appearance-none cursor-pointer
                ${errors.tipo && touched.tipo 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} 
                focus:outline-none focus:ring-4`}
            >
              <option value="">Seleccione tipo</option>
              <option value="refrigeradora">Refrigeradora</option>
              <option value="congeladora">Congeladora</option>
              <option value="frigobar">Frigobar</option>
              <option value="camara">Cámara frigorífica</option>
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            {errors.tipo && touched.tipo && (
              <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center gap-1">
                <i className="fas fa-exclamation-circle"></i>
                {errors.tipo}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-field-enhanced">
            <label htmlFor="marca" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-tag text-blue-500/60"></i>
              Marca <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white
                  ${errors.marca && touched.marca 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} 
                  focus:outline-none focus:ring-4`}
                placeholder="Ej: Samsung, LG, Whirlpool"
              />
              {errors.marca && touched.marca && (
                <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.marca}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-field-enhanced">
            <label htmlFor="modelo" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-barcode text-blue-500/60"></i>
              Modelo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white
                  ${errors.modelo && touched.modelo 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} 
                  focus:outline-none focus:ring-4`}
                placeholder="Ej: RT38K5930S8"
              />
              {errors.modelo && touched.modelo && (
                <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.modelo}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="form-field-enhanced">
            <label htmlFor="numeroSerie" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-fingerprint text-blue-500/60"></i>
              Número de Serie
            </label>
            <div className="relative">
              <input 
                type="text"
                id="numeroSerie"
                name="numeroSerie"
                value={formData.numeroSerie}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white
                  ${errors.numeroSerie && touched.numeroSerie 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} 
                  focus:outline-none focus:ring-4`}
                placeholder="Ej: SN123456789"
              />
              {errors.numeroSerie && touched.numeroSerie && (
                <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.numeroSerie}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-field-enhanced">
            <label htmlFor="fechaCompra" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-calendar-alt text-blue-500/60"></i>
              Fecha de Compra
            </label>
            <input 
              type="date"
              id="fechaCompra"
              name="fechaCompra"
              value={formData.fechaCompra}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 
                focus:outline-none focus:ring-4 transition-all duration-200 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-xl p-6 border border-purple-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-info-circle text-purple-500 text-xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 m-0">Características y Estado</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-field-enhanced">
            <label htmlFor="capacidad" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-box text-purple-500/60"></i>
              Capacidad
            </label>
            <input 
              type="text"
              id="capacidad"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 
                focus:outline-none focus:ring-4 transition-all duration-200 bg-white"
              placeholder="Ej: 400 litros, 15 pies cúbicos"
            />
          </div>
          
          <div className="form-field-enhanced">
            <label htmlFor="estadoOperativo" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-heartbeat text-purple-500/60"></i>
              Estado Operativo
            </label>
            <div className="relative">
              <select 
                id="estadoOperativo"
                name="estadoOperativo" 
                value={formData.estadoOperativo} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 
                  focus:outline-none focus:ring-4 transition-all duration-200 bg-white appearance-none cursor-pointer"
              >
                <option value="operativo">Operativo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="reparacion">En Reparación</option>
                <option value="inactivo">Inactivo</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              <div className={`absolute right-12 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-${getEstadoColor(formData.estadoOperativo)}-500`}></div>
            </div>
          </div>
        </div>

        <div className="form-field-enhanced">
          <label htmlFor="ubicacion" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-map-marker-alt text-purple-500/60"></i>
            Ubicación <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input 
              type="text"
              id="ubicacion"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white
                ${errors.ubicacion && touched.ubicacion 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500/20'} 
                focus:outline-none focus:ring-4`}
              placeholder="Ej: Cocina principal, Almacén 2do piso"
            />
            {errors.ubicacion && touched.ubicacion && (
              <div className="absolute -bottom-5 left-0 text-red-500 text-xs flex items-center gap-1">
                <i className="fas fa-exclamation-circle"></i>
                {errors.ubicacion}
              </div>
            )}
          </div>
        </div>

        <div className="form-field-enhanced">
          <label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <i className="fas fa-align-left text-purple-500/60"></i>
            Descripción / Características
          </label>
          <textarea 
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 
              focus:outline-none focus:ring-4 transition-all duration-200 bg-white resize-none"
            placeholder="Agregue detalles adicionales del equipo..."
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 rounded-xl p-6 border border-indigo-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-camera text-indigo-500 text-xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 m-0">Imagen del Equipo</h3>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-image text-4xl text-gray-400"></i>
            )}
          </div>
          <div>
            <input 
              type="file"
              id="imagenEquipo"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 
                transition-all duration-200 flex items-center gap-2"
              onClick={() => document.getElementById('imagenEquipo').click()}
            >
              <i className="fas fa-upload"></i>
              {previewImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </button>
            <p className="text-sm text-gray-500 mt-2">Formatos: JPG, PNG, GIF, WebP. Máx: 5MB</p>
          </div>
        </div>
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
          disabled={isSubmitting}
        >
          <span>
            <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : equipo ? 'fa-sync-alt' : 'fa-save'} text-lg`}></i>
            <span>
              {isSubmitting ? 'Guardando...' : equipo ? 'Actualizar' : 'Guardar'} Equipo
            </span>
          </span>
        </button>
      </div>
    </form>
  );
};

export default EquipoForm;