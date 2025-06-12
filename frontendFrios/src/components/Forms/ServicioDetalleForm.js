import React, { useState, useEffect } from 'react';
import { showAlert, showConfirm } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import repuestoFormularioService from '../../services/repuestoFormulario.service';

const ServicioDetalleForm = ({ servicio, onClose, onSuccess }) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    observacionesFinales: '',
    evaluacion: '',
    repuestosUsados: [],
    tiempoEmpleado: '',
    fotos: []
  });

  // Estados de carga y repuestos
  const [loading, setLoading] = useState(false);
  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [loadingRepuestos, setLoadingRepuestos] = useState(true);
  
  // Estados de UI
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullSearchModal, setShowFullSearchModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilter, setModalFilter] = useState('todos');

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

  // Filtrar repuestos para el modal
  const modalFilteredRepuestos = repuestosDisponibles.filter(repuesto => {
    const matchesSearch = repuesto.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      (repuesto.descripcion && repuesto.descripcion.toLowerCase().includes(modalSearchTerm.toLowerCase()));
    
    if (modalFilter === 'todos') return matchesSearch;
    if (modalFilter === 'seleccionados') return matchesSearch && formData.repuestosUsados.includes(repuesto.id);
    if (modalFilter === 'no-seleccionados') return matchesSearch && !formData.repuestosUsados.includes(repuesto.id);
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
      repuestosUsados: prev.repuestosUsados.includes(materialId)
        ? prev.repuestosUsados.filter(id => id !== materialId)
        : [...prev.repuestosUsados, materialId]
    }));
  };

  const handleAddNewMaterial = async () => {
    if (!newMaterial.trim()) return;

    try {
      setLoading(true);
      const nuevoRepuesto = {
        nombre: newMaterial.trim(),
        descripcion: '',
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
        repuestosUsados: [...prev.repuestosUsados, repuestoCreado.id]
      }));

      setNewMaterial('');
      setShowAddMaterial(false);
      showAlert('Repuesto agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error al agregar repuesto:', error);
      showAlert('Error al agregar el repuesto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`, 'warning');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert(`El archivo ${file.name} no es una imagen válida.`, 'warning');
        return;
      }

      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, file]
      }));
    });
  };

  const handleRemoveFoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
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
          repuestosUsados: prev.repuestosUsados.filter(id => id !== repuestoId)
        }));

        showAlert('Repuesto eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error al eliminar repuesto:', error);
      showAlert('Error al eliminar el repuesto', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.observacionesFinales.trim()) {
      showAlert('Por favor ingrese las observaciones finales del servicio', 'warning');
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para el backend
      const datosCompletado = {
        observacionesFinales: formData.observacionesFinales,
        evaluacion: formData.evaluacion || null,
        repuestosUsados: formData.repuestosUsados,
        tiempoEmpleado: formData.tiempoEmpleado || null,
        fotos: formData.fotos
      };

      console.log('Completando servicio:', datosCompletado);

      await servicioService.completar(servicio.id, datosCompletado);

      showAlert('Servicio completado exitosamente', 'success');
      
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

      {/* Observaciones Finales */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-clipboard-check text-gray-400"></i>
          Observaciones Finales *
        </h3>
        <textarea
          name="observacionesFinales"
          value={formData.observacionesFinales}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Describa los trabajos realizados, estado final del equipo, y cualquier observación importante..."
          required
          disabled={loading}
        />
      </div>

      {/* Evaluación del Servicio */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-star text-gray-400"></i>
          Evaluación del Servicio
        </h3>
        <select
          name="evaluacion"
          value={formData.evaluacion}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          disabled={loading}
        >
          <option value="">Seleccionar evaluación (opcional)</option>
          <option value="EXCELENTE">Excelente</option>
          <option value="BUENO">Bueno</option>
          <option value="REGULAR">Regular</option>
          <option value="MALO">Malo</option>
        </select>
      </div>

      {/* Tiempo Empleado */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-clock text-gray-400"></i>
          Tiempo Empleado
        </h3>
        <input
          type="text"
          name="tiempoEmpleado"
          value={formData.tiempoEmpleado}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Ej: 2 horas, 3.5 horas, 1 día..."
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
            {filteredRepuestos.slice(0, 7).map(repuesto => (
              <label
                key={repuesto.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.repuestosUsados.includes(repuesto.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.repuestosUsados.includes(repuesto.id)}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteRepuesto(repuesto.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Eliminar repuesto"
                  disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddNewMaterial}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading || !newMaterial.trim()}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMaterial(false);
                  setNewMaterial('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
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

        {formData.fotos.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer h-48 flex flex-col items-center justify-center"
            onClick={() => document.getElementById('fotos').click()}
          >
            <input
              type="file"
              id="fotos"
              accept="image/*"
              multiple
              onChange={handleFotoUpload}
              className="hidden"
              disabled={loading}
            />
            <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600">Click para subir fotos</p>
            <p className="text-xs text-gray-500 mt-1">Máximo 5MB por archivo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primera foto grande */}
            {formData.fotos[0] && (
              <div className="relative group">
                <img
                  src={URL.createObjectURL(formData.fotos[0])}
                  alt="Evidencia principal"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  onClick={() => handleRemoveFoto(0)}
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
            {formData.fotos.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.fotos.slice(1).map((foto, index) => (
                  <div key={index + 1} className="relative group">
                    <img
                      src={URL.createObjectURL(foto)}
                      alt={`Evidencia ${index + 2}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      onClick={() => handleRemoveFoto(index + 1)}
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
              onClick={() => document.getElementById('fotosAdd').click()}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
              disabled={loading}
            >
              <i className="fas fa-plus mr-2"></i>
              Agregar más fotos
            </button>
            <input
              type="file"
              id="fotosAdd"
              accept="image/*"
              multiple
              onChange={handleFotoUpload}
              className="hidden"
              disabled={loading}
            />
          </div>
        )}
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
                  disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <select
                  value={modalFilter}
                  onChange={(e) => setModalFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
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
                {formData.repuestosUsados.length > 0 && (
                  <p className="text-sm font-medium text-green-600">
                    {formData.repuestosUsados.length} seleccionados
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
                        formData.repuestosUsados.includes(repuesto.id)
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.repuestosUsados.includes(repuesto.id)}
                        onChange={() => handleMaterialToggle(repuesto.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        disabled={loading}
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
                          {repuesto.createdAt && (
                            <span className="inline-flex items-center gap-1">
                              <i className="fas fa-calendar"></i>
                              {new Date(repuesto.createdAt).toLocaleDateString('es')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteRepuesto(repuesto.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar repuesto"
                        disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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