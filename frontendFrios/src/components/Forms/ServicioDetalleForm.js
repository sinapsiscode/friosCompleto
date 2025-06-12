import React, { useState, useEffect } from 'react';
import { showAlert, showConfirm } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import repuestoFormularioService from '../../services/repuestoFormulario.service';

const ServicioDetalleForm = ({ servicio, onClose, onSuccess }) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    trabajosRealizados: '',
    repuestosUtilizados: [],
    recomendaciones: '',
    proximoMantenimiento: '',
    fotosAntes: [],
    fotosDespues: [],
    fotos: [],
    // Configuración para mantenimiento programado
    frecuenciaMantenimiento: 'mensual',
    configurarProgramacion: false
  });

  // Estados de carga y repuestos
  const [loading, setLoading] = useState(false);
  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [loadingRepuestos, setLoadingRepuestos] = useState(true);
  
  // Estados de UI
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    nombre: '',
    descripcion: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar repuestos disponibles al montar el componente
  useEffect(() => {
    const cargarRepuestos = async () => {
      try {
        setLoadingRepuestos(true);
        const response = await repuestoFormularioService.getAll();
        setRepuestosDisponibles(response.data || response || []);
      } catch (error) {
        console.error('Error al cargar repuestos:', error);
        showAlert('Error al cargar la lista de repuestos', 'error');
        setRepuestosDisponibles([]);
      } finally {
        setLoadingRepuestos(false);
      }
    };

    cargarRepuestos();
  }, []);

  // Filtrar repuestos según búsqueda
  const filteredRepuestos = repuestosDisponibles.filter(repuesto =>
    repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repuesto.descripcion && repuesto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialToggle = (materialId) => {
    setFormData(prev => ({
      ...prev,
      repuestosUtilizados: prev.repuestosUtilizados.includes(materialId)
        ? prev.repuestosUtilizados.filter(id => id !== materialId)
        : [...prev.repuestosUtilizados, materialId]
    }));
  };

  const handleAddNewMaterial = async () => {
    if (!newMaterial.nombre.trim()) return;

    try {
      setLoading(true);
      const nuevoRepuesto = {
        nombre: newMaterial.nombre.trim(),
        descripcion: newMaterial.descripcion.trim(),
        categoria: 'repuesto',
        disponible: true
      };

      const response = await repuestoFormularioService.create(nuevoRepuesto);
      const repuestoCreado = response.data || response;

      // Actualizar lista local
      setRepuestosDisponibles(prev => [...prev, repuestoCreado]);

      // Seleccionar automáticamente el nuevo repuesto
      setFormData(prev => ({
        ...prev,
        repuestosUtilizados: [...prev.repuestosUtilizados, repuestoCreado.id]
      }));

      setNewMaterial({ nombre: '', descripcion: '' });
      setShowAddMaterial(false);
      showAlert('Repuesto agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error al agregar repuesto:', error);
      showAlert('Error al agregar el repuesto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = (e, tipo) => {
    const files = Array.from(e.target.files);
    const reader = new FileReader();
    
    files.forEach(file => {
      reader.onload = (event) => {
        const base64 = event.target.result;
        
        if (tipo === 'antes') {
          setFormData(prev => ({
            ...prev,
            fotosAntes: [...prev.fotosAntes, { nombre: file.name, data: base64 }]
          }));
        } else if (tipo === 'despues') {
          setFormData(prev => ({
            ...prev,
            fotosDespues: [...prev.fotosDespues, { nombre: file.name, data: base64 }]
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            fotos: [...prev.fotos, { nombre: file.name, data: base64 }]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFoto = (index, tipo) => {
    if (tipo === 'antes') {
      setFormData(prev => ({
        ...prev,
        fotosAntes: prev.fotosAntes.filter((_, i) => i !== index)
      }));
    } else if (tipo === 'despues') {
      setFormData(prev => ({
        ...prev,
        fotosDespues: prev.fotosDespues.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fotos: prev.fotos.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDeleteRepuesto = async (repuestoId) => {
    try {
      const repuesto = repuestosDisponibles.find(r => r.id === repuestoId);
      const result = await showConfirm(
        '¿Confirmar eliminación?',
        `¿Eliminar "${repuesto?.nombre}" de la lista de repuestos?`,
        'Sí, eliminar',
        'Cancelar'
      );

      if (result.isConfirmed) {
        await repuestoFormularioService.delete(repuestoId);
        
        // Actualizar lista local
        setRepuestosDisponibles(prev => prev.filter(r => r.id !== repuestoId));
        
        // Remover de seleccionados si estaba seleccionado
        setFormData(prev => ({
          ...prev,
          repuestosUtilizados: prev.repuestosUtilizados.filter(id => id !== repuestoId)
        }));

        showAlert('Repuesto eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error al eliminar repuesto:', error);
      showAlert('Error al eliminar el repuesto', 'error');
    }
  };

  const calcularProximaFecha = (fechaActual, frecuencia, programacion = null) => {
    const fecha = new Date(fechaActual);
    
    switch (frecuencia) {
      case 'diario':
        fecha.setDate(fecha.getDate() + 1);
        break;
      
      case 'semanal':
        if (programacion?.diasSemana && programacion.diasSemana.length > 0) {
          // Buscar el próximo día de la semana especificado
          let diasAdelante = 1;
          let fechaTemp = new Date(fecha);
          fechaTemp.setDate(fechaTemp.getDate() + 1);
          
          while (diasAdelante <= 7) {
            const diaSemana = fechaTemp.getDay(); // 0 = Domingo, 1 = Lunes, etc.
            if (programacion.diasSemana.includes(diaSemana === 0 ? 7 : diaSemana)) {
              fecha.setDate(fecha.getDate() + diasAdelante);
              break;
            }
            fechaTemp.setDate(fechaTemp.getDate() + 1);
            diasAdelante++;
          }
          
          // Si no encontró ningún día en la semana actual, ir a la próxima semana
          if (diasAdelante > 7) {
            fecha.setDate(fecha.getDate() + 7);
          }
        } else {
          // Por defecto, agregar 7 días
          fecha.setDate(fecha.getDate() + 7);
        }
        break;
      
      case 'quincenal':
        fecha.setDate(fecha.getDate() + 14);
        break;
      
      case 'mensual':
        if (programacion?.diaMes) {
          // Establecer el día específico del próximo mes
          fecha.setMonth(fecha.getMonth() + 1);
          fecha.setDate(parseInt(programacion.diaMes));
          
          // Si el día no existe en el mes (ej: 31 de febrero), ajustar al último día del mes
          if (fecha.getDate() !== parseInt(programacion.diaMes)) {
            fecha.setDate(0); // Último día del mes anterior
          }
        } else {
          // Por defecto, agregar un mes
          fecha.setMonth(fecha.getMonth() + 1);
        }
        break;
      
      case 'bimestral':
        fecha.setMonth(fecha.getMonth() + 2);
        break;
      
      case 'trimestral':
        fecha.setMonth(fecha.getMonth() + 3);
        break;
      
      case 'semestral':
        fecha.setMonth(fecha.getMonth() + 6);
        break;
      
      case 'anual':
        fecha.setFullYear(fecha.getFullYear() + 1);
        break;
        
      case 'personalizado':
        // Para fechas personalizadas, buscar la próxima fecha en la lista
        if (programacion?.fechasEspecificas && programacion.fechasEspecificas.length > 0) {
          const fechaActualStr = new Date(fechaActual).toISOString().split('T')[0];
          const proximasFechas = programacion.fechasEspecificas
            .filter(f => f > fechaActualStr)
            .sort();
          
          if (proximasFechas.length > 0) {
            return proximasFechas[0];
          }
        }
        return null;
      
      default:
        return null;
    }
    
    return fecha.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.trabajosRealizados) {
      showAlert('Por favor describa los trabajos realizados', 'warning');
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para el backend - usando la estructura original pero enviando a la API real
      const datosCompletado = {
        trabajosRealizados: formData.trabajosRealizados,
        repuestosUtilizados: formData.repuestosUtilizados,
        recomendaciones: formData.recomendaciones,
        proximoMantenimiento: formData.proximoMantenimiento,
        fotosAntes: formData.fotosAntes,
        fotosDespues: formData.fotosDespues,
        fotos: formData.fotos,
        // Configuración de programación
        frecuenciaMantenimiento: formData.frecuenciaMantenimiento,
        configurarProgramacion: formData.configurarProgramacion
      };

      console.log('Completando servicio:', datosCompletado);

      await servicioService.completar(servicio.id, datosCompletado);

      // Lógica para servicios programados (simplificada para ahora)
      if (servicio.tipo === 'programado') {
        if (formData.configurarProgramacion) {
          const frecuenciaAUsar = formData.frecuenciaMantenimiento;
          const proximaFecha = calcularProximaFecha(servicio.fecha || servicio.fechaProgramada, frecuenciaAUsar);
          
          if (proximaFecha) {
            showAlert(`Servicio completado exitosamente. Se ha programado el próximo mantenimiento para el ${new Date(proximaFecha).toLocaleDateString('es-ES')}`, 'success');
          } else {
            showAlert('Servicio completado exitosamente', 'success');
          }
        } else {
          showAlert('Servicio completado exitosamente', 'success');
        }
      } else {
        showAlert('Servicio completado exitosamente', 'success');
      }
      
      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error al completar servicio:', error);
      showAlert(
        error.response?.data?.message || 'Error al completar el servicio', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!servicio) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium">
          SERVICIO · {new Date(servicio.fecha || servicio.fechaProgramada).toLocaleDateString('es', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }).toUpperCase()}
        </p>
      </div>

      {/* Trabajos Realizados */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-clipboard-check text-gray-400"></i>
          Trabajos Realizados
        </h3>
        <textarea
          name="trabajosRealizados"
          value={formData.trabajosRealizados}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Describa los trabajos realizados durante el servicio..."
          required
          disabled={loading}
        />
      </div>

      {/* Repuestos y Materiales */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <i className="fas fa-tools text-gray-400"></i>
            Repuestos y Materiales Utilizados
          </h3>
          <button
            type="button"
            onClick={() => setShowAddMaterial(!showAddMaterial)}
            className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            disabled={loading}
          >
            <i className="fas fa-plus"></i>
            Agregar nuevo
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar repuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading || loadingRepuestos}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Lista de repuestos */}
        {loadingRepuestos ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
            <p className="text-gray-500">Cargando repuestos...</p>
          </div>
        ) : filteredRepuestos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRepuestos.map(repuesto => (
              <label
                key={repuesto.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.repuestosUtilizados.includes(repuesto.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.repuestosUtilizados.includes(repuesto.id)}
                  onChange={() => handleMaterialToggle(repuesto.id)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{repuesto.nombre}</p>
                  {repuesto.descripcion && (
                    <p className="text-xs text-gray-500">{repuesto.descripcion}</p>
                  )}
                </div>
              </label>
            ))}

          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <i className="fas fa-wrench text-3xl text-gray-300 mb-2"></i>
            <p className="text-gray-500">No hay repuestos disponibles</p>
            <p className="text-sm text-gray-400 mt-1">Agrega uno nuevo con el botón de arriba</p>
          </div>
        )}

        {/* Agregar nuevo material */}
        {showAddMaterial && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del repuesto *
                </label>
                <input
                  type="text"
                  value={newMaterial.nombre}
                  onChange={(e) => setNewMaterial(prev => ({
                    ...prev,
                    nombre: e.target.value
                  }))}
                  placeholder="Ej: filtro de aire"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newMaterial.descripcion}
                  onChange={(e) => setNewMaterial(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))}
                  placeholder="Descripción del repuesto (opcional)..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddNewMaterial}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={loading || !newMaterial.nombre.trim()}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Agregar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMaterial(false);
                    setNewMaterial({ nombre: '', descripcion: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidencia Fotográfica */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-camera text-gray-400"></i>
          Evidencia Fotográfica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fotos Antes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Fotos ANTES del servicio
            </label>
            
            {formData.fotosAntes.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer h-48 flex flex-col items-center justify-center"
                onClick={() => document.getElementById('fotosAntes').click()}
              >
                <input
                  type="file"
                  id="fotosAntes"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFotoUpload(e, 'antes')}
                  className="hidden"
                  disabled={loading}
                />
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-600">Click para subir fotos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Primera foto grande */}
                {formData.fotosAntes[0] && (
                  <div className="relative group">
                    <img
                      src={formData.fotosAntes[0].data}
                      alt="Antes principal"
                      className="w-full h-48 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(formData.fotosAntes[0].data, '_blank')}
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => handleRemoveFoto(0, 'antes')}
                      disabled={loading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      Foto principal
                    </div>
                  </div>
                )}
                
                {/* Fotos adicionales en grid */}
                {formData.fotosAntes.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.fotosAntes.slice(1).map((foto, index) => (
                      <div key={index + 1} className="relative group">
                        <img
                          src={foto.data}
                          alt={`Antes ${index + 2}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(foto.data, '_blank')}
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={() => handleRemoveFoto(index + 1, 'antes')}
                          disabled={loading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Botón para agregar más fotos */}
                <button
                  type="button"
                  onClick={() => document.getElementById('fotosAntesAdd').click()}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                  disabled={loading}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Agregar más fotos
                </button>
                <input
                  type="file"
                  id="fotosAntesAdd"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFotoUpload(e, 'antes')}
                  className="hidden"
                  disabled={loading}
                />
              </div>
            )}
          </div>
          
          {/* Fotos Después */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Fotos DESPUÉS del servicio
            </label>
            
            {formData.fotosDespues.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer h-48 flex flex-col items-center justify-center"
                onClick={() => document.getElementById('fotosDespues').click()}
              >
                <input
                  type="file"
                  id="fotosDespues"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFotoUpload(e, 'despues')}
                  className="hidden"
                  disabled={loading}
                />
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-600">Click para subir fotos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Primera foto grande */}
                {formData.fotosDespues[0] && (
                  <div className="relative group">
                    <img
                      src={formData.fotosDespues[0].data}
                      alt="Después principal"
                      className="w-full h-48 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(formData.fotosDespues[0].data, '_blank')}
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => handleRemoveFoto(0, 'despues')}
                      disabled={loading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      Foto principal
                    </div>
                  </div>
                )}
                
                {/* Fotos adicionales en grid */}
                {formData.fotosDespues.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.fotosDespues.slice(1).map((foto, index) => (
                      <div key={index + 1} className="relative group">
                        <img
                          src={foto.data}
                          alt={`Después ${index + 2}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer"
                          onClick={() => window.open(foto.data, '_blank')}
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={() => handleRemoveFoto(index + 1, 'despues')}
                          disabled={loading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Botón para agregar más fotos */}
                <button
                  type="button"
                  onClick={() => document.getElementById('fotosDespuesAdd').click()}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                  disabled={loading}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Agregar más fotos
                </button>
                <input
                  type="file"
                  id="fotosDespuesAdd"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFotoUpload(e, 'despues')}
                  className="hidden"
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-lightbulb text-gray-400"></i>
          Recomendaciones
        </h3>
        <textarea
          name="recomendaciones"
          value={formData.recomendaciones}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Recomendaciones para el cliente (opcional)..."
          disabled={loading}
        />
      </div>

      {/* Próximo Mantenimiento */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-calendar-alt text-gray-400"></i>
          Próximo Mantenimiento
        </h3>
        
        {/* Mostrar configuración especial si es servicio programado */}
        {servicio.tipo === 'programado' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-sync-alt text-blue-600"></i>
              <h4 className="font-medium text-blue-900">Configuración de Mantenimiento Programado</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.configurarProgramacion}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      configurarProgramacion: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Configurar frecuencia para próximos mantenimientos
                  </span>
                </label>
              </div>
              
              {formData.configurarProgramacion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia del mantenimiento programado
                  </label>
                  <select
                    value={formData.frecuenciaMantenimiento}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frecuenciaMantenimiento: e.target.value
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Esta configuración se aplicará para generar automáticamente los próximos mantenimientos
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <input
          type="date"
          name="proximoMantenimiento"
          value={formData.proximoMantenimiento}
          onChange={handleChange}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Completando...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i>
              Completar Servicio
            </>
          )}
        </button>
      </div>

    </form>
  );
};

export default ServicioDetalleForm;