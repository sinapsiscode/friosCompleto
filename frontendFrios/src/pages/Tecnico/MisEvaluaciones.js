import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import evaluacionService from '../../services/evaluacion.service';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';
import equipoService from '../../services/equipo.service';

const MisEvaluaciones = () => {
  const { data } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [filterCalificacion, setFilterCalificacion] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [misEvaluaciones, setMisEvaluaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    promedio: 0,
    distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [clientesBackend, setClientesBackend] = useState([]);
  const [equiposBackend, setEquiposBackend] = useState([]);
  
  // Cargar evaluaciones del backend
  useEffect(() => {
    cargarMisEvaluaciones();
  }, []);

  const cargarMisEvaluaciones = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando evaluaciones del técnico...');
      
      // Cargar datos necesarios en paralelo
      const [serviciosRes, clientesRes, equiposRes] = await Promise.all([
        servicioService.getAll({ limit: 100 }),
        clienteService.getAll({ limit: 100 }),
        equipoService.getAll({ limit: 100 })
      ]);
      
      // Guardar clientes y equipos del backend
      setClientesBackend(clientesRes.data || []);
      setEquiposBackend(equiposRes.data || []);
      
      if (serviciosRes.success && serviciosRes.data) {
        // Buscar técnico actual
        const tecnicoActual = data.tecnicos?.find(t => t.userId === user.id) || { id: 1 };
        
        // Filtrar servicios con evaluaciones del técnico actual
        const serviciosConEvaluacion = serviciosRes.data.filter(s => 
          s.tecnicoId === tecnicoActual.id && 
          s.evaluacion && 
          s.evaluacion.calificacion &&
          (s.estado === 'COMPLETADO' || s.estado === 'completado')
        );
        
        console.log('✅ Servicios con evaluación:', serviciosConEvaluacion);
        
        setMisEvaluaciones(serviciosConEvaluacion);
        
        // Calcular estadísticas
        const total = serviciosConEvaluacion.length;
        const promedio = total > 0 
          ? (serviciosConEvaluacion.reduce((sum, s) => sum + s.evaluacion.calificacion, 0) / total)
          : 0;
          
        const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        serviciosConEvaluacion.forEach(s => {
          const cal = s.evaluacion.calificacion;
          if (cal >= 1 && cal <= 5) {
            distribucion[cal]++;
          }
        });
        
        setEstadisticas({
          total,
          promedio: parseFloat(promedio.toFixed(1)),
          distribucion
        });
        
      } else {
        console.error('❌ Error cargando servicios del backend');
        cargarEvaluacionesLocales();
      }
    } catch (error) {
      console.error('❌ Error al cargar evaluaciones:', error);
      cargarEvaluacionesLocales();
    } finally {
      setLoading(false);
    }
  };

  const cargarEvaluacionesLocales = () => {
    // Fallback: buscar técnico actual y usar datos locales
    const tecnicoActual = data.tecnicos.find(t => {
      if (t.usuario && t.usuario.username) {
        return t.usuario.username === user.username;
      }
      if (t.usuario === user.username) {
        return true;
      }
      return false;
    }) || data.tecnicos[0];
    
    if (tecnicoActual) {
      const serviciosConEvaluacion = data.servicios.filter(s => 
        s.tecnicoId === tecnicoActual.id && s.evaluacion
      );
      setMisEvaluaciones(serviciosConEvaluacion);
      
      // Calcular estadísticas locales
      const total = serviciosConEvaluacion.length;
      const promedio = total > 0 
        ? (serviciosConEvaluacion.reduce((sum, s) => sum + s.evaluacion.calificacion, 0) / total).toFixed(1)
        : 0;
        
      setEstadisticas({
        total,
        promedio: parseFloat(promedio),
        distribucion: {
          1: serviciosConEvaluacion.filter(s => s.evaluacion.calificacion === 1).length,
          2: serviciosConEvaluacion.filter(s => s.evaluacion.calificacion === 2).length,
          3: serviciosConEvaluacion.filter(s => s.evaluacion.calificacion === 3).length,
          4: serviciosConEvaluacion.filter(s => s.evaluacion.calificacion === 4).length,
          5: serviciosConEvaluacion.filter(s => s.evaluacion.calificacion === 5).length
        }
      });
    }
  };
  
  // Filtrar evaluaciones por calificación
  const filteredEvaluaciones = misEvaluaciones.filter(servicio => {
    if (filterCalificacion === 'todas') return true;
    const rating = servicio.evaluacion.calificacion;
    switch (filterCalificacion) {
      case 'excelente': return rating === 5;
      case 'buena': return rating === 4;
      case 'regular': return rating === 3;
      case 'mala': return rating <= 2;
      default: return true;
    }
  });

  // Usar estadísticas del backend
  const totalEvaluaciones = estadisticas.total;
  const promedioCalificacion = estadisticas.promedio;
  const distribucionCalificaciones = estadisticas.distribucion;

  // Mostrar loading mientras cargan las evaluaciones
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 animate-fadeIn">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <i className="fas fa-star text-warning text-3xl lg:text-4xl"></i>
              Mis Evaluaciones
            </h1>
            <p className="text-lg text-gray-600">
              Ve las evaluaciones que han hecho los clientes sobre tu trabajo
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-lg text-gray-600">Cargando mis evaluaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
            <i className="fas fa-star text-warning"></i> Mis Evaluaciones
          </h1>
          <p className="text-lg text-gray-600">Revisa las calificaciones recibidas por tus servicios</p>
        </div>
        <div className="flex gap-4 items-center mt-4 lg:mt-0">
          <select 
            value={filterCalificacion} 
            onChange={(e) => setFilterCalificacion(e.target.value)}
            className="w-full lg:min-w-52 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          >
            <option value="todas">Todas las calificaciones</option>
            <option value="excelente">Excelente (5⭐)</option>
            <option value="buena">Buena (4⭐)</option>
            <option value="regular">Regular (3⭐)</option>
            <option value="mala">Mala (1-2⭐)</option>
          </select>
        </div>
      </div>

      {/* Resumen de Evaluaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <i 
                  key={i} 
                  className={`fas fa-star text-sm ${i < Math.round(promedioCalificacion) ? 'text-warning' : 'text-gray-300'} transition-colors`}
                ></i>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-primary mb-4">
            <i className="fas fa-chart-bar text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Total de Evaluaciones</div>
            <div className="text-3xl font-bold text-gray-900">{totalEvaluaciones}</div>
            <p className="text-sm text-gray-600 mt-1">Servicios evaluados</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-success-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-success/10 text-success mb-4">
            <i className="fas fa-smile text-xl"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Satisfacción</div>
            <div className="text-3xl font-bold text-gray-900">
              {totalEvaluaciones > 0 
                ? Math.round((distribucionCalificaciones[5] + distribucionCalificaciones[4]) / totalEvaluaciones * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-600 mt-1">Calificaciones positivas</p>
          </div>
        </div>
      </div>

      {/* Distribución de Calificaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <i className="fas fa-chart-line text-info"></i> Distribución de Calificaciones
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = distribucionCalificaciones[rating];
            const percentage = totalEvaluaciones > 0 ? (count / totalEvaluaciones * 100) : 0;
            
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 min-w-16 font-medium text-gray-700">
                  <span>{rating}</span>
                  <i className="fas fa-star text-warning text-sm"></i>
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-warning to-warning-light transition-all duration-700 flex items-center justify-end pr-3"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 10 && (
                      <span className="text-white text-xs font-medium">{percentage.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
                <span className="min-w-10 text-right font-semibold text-gray-700">{count}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Lista de Evaluaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <i className="fas fa-comments text-info"></i> Evaluaciones Recibidas
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvaluaciones.length > 0 ? (
          filteredEvaluaciones.map(servicio => {
            // Usar clientes y equipos del backend
            const clientesDisponibles = clientesBackend.length > 0 ? clientesBackend : data.clientes;
            const equiposDisponibles = equiposBackend.length > 0 ? equiposBackend : data.equipos;
            
            const cliente = servicio.cliente || clientesDisponibles.find(c => c.id === servicio.clienteId);
            const equipos = equiposDisponibles.filter(e => servicio.equipos?.includes(e.id));
            
            return (
              <div key={servicio.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-white hover:border-warning transition-all duration-300 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-lg"></div>
                
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <i className="fas fa-user-tie text-gray-500"></i> 
                      {cliente?.razonSocial || `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || 'Cliente no encontrado'}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      Servicio - 
                      <i className="fas fa-calendar text-xs text-gray-500 ml-2"></i> 
                      {servicio.fechaProgramada || servicio.fechaCompletado || servicio.fecha 
                        ? new Date(servicio.fechaProgramada || servicio.fechaCompletado || servicio.fecha).toLocaleDateString()
                        : 'Sin fecha'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900 block mb-1">{servicio.evaluacion.calificacion}</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`fas fa-star text-sm ${i < servicio.evaluacion.calificacion ? 'text-warning' : 'text-gray-300'}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                      (servicio.tipoServicio === 'programado' || servicio.tipo === 'preventivo') ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                    }`}>
                      <i className={`fas fa-${(servicio.tipoServicio === 'programado' || servicio.tipo === 'preventivo') ? 'calendar-check' : 'tools'}`}></i> 
                      {servicio.tipoServicio || servicio.tipo || 'Sin tipo'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                      <i className="fas fa-snowflake text-info"></i> {equipos?.length || 0} equipo{(equipos?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {servicio.evaluacion.comentario && (
                    <div className="mb-4">
                      <blockquote className="relative p-4 bg-white rounded-md border-l-4 border-warning italic text-gray-700 leading-relaxed">
                        <i className="fas fa-quote-left absolute top-3 left-3 text-warning/20 text-xl"></i>
                        <div className="pl-6">"{servicio.evaluacion.comentario}"</div>
                      </blockquote>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <i className="fas fa-list text-gray-500"></i> Equipos atendidos:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {equipos.map(equipo => (
                        <span key={equipo.id} className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary-dark rounded-md text-sm font-medium">
                          {equipo.tipo} {equipo.marca} {equipo.modelo}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <i className="fas fa-check-circle text-success"></i> 
                    Evaluado el {servicio.evaluacion.fecha 
                      ? new Date(servicio.evaluacion.fecha).toLocaleDateString()
                      : servicio.fechaCompletado 
                        ? new Date(servicio.fechaCompletado).toLocaleDateString()
                        : 'Fecha no disponible'
                    }
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 px-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center">
              <i className="fas fa-star text-4xl text-warning"></i>
            </div>
            <h3 className="text-xl text-gray-700 font-semibold">No hay evaluaciones para mostrar</h3>
            <p className="text-gray-600">Las evaluaciones de tus servicios aparecerán aquí</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MisEvaluaciones;