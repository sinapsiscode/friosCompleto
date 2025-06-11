import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { showAlert, showConfirm } from '../../utils/sweetAlert';

const ServicioDetalleForm = ({ servicio, onClose }) => {
  const { data, updateItem, addItem, deleteItem, getNextId } = useContext(DataContext);
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
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullSearchModal, setShowFullSearchModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilter, setModalFilter] = useState('todos');
  
  // Obtener repuestos disponibles del sistema
  const repuestosDisponibles = (data.repuestos || []).filter(r => r.disponible !== false);
  
  // Filtrar repuestos según búsqueda
  const filteredRepuestos = repuestosDisponibles.filter(repuesto =>
    repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repuesto.descripcion && repuesto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filtrar repuestos para el modal
  const modalFilteredRepuestos = repuestosDisponibles.filter(repuesto => {
    const matchesSearch = repuesto.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      (repuesto.descripcion && repuesto.descripcion.toLowerCase().includes(modalSearchTerm.toLowerCase()));
    
    if (modalFilter === 'todos') return matchesSearch;
    if (modalFilter === 'seleccionados') return matchesSearch && formData.repuestosUtilizados.includes(repuesto.id);
    if (modalFilter === 'no-seleccionados') return matchesSearch && !formData.repuestosUtilizados.includes(repuesto.id);
    return matchesSearch && repuesto.categoria === modalFilter;
  });

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
  
  const handleAddNewMaterial = () => {
    if (newMaterial.trim()) {
      // Agregar el nuevo repuesto al sistema
      const newRepuesto = {
        id: Date.now(),
        nombre: newMaterial,
        descripcion: '',
        categoria: 'repuesto',
        disponible: true,
        createdAt: new Date().toISOString()
      };
      
      addItem('repuestos', newRepuesto);
      
      // Seleccionarlo automáticamente
      setFormData(prev => ({
        ...prev,
        repuestosUtilizados: [...prev.repuestosUtilizados, newRepuesto.id]
      }));
      
      setNewMaterial('');
      setShowAddMaterial(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.trabajosRealizados) {
      showAlert('Por favor describa los trabajos realizados', 'warning');
      return;
    }

    // Actualizar el servicio como completado
    updateItem('servicios', servicio.id, {
      estado: 'completado',
      fechaCompletado: new Date().toISOString(),
      fechaFinalizacion: new Date().toISOString(),
      horaFin: new Date().toISOString(),
      detalleServicio: {
        trabajosRealizados: formData.trabajosRealizados,
        repuestosUtilizados: formData.repuestosUtilizados,
        recomendaciones: formData.recomendaciones,
        proximoMantenimiento: formData.proximoMantenimiento
      },
      fotosAntes: formData.fotosAntes,
      fotosDespues: formData.fotosDespues,
      fotos: formData.fotos
    });

    // Si es un servicio programado, crear el siguiente
    if (servicio.tipo === 'programado') {
      let programacion = data.programaciones?.find(
        p => p.clienteId === servicio.clienteId && 
             p.equipos?.some(e => servicio.equipos?.includes(e))
      );
      
      // Si el técnico configuró una nueva frecuencia, actualizar la programación
      if (formData.configurarProgramacion && programacion) {
        const nuevaProgramacion = {
          ...programacion,
          frecuencia: formData.frecuenciaMantenimiento,
          tipo: formData.frecuenciaMantenimiento
        };
        updateItem('programaciones', programacion.id, nuevaProgramacion);
        programacion = nuevaProgramacion;
      }
      
      if (programacion && programacion.estado === 'activa') {
        const frecuenciaAUsar = formData.configurarProgramacion ? formData.frecuenciaMantenimiento : (programacion.frecuencia || programacion.tipo);
        const proximaFecha = calcularProximaFecha(servicio.fecha, frecuenciaAUsar, programacion);
        
        if (proximaFecha) {
          // Verificar que la próxima fecha no exceda la fecha fin de la programación
          const fechaFin = new Date(programacion.fechaFin);
          const fechaProxima = new Date(proximaFecha);
          
          if (fechaProxima <= fechaFin) {
            // Crear el nuevo servicio
            const nuevoServicio = {
              id: getNextId('servicios'),
              clienteId: servicio.clienteId,
              tecnicoId: servicio.tecnicoId,
              fecha: proximaFecha,
              hora: servicio.hora || '09:00',
              tipo: 'programado',
              estado: 'pendiente',
              descripcion: servicio.descripcion,
              equipos: servicio.equipos,
              prioridad: servicio.prioridad || 'media',
              observaciones: `Mantenimiento programado - ${programacion.frecuencia || programacion.tipo}`,
              fotos: []
            };
            
            addItem('servicios', nuevoServicio);
            
            // Informar al usuario
            showAlert(`Servicio completado exitosamente. Se ha programado el próximo mantenimiento para el ${new Date(proximaFecha).toLocaleDateString('es-ES')}`, 'success');
          } else {
            showAlert('Servicio completado exitosamente. Este fue el último servicio de la programación.', 'success');
          }
        } else {
          showAlert('Servicio completado exitosamente', 'success');
        }
      } else {
        showAlert('Servicio completado exitosamente', 'success');
      }
    } else {
      showAlert('Servicio completado exitosamente', 'success');
    }
    
    onClose();
  };

  if (!servicio) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Header minimalista */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium">SERVICIO · {new Date(servicio.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</p>
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
        {filteredRepuestos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRepuestos.slice(0, 7).map(repuesto => (
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
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{repuesto.nombre}</p>
                  {repuesto.descripcion && (
                    <p className="text-xs text-gray-500">{repuesto.descripcion}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const result = await showConfirm(
                      '¿Confirmar eliminación?',
                      `¿Eliminar "${repuesto.nombre}" de la lista de repuestos?`,
                      'Sí, eliminar',
                      'Cancelar'
                    );
                    if (result.isConfirmed) {
                      deleteItem('repuestos', repuesto.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Eliminar repuesto"
                >
                  <i className="fas fa-times"></i>
                </button>
              </label>
            ))}
            
            {/* Card de búsqueda específica */}
            <div
              onClick={() => setShowFullSearchModal(true)}
              className="flex items-center justify-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all hover:border-green-500 hover:bg-green-50 min-h-[76px]"
            >
              <i className="fas fa-search-plus text-green-600 text-lg"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">Búsqueda específica</p>
                <p className="text-xs text-gray-500">Ver todos los repuestos ({repuestosDisponibles.length})</p>
              </div>
            </div>
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Nombre del material nuevo..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleAddNewMaterial}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMaterial(false);
                  setNewMaterial('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
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
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-check"></i>
          Completar Servicio
        </button>
      </div>
      
      {/* Modal de búsqueda completa */}
      {showFullSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <i className="fas fa-search-plus text-green-600"></i>
                  Búsqueda Específica de Repuestos
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowFullSearchModal(false);
                    setModalSearchTerm('');
                    setModalFilter('todos');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-xl"></i>
                </button>
              </div>
              
              {/* Controles de búsqueda y filtro */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={modalFilter}
                  onChange={(e) => setModalFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="seleccionados">Seleccionados</option>
                  <option value="no-seleccionados">No seleccionados</option>
                  <option value="repuesto">Solo repuestos</option>
                  <option value="material">Solo materiales</option>
                </select>
              </div>
              
              {/* Contador de resultados */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {modalFilteredRepuestos.length} resultados encontrados
                </p>
                {formData.repuestosUtilizados.length > 0 && (
                  <p className="text-sm font-medium text-green-600">
                    {formData.repuestosUtilizados.length} seleccionados
                  </p>
                )}
              </div>
            </div>
            
            {/* Lista de repuestos */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalFilteredRepuestos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modalFilteredRepuestos.map(repuesto => (
                    <label
                      key={repuesto.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.repuestosUtilizados.includes(repuesto.id)
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.repuestosUtilizados.includes(repuesto.id)}
                        onChange={() => handleMaterialToggle(repuesto.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{repuesto.nombre}</p>
                        {repuesto.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{repuesto.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <i className="fas fa-tag"></i>
                            {repuesto.categoria}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <i className="fas fa-calendar"></i>
                            {new Date(repuesto.createdAt).toLocaleDateString('es')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const result = await showConfirm(
                            '¿Confirmar eliminación?',
                            `¿Eliminar "${repuesto.nombre}" de la lista de repuestos?`,
                            'Sí, eliminar',
                            'Cancelar'
                          );
                          if (result.isConfirmed) {
                            deleteItem('repuestos', repuesto.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar repuesto"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
                  <p className="text-xl text-gray-600 mb-2">No se encontraron repuestos</p>
                  <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
            
            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowAddMaterial(true)}
                  className="px-4 py-2 text-green-600 hover:text-green-700 flex items-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  Agregar nuevo repuesto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFullSearchModal(false);
                    setModalSearchTerm('');
                    setModalFilter('todos');
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ServicioDetalleForm;