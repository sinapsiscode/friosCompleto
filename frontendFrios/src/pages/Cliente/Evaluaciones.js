import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import { showAlert } from '../../utils/sweetAlert';
import evaluacionService from '../../services/evaluacion.service';

const Evaluaciones = () => {
  const { data, updateItem } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [clienteActual, setClienteActual] = useState(null);
  const [serviciosPendientesEvaluacion, setServiciosPendientesEvaluacion] = useState([]);
  const [serviciosEvaluados, setServiciosEvaluados] = useState([]);
  const [showEvaluacionModal, setShowEvaluacionModal] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState({
    calificacion: 0,
    comentario: ''
  });

  // Cargar servicios para evaluar desde el backend
  useEffect(() => {
    cargarServiciosParaEvaluar();
  }, []);

  const cargarServiciosParaEvaluar = async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando servicios para evaluar...');
      
      const response = await evaluacionService.obtenerMisServicios();
      
      if (response.success) {
        setServiciosPendientesEvaluacion(response.data.pendientes || []);
        setServiciosEvaluados(response.data.evaluados || []);
        console.log('✅ Servicios cargados:', response.data);
      } else {
        console.error('❌ Error en respuesta:', response.message);
        showAlert('Error al cargar servicios', 'error');
      }
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
      showAlert('Error al cargar servicios para evaluar', 'error');
      
      // Fallback a datos locales si falla la API
      const cliente = data.clientes.find(c => c.usuario === user.username);
      if (cliente) {
        const misServicios = data.servicios.filter(s => s.clienteId === cliente.id);
        const pendientes = misServicios.filter(s => s.estado === 'completado' && !s.evaluacion);
        const evaluados = misServicios.filter(s => s.estado === 'completado' && s.evaluacion);
        
        setServiciosPendientesEvaluacion(pendientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
        setServiciosEvaluados(evaluados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluacion = (servicio) => {
    setServicioSeleccionado(servicio);
    setEvaluacion({ calificacion: 0, comentario: '' });
    setShowEvaluacionModal(true);
  };

  const handleSubmitEvaluacion = async () => {
    if (evaluacion.calificacion === 0) {
      showAlert('Por favor seleccione una calificación', 'warning');
      return;
    }

    try {
      console.log('⭐ Enviando evaluación:', {
        servicioId: servicioSeleccionado.id,
        calificacion: evaluacion.calificacion,
        comentario: evaluacion.comentario
      });

      const response = await evaluacionService.evaluarServicio(servicioSeleccionado.id, {
        calificacion: evaluacion.calificacion,
        comentario: evaluacion.comentario
      });

      if (response.success) {
        showAlert('Evaluación enviada exitosamente', 'success');
        
        // Recargar los servicios para actualizar las listas
        await cargarServiciosParaEvaluar();
        
        setShowEvaluacionModal(false);
        setServicioSeleccionado(null);
        setEvaluacion({ calificacion: 0, comentario: '' });
      } else {
        showAlert(response.message || 'Error al enviar evaluación', 'error');
      }
    } catch (error) {
      console.error('❌ Error al enviar evaluación:', error);
      const mensaje = error.response?.data?.message || 'Error al enviar evaluación';
      showAlert(mensaje, 'error');
      
      // Fallback al método anterior si falla la API
      updateItem('servicios', servicioSeleccionado.id, {
        evaluacion: {
          calificacion: evaluacion.calificacion,
          comentario: evaluacion.comentario,
          fecha: new Date().toISOString().split('T')[0]
        }
      });
      
      setShowEvaluacionModal(false);
      setServicioSeleccionado(null);
      setEvaluacion({ calificacion: 0, comentario: '' });
      showAlert('Evaluación guardada localmente', 'info');
    }
  };

  const renderStars = (rating, clickable = false, onRate = null, size = 'normal') => {
    const sizeClass = size === 'small' ? 'text-base' : 'text-2xl';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => clickable && onRate && onRate(star)}
            disabled={!clickable}
            className={`${sizeClass} transition-colors ${
              clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    );
  };

  // Mostrar loading mientras cargan los datos
  if (loading) {
    return (
      <div className="w-full min-h-screen p-4 lg:p-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 lg:p-10 rounded-xl lg:rounded-3xl mb-6 shadow-lg">
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-4xl font-bold m-0 flex items-center gap-2 lg:gap-4">
              <i className="fas fa-star text-xl lg:text-3xl opacity-90"></i>
              Evaluaciones de Servicios
            </h1>
            <p className="text-sm lg:text-lg mt-2 opacity-90">
              Evalúa los servicios completados y ayuda a mejorar nuestro servicio
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-lg text-gray-600">Cargando servicios para evaluar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 lg:p-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 lg:p-10 rounded-xl lg:rounded-3xl mb-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-4xl font-bold m-0 flex items-center gap-2 lg:gap-4">
            <i className="fas fa-star text-xl lg:text-3xl opacity-90"></i>
            Evaluaciones de Servicios
          </h1>
          <p className="text-sm lg:text-lg mt-2 opacity-90">
            Evalúa los servicios completados y ayuda a mejorar nuestro servicio
          </p>
        </div>
      </div>

      {/* Servicios pendientes de evaluación */}
      {serviciosPendientesEvaluacion.length > 0 && (
        <div className="bg-white rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-clock text-warning"></i>
              Servicios Pendientes de Evaluación
            </h2>
            <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-sm font-medium">
              {serviciosPendientesEvaluacion.length} pendiente{serviciosPendientesEvaluacion.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviciosPendientesEvaluacion.map(servicio => {
              const tecnico = data.tecnicos.find(t => t.id === servicio.tecnicoId);
              const equipos = data.equipos.filter(e => servicio.equipos?.includes(e.id));
              
              return (
                <div key={servicio.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors hover:shadow-md">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">#{servicio.numeroOrden || servicio.id}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          servicio.tipoServicio === 'programado' ? 'bg-blue-100 text-blue-700' : 
                          servicio.tipoServicio === 'Correctivo' ? 'bg-orange-100 text-orange-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {servicio.tipoServicio || 'Servicio'}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{servicio.descripcion}</h3>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar-check text-xs text-green-600"></i>
                          <span className="truncate">Completado: {new Date(servicio.fechaCompletado || servicio.fechaProgramada).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user-cog text-xs text-blue-600"></i>
                          <span className="truncate">{tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin técnico asignado'}</span>
                        </div>
                        {servicio.observaciones && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-comment-dots text-xs text-gray-500 mt-0.5"></i>
                            <span className="text-xs italic line-clamp-2">{servicio.observaciones}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEvaluacion(servicio)}
                      className="w-full mt-4 bg-primary text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center justify-center gap-2 text-sm"
                    >
                      <i className="fas fa-star"></i>
                      Evaluar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Servicios evaluados */}
      {serviciosEvaluados.length > 0 && (
        <div className="bg-white rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-check-circle text-success"></i>
              Servicios Evaluados
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviciosEvaluados.map(servicio => {
              const tecnico = data.tecnicos.find(t => t.id === servicio.tecnicoId);
              const equipos = data.equipos.filter(e => servicio.equipos?.includes(e.id));
              
              return (
                <div key={servicio.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">#{servicio.numeroOrden || servicio.id}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          servicio.tipoServicio === 'programado' ? 'bg-blue-100 text-blue-700' : 
                          servicio.tipoServicio === 'Correctivo' ? 'bg-orange-100 text-orange-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {servicio.tipoServicio || 'Servicio'}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{servicio.descripcion}</h3>
                      <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar-check text-xs text-green-600"></i>
                          <span className="truncate">Completado: {new Date(servicio.fechaCompletado || servicio.fechaProgramada).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user-cog text-xs text-blue-600"></i>
                          <span className="truncate">{tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin técnico asignado'}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg mt-auto">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {renderStars(servicio.evaluacion.calificacion, false, null, 'small')}
                        </div>
                        {servicio.evaluacion.comentario && (
                          <p className="text-xs text-gray-600 italic text-center line-clamp-2">"{servicio.evaluacion.comentario}"</p>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {servicio.evaluacion.fechaEvaluacion ? new Date(servicio.evaluacion.fechaEvaluacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay servicios */}
      {serviciosPendientesEvaluacion.length === 0 && serviciosEvaluados.length === 0 && (
        <div className="bg-white rounded-lg lg:rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay servicios para evaluar</h3>
          <p className="text-gray-500">Los servicios completados aparecerán aquí para que puedas evaluarlos</p>
        </div>
      )}

      {/* Modal de evaluación - Compacto */}
      <Modal
        isOpen={showEvaluacionModal}
        onClose={() => setShowEvaluacionModal(false)}
        title="Evaluar Servicio"
        size="xs"
      >
        {servicioSeleccionado && (
          <div>
            {/* Info compacta del servicio */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Orden:</span>
                  <span className="font-medium text-gray-800">#{servicioSeleccionado.numeroOrden || servicioSeleccionado.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Servicio:</span>
                  <span className="font-medium text-gray-800">{servicioSeleccionado.tipoServicio}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Completado:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(servicioSeleccionado.fechaCompletado || servicioSeleccionado.fechaProgramada).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Técnico:</span>
                  <span className="font-medium text-gray-800">
                    {data.tecnicos.find(t => t.id === servicioSeleccionado.tecnicoId)?.nombre || 'N/A'} {data.tecnicos.find(t => t.id === servicioSeleccionado.tecnicoId)?.apellido || ''}
                  </span>
                </div>
              </div>
              {servicioSeleccionado.descripcion && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">"{servicioSeleccionado.descripcion}"</p>
                </div>
              )}
            </div>

            {/* Rating simplificado */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                ¿Cómo fue tu experiencia?
              </p>
              <div className="flex justify-center">
                {renderStars(evaluacion.calificacion, true, (rating) => 
                  setEvaluacion({ ...evaluacion, calificacion: rating })
                )}
              </div>
            </div>

            {/* Comentario más pequeño */}
            <div className="mb-4">
              <textarea
                value={evaluacion.comentario}
                onChange={(e) => setEvaluacion({ ...evaluacion, comentario: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows="2"
                placeholder="Comentario opcional..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEvaluacionModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitEvaluacion}
                disabled={evaluacion.calificacion === 0}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
                  evaluacion.calificacion === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Evaluaciones;