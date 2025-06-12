import React, { useContext, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';

const HistorialTrabajos = () => {
  const { data } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [filterMes, setFilterMes] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Buscar el técnico actual con lógica mejorada y validación
  const tecnicoActual = data.tecnicos.find(t => {
    // Si tiene usuario.username (estructura del backend)
    if (t.usuario && t.usuario.username) {
      return t.usuario.username === user.username;
    }
    // Si tiene usuario directamente (estructura antigua)
    if (t.usuario === user.username) {
      return true;
    }
    return false;
  }) || data.tecnicos[0] || {
    // Datos estáticos de fallback si no se encuentra técnico
    id: 'tecnico-demo',
    nombre: 'Técnico',
    apellido: 'Demo',
    usuario: { username: user?.username || 'tecnico' },
    especialidad: 'General'
  };
  
  // Obtener servicios completados y cancelados del técnico (con validación)
  const misServiciosHistorial = tecnicoActual && tecnicoActual.id 
    ? data.servicios.filter(s => s.tecnicoId === tecnicoActual.id && (s.estado === 'completado' || s.estado === 'cancelado'))
    : [];

  // Filtrar servicios
  const filteredServicios = misServiciosHistorial.filter(servicio => {
    const matchesTipo = filterTipo === 'todos' || servicio.tipo === filterTipo;
    
    if (filterMes === 'todos') return matchesTipo;
    
    const servicioDate = new Date(servicio.fecha);
    const currentDate = new Date();
    
    switch (filterMes) {
      case 'este-mes':
        return matchesTipo && 
               servicioDate.getMonth() === currentDate.getMonth() &&
               servicioDate.getFullYear() === currentDate.getFullYear();
      case 'mes-pasado':
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        return matchesTipo && 
               servicioDate.getMonth() === lastMonth.getMonth() &&
               servicioDate.getFullYear() === lastMonth.getFullYear();
      case 'ultimos-3':
        const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3);
        return matchesTipo && servicioDate >= threeMonthsAgo;
      default:
        return matchesTipo;
    }
  });

  // Agrupar por mes
  const serviciosPorMes = filteredServicios.reduce((acc, servicio) => {
    const fecha = new Date(servicio.fecha);
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mesNombre = fecha.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    
    if (!acc[mesKey]) {
      acc[mesKey] = {
        nombre: mesNombre,
        servicios: []
      };
    }
    
    acc[mesKey].servicios.push(servicio);
    return acc;
  }, {});

  // Calcular estadísticas
  const totalServicios = filteredServicios.length;
  const serviciosConEvaluacion = filteredServicios.filter(s => s.evaluacion).length;
  const promedioCalificacion = serviciosConEvaluacion > 0
    ? (filteredServicios
        .filter(s => s.evaluacion)
        .reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / serviciosConEvaluacion
      ).toFixed(1)
    : 0;

  const handleShowDetails = (servicio) => {
    setSelectedServicio(servicio);
    setShowDetailsModal(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
            <i className="fas fa-history text-secondary"></i> Historial de Trabajos
          </h1>
          <p className="text-lg text-gray-600">Revisa el registro de todos tus servicios completados</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-center mt-4 lg:mt-0">
          <select 
            value={filterMes} 
            onChange={(e) => setFilterMes(e.target.value)}
            className="w-full lg:min-w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          >
            <option value="todos">Todos los meses</option>
            <option value="este-mes">Este mes</option>
            <option value="mes-pasado">Mes pasado</option>
            <option value="ultimos-3">Últimos 3 meses</option>
          </select>
          <select 
            value={filterTipo} 
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full lg:min-w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          >
            <option value="todos">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>
      </div>

      {/* Estadísticas del Historial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-success-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-success/10 text-success mb-4">
            <i className="fas fa-clipboard-check text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Total de Servicios</div>
            <div className="text-3xl font-bold text-gray-900">{totalServicios}</div>
            <p className="text-sm text-gray-600 mt-1">Trabajos completados</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-warning-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-warning/10 text-warning mb-4">
            <i className="fas fa-star text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Calificación Promedio</div>
            <div className="text-3xl font-bold text-gray-900">
              {promedioCalificacion}
              <span className="text-lg font-normal text-gray-600 ml-1">/5.0</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star text-sm ${i < Math.floor(promedioCalificacion) ? 'text-warning' : 'text-gray-300'}`}></i>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-info-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-info/10 text-info mb-4">
            <i className="fas fa-chart-pie text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Con Evaluación</div>
            <div className="text-3xl font-bold text-gray-900">
              {totalServicios > 0 
                ? Math.round((serviciosConEvaluacion / totalServicios) * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-600 mt-1">Servicios evaluados</p>
          </div>
        </div>
      </div>

      {/* Historial por Mes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <i className="fas fa-calendar-alt text-info"></i> Historial por Mes
          </h3>
        </div>
        <div className="p-6">
        {Object.keys(serviciosPorMes).length > 0 ? (
          Object.entries(serviciosPorMes)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([mesKey, mesData]) => (
              <div key={mesKey} className="mb-12 last:mb-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <i className="fas fa-calendar text-gray-600"></i> {mesData.nombre}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-info/10 text-info rounded-full">{mesData.servicios.length} servicios</span>
                </h3>
                
                <div className="space-y-4">
                  {mesData.servicios.map(servicio => {
                    const cliente = data.clientes.find(c => c.id === servicio.clienteId);
                    const equipos = data.equipos.filter(e => servicio.equipos?.includes(e.id));
                    
                    return (
                      <div key={servicio.id} className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-primary transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-lg"></div>
                        
                        <div className="bg-primary text-white p-3 rounded-lg text-center min-w-16 flex flex-col justify-center shrink-0">
                          <span className="text-xl font-bold leading-none">{new Date(servicio.fecha).getDate()}</span>
                          <span className="text-xs uppercase mt-1 opacity-90">
                            {new Date(servicio.fecha).toLocaleDateString('es', { month: 'short' })}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2 lg:mb-0">
                              {cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${servicio.tipo === 'preventivo' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                                <i className={`fas fa-${servicio.tipo === 'preventivo' ? 'shield-alt' : 'tools'}`}></i> {servicio.tipo}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                servicio.estado === 'completado' ? 'bg-success/10 text-success' : 'bg-red-100 text-red-700'
                              }`}>
                                <i className={`fas fa-${servicio.estado === 'completado' ? 'check-circle' : 'times-circle'}`}></i>
                                {servicio.estado === 'completado' ? 'Completado' : 'Cancelado'}
                              </span>
                              {servicio.evaluacion && (
                                <span className="px-2 py-1 text-xs font-medium bg-warning/10 text-warning rounded-full flex items-center gap-1">
                                  <i className="fas fa-star"></i>
                                  {servicio.evaluacion.calificacion}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 leading-relaxed mb-3">{servicio.descripcion}</p>
                          
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {equipos.slice(0, 2).map(equipo => (
                                <span key={equipo.id} className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary-dark rounded-md text-xs font-medium">
                                  {equipo.tipo} {equipo.marca}
                                </span>
                              ))}
                              {equipos.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                  +{equipos.length - 2} más
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {servicio.horaInicio && (
                                <span>
                                  {new Date(servicio.horaInicio).toLocaleString('es', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleShowDetails(servicio)}
                              className="px-3 py-1.5 text-sm text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <i className="fas fa-eye"></i>
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-16 px-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-history text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl text-gray-700 font-semibold">No hay trabajos completados</h3>
            <p className="text-gray-600">No se encontraron servicios en el período seleccionado</p>
          </div>
        )}
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetailsModal && selectedServicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <i className="fas fa-file-alt text-primary"></i>
                    Detalles del Servicio
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {data.clientes.find(c => c.id === selectedServicio.clienteId)?.razonSocial || 
                     `${data.clientes.find(c => c.id === selectedServicio.clienteId)?.nombre} ${data.clientes.find(c => c.id === selectedServicio.clienteId)?.apellido}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Información básica */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-info-circle text-blue-500"></i>
                    Información del Servicio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tipo:</span>
                      <p className="text-gray-900 capitalize">{selectedServicio.tipo}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Estado:</span>
                      <p className="text-gray-900 capitalize">{selectedServicio.estado}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Fecha:</span>
                      <p className="text-gray-900">{new Date(selectedServicio.fecha).toLocaleDateString('es')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Hora programada:</span>
                      <p className="text-gray-900">{selectedServicio.hora}</p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-700 p-4 bg-gray-50 rounded-lg">{selectedServicio.descripcion}</p>
                </div>

                {/* Equipos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-snowflake text-blue-500"></i>
                    Equipos Atendidos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.equipos.filter(e => selectedServicio.equipos?.includes(e.id)).map(equipo => (
                      <div key={equipo.id} className="p-3 border border-gray-200 rounded-lg">
                        <p className="font-medium text-gray-900">{equipo.tipo} {equipo.marca} {equipo.modelo}</p>
                        <p className="text-sm text-gray-600">Serial: {equipo.serial}</p>
                        <p className="text-sm text-gray-600">Ubicación: {equipo.ubicacion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-clock text-green-500"></i>
                    Tiempos del Servicio
                  </h3>
                  <div className="space-y-2">
                    {selectedServicio.horaInicio && (
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-play-circle text-green-500"></i>
                        <span className="font-medium">Iniciado:</span>
                        <span>{new Date(selectedServicio.horaInicio).toLocaleString('es')}</span>
                      </div>
                    )}
                    {selectedServicio.estado === 'completado' && selectedServicio.fechaCompletado && (
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-stop-circle text-blue-500"></i>
                        <span className="font-medium">Finalizado:</span>
                        <span>{new Date(selectedServicio.fechaCompletado).toLocaleString('es')}</span>
                      </div>
                    )}
                    {selectedServicio.estado === 'cancelado' && selectedServicio.fechaCancelado && (
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-ban text-red-500"></i>
                        <span className="font-medium">Cancelado:</span>
                        <span>{new Date(selectedServicio.fechaCancelado).toLocaleString('es')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Repuestos utilizados */}
                {selectedServicio.detalleServicio?.repuestosUtilizados?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-wrench text-orange-500"></i>
                      Repuestos Utilizados
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedServicio.detalleServicio.repuestosUtilizados.map(repuestoId => {
                        const repuesto = data.repuestos?.find(r => r.id === repuestoId);
                        return repuesto ? (
                          <span key={repuestoId} className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                            {repuesto.nombre}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Motivo de cancelación */}
                {selectedServicio.motivoCancelacion && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                      Motivo de Cancelación
                    </h3>
                    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <p className="text-red-700">{selectedServicio.motivoCancelacion}</p>
                    </div>
                  </div>
                )}

                {/* Trabajos realizados */}
                {selectedServicio.detalleServicio?.trabajosRealizados && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-clipboard-check text-green-500"></i>
                      Trabajos Realizados
                    </h3>
                    <p className="text-gray-700 p-4 bg-gray-50 rounded-lg">{selectedServicio.detalleServicio.trabajosRealizados}</p>
                  </div>
                )}

                {/* Recomendaciones */}
                {selectedServicio.detalleServicio?.recomendaciones && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      Recomendaciones
                    </h3>
                    <p className="text-gray-700 p-4 bg-gray-50 rounded-lg">{selectedServicio.detalleServicio.recomendaciones}</p>
                  </div>
                )}

                {/* Evaluación */}
                {selectedServicio.evaluacion && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-star text-yellow-500"></i>
                      Evaluación del Cliente
                    </h3>
                    <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Calificación:</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`fas fa-star ${i < selectedServicio.evaluacion.calificacion ? 'text-yellow-500' : 'text-gray-300'}`}></i>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({selectedServicio.evaluacion.calificacion}/5)</span>
                      </div>
                      {selectedServicio.evaluacion.comentario && (
                        <p className="text-gray-700 italic">"{selectedServicio.evaluacion.comentario}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Evidencia Fotográfica */}
                {(selectedServicio.fotosAntes?.length > 0 || selectedServicio.fotosDespues?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="fas fa-camera text-purple-500"></i>
                      Evidencia Fotográfica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedServicio.fotosAntes?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Fotos ANTES del servicio</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedServicio.fotosAntes.map((foto, idx) => (
                              <div key={idx} className="relative">
                                <img 
                                  src={foto.data} 
                                  alt={`Antes ${idx + 1}`} 
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(foto.data, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedServicio.fotosDespues?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Fotos DESPUÉS del servicio</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedServicio.fotosDespues.map((foto, idx) => (
                              <div key={idx} className="relative">
                                <img 
                                  src={foto.data} 
                                  alt={`Después ${idx + 1}`} 
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(foto.data, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialTrabajos;