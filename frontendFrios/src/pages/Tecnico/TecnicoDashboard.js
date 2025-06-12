import React, { useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';

const TecnicoDashboard = () => {
  const { data } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  
  // Buscar el técnico actual
  const tecnicoActual = data.tecnicos.find(t => {
    // Si tiene usuario.username (estructura del backend)
    if (t.usuario && t.usuario.username) {
      return t.usuario.username === user.username;
    }
    // Si tiene usuario directamente (estructura antigua)
    if (t.usuario === user.username) {
      return true;
    }
    // Fallback: comparar por ID de usuario si está disponible
    if (t.userId && user.id) {
      return t.userId === user.id;
    }
    return false;
  });
  
  // Si no hay técnico, mostrar mensaje de error
  if (!tecnicoActual) {
    return (
      <div className="w-full min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Técnico no encontrado</h2>
          <p className="text-gray-500">No se encontró información del técnico para el usuario: {user.username}</p>
        </div>
      </div>
    );
  }
  
  // Filtrar servicios del técnico
  const misServicios = data.servicios.filter(s => s.tecnicoId === tecnicoActual.id);
  const pendientes = misServicios.filter(s => s.estado === 'pendiente');
  const enProceso = misServicios.filter(s => s.estado === 'proceso');
  const completados = misServicios.filter(s => s.estado === 'completado');
  
  // Servicios de hoy - incluye pendientes y en proceso
  const hoy = new Date().toISOString().split('T')[0];
  const serviciosHoy = misServicios.filter(s => 
    s.fecha === hoy && (s.estado === 'pendiente' || s.estado === 'proceso')
  );
  
  // Evaluaciones
  const misEvaluaciones = completados.filter(s => s.evaluacion);
  const promedioEvaluacion = misEvaluaciones.length > 0
    ? (misEvaluaciones.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / misEvaluaciones.length).toFixed(1)
    : 0;

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6 animate-fadeIn">
      <div className="bg-gradient-to-br from-info to-info-dark text-white p-4 sm:p-6 lg:p-8 rounded-lg lg:rounded-xl mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 sm:w-60 lg:w-80 h-32 sm:h-60 lg:h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2 flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4">
            <i className="fas fa-tools text-lg sm:text-2xl lg:text-5xl self-start sm:self-center"></i> 
            <span>Panel del Técnico</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg opacity-90">Bienvenido, {tecnicoActual.nombre} {tecnicoActual.apellido}</p>
        </div>
        <div className="flex gap-4 sm:gap-6 lg:gap-8 relative z-10 justify-center sm:justify-start lg:justify-end">
          <div className="text-center">
            <span className="block text-xs sm:text-sm opacity-80 mb-1 uppercase tracking-wide">Servicios hoy</span>
            <span className="text-xl sm:text-2xl lg:text-4xl font-bold">{serviciosHoy.length}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs sm:text-sm opacity-80 mb-1 uppercase tracking-wide">Pendientes</span>
            <span className="text-xl sm:text-2xl lg:text-4xl font-bold">{pendientes.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-whit rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-warning-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-warning/10 text-warning mb-3 sm:mb-4">
            <i className="fas fa-clock text-lg sm:text-xl"></i>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Pendientes</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{pendientes.length}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Servicios por atender</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-primary/10 text-primary mb-3 sm:mb-4">
            <i className="fas fa-wrench text-lg sm:text-xl"></i>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">En Proceso</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{enProceso.length}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Trabajos activos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-success-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-success/10 text-success mb-3 sm:mb-4">
            <i className="fas fa-check-circle text-lg sm:text-xl"></i>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Completados</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{completados.length}</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Este mes</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-warning-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-warning/10 text-warning mb-3 sm:mb-4">
            <i className="fas fa-star text-lg sm:text-xl"></i>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Mi Calificación</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {promedioEvaluacion}
              <span className="text-sm sm:text-lg font-normal text-gray-600 ml-1">/5.0</span>
            </div>
            <div className="flex gap-1 mt-1 sm:mt-2">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star text-xs sm:text-sm ${i < Math.floor(promedioEvaluacion) ? 'text-warning' : 'text-gray-300'} transition-colors`}></i>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2 lg:gap-3">
              <i className="fas fa-calendar-day text-info text-sm sm:text-base"></i> 
              <span className="hidden sm:inline">Servicios de Hoy</span>
              <span className="sm:hidden">Hoy</span>
            </h2>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-info/10 text-info rounded-full">{serviciosHoy.length} servicios</span>
          </div>
          {serviciosHoy.length > 0 ? (
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              {serviciosHoy.map(servicio => {
                const cliente = data.clientes.find(c => c.id === servicio.clienteId);
                return (
                  <div key={servicio.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 bg-white rounded-lg lg:rounded-2xl border border-gray-100 hover:bg-gray-25 hover:shadow-xl hover:border-info/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-info-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg lg:rounded-t-2xl"></div>
                    <div className="flex sm:flex-col items-start sm:items-center relative self-start sm:self-auto">
                      <div className="bg-white p-2 sm:p-3 rounded-md shadow-sm flex items-center gap-1 sm:gap-2 font-medium z-10 border border-gray-200">
                        <i className="fas fa-clock text-info text-sm"></i>
                        <span className="text-xs sm:text-sm lg:text-base">{servicio.hora || '09:00'}</span>
                      </div>
                      <div className="w-full sm:w-0.5 h-0.5 sm:h-full bg-gray-300 sm:absolute sm:top-10 ml-3 sm:ml-0 mt-1 sm:mt-0 flex-1 sm:flex-none"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 lg:mb-4 gap-2 sm:gap-0">
                        <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-tight">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</h4>
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${servicio.tipo === 'preventivo' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                            <i className={`fas fa-${servicio.tipo === 'preventivo' ? 'shield-alt' : 'tools'} mr-1`}></i> 
                            <span className="hidden sm:inline">{servicio.tipo}</span>
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${servicio.prioridad === 'alta' ? 'bg-danger/10 text-danger' : servicio.prioridad === 'media' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-600'}`}>
                            {servicio.prioridad}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2 sm:mb-3 lg:mb-4 leading-relaxed text-xs sm:text-sm lg:text-base line-clamp-2 sm:line-clamp-none">{servicio.descripcion}</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-0">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <i className="fas fa-map-marker-alt text-danger"></i>
                          <span className="truncate">{cliente?.direccion?.split(',')[0] || 'Por definir'}</span>
                        </div>
                        <button className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm lg:text-base w-full sm:w-auto">
                          <i className="fas fa-play"></i> 
                          <span className="hidden sm:inline">Iniciar Servicio</span>
                          <span className="sm:hidden">Iniciar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-16 text-gray-600">No hay servicios programados para hoy</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2 lg:gap-3">
              <i className="fas fa-calendar-alt text-primary text-sm sm:text-base"></i> 
              <span className="hidden sm:inline">Próximos Servicios</span>
              <span className="sm:hidden">Próximos</span>
            </h2>
            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <i className="fas fa-list text-xs sm:text-sm"></i> 
              <span className="hidden sm:inline">Ver todos</span>
              <span className="sm:hidden">Todos</span>
            </button>
          </div>
          <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
            {pendientes.slice(0, 5).map(servicio => {
              const cliente = data.clientes.find(c => c.id === servicio.clienteId);
              return (
                <div key={servicio.id} className="flex gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 border border-gray-100 rounded-lg sm:rounded-xl hover:bg-gray-25 hover:translate-x-1 sm:hover:translate-x-1.5 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg sm:rounded-t-xl"></div>
                  <div className="bg-primary text-white p-2 sm:p-3 rounded-lg text-center min-w-12 sm:min-w-14 lg:min-w-16 flex flex-col justify-center">
                    <div className="text-sm sm:text-lg lg:text-xl font-bold leading-none">{new Date(servicio.fecha).getDate()}</div>
                    <div className="text-xs uppercase mt-0.5 sm:mt-1 opacity-90">
                      {new Date(servicio.fecha).toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</h4>
                    <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2">{servicio.descripcion}</p>
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <i className="fas fa-clock"></i> {servicio.hora || 'Por definir'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <i className="fas fa-map-marker-alt"></i> 
                        <span className="truncate">{cliente?.direccion?.split(',')[0] || 'Lima'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2 lg:gap-3">
            <i className="fas fa-star text-warning text-sm sm:text-base"></i> 
            <span className="hidden sm:inline">Evaluaciones Recientes</span>
            <span className="sm:hidden">Evaluaciones</span>
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{promedioEvaluacion}</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star text-xs sm:text-sm ${i < Math.floor(promedioEvaluacion) ? 'text-warning' : 'text-gray-300'}`}></i>
              ))}
            </div>
          </div>
        </div>
        {misEvaluaciones.length > 0 ? (
          <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {misEvaluaciones.slice(0, 3).map(servicio => {
              const cliente = data.clientes.find(c => c.id === servicio.clienteId);
              return (
                <div key={servicio.id} className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 hover:-translate-y-1 sm:hover:-translate-y-1.5 hover:scale-102 sm:hover:scale-105 hover:shadow-xl hover:bg-gray-25 hover:border-warning/20 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warning to-warning-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg sm:rounded-t-xl"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100 gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</h4>
                      <span className="text-xs text-gray-600">{new Date(servicio.evaluacion.fecha).toLocaleDateString()}</span>
                    </div>
                    <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                      <span className="text-lg sm:text-xl font-bold text-gray-900 sm:block sm:mb-1">{servicio.evaluacion.calificacion}</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`fas fa-star text-xs sm:text-sm ${i < servicio.evaluacion.calificacion ? 'text-warning' : 'text-gray-300'}`}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 italic mb-3 sm:mb-4 p-2 sm:p-3 bg-white rounded-md border-l-4 border-primary line-clamp-2 sm:line-clamp-3">"{servicio.evaluacion.comentario}"</p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-2 sm:gap-0">
                    <span className={`px-2 py-1 rounded-full self-start ${servicio.tipo === 'preventivo' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                      {servicio.tipo}
                    </span>
                    <span className="text-gray-600 text-right">Servicio del {new Date(servicio.fecha).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-16 text-gray-600">No hay evaluaciones recientes</p>
        )}
      </div>
    </div>
  );
};

export default TecnicoDashboard;