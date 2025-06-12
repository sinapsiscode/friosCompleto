import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import ServicioModal from '../../components/Forms/ServicioModal';
import OrdenesChart from '../../components/Common/OrdenesChart';
import CalendarioServicios from '../../components/Common/CalendarioServicios';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';
import tecnicoService from '../../services/tecnico.service';
import equipoService from '../../services/equipo.service';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { data } = useContext(DataContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendario, setShowCalendario] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    servicios: [],
    clientes: [],
    tecnicos: [],
    equipos: []
  });

  // Cargar datos del backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Cargar todos los datos en paralelo
        const [serviciosRes, clientesRes, tecnicosRes, equiposRes] = await Promise.all([
          servicioService.getAll({ limit: 100 }),
          clienteService.getAll({ limit: 100 }),
          tecnicoService.getAll({ limit: 100 }),
          equipoService.getAll({ limit: 100 })
        ]);

        console.log('📊 Datos del dashboard cargados:', {
          servicios: serviciosRes.data?.length || 0,
          clientes: clientesRes.data?.length || 0,
          tecnicos: tecnicosRes.data?.length || 0,
          equipos: equiposRes.data?.length || 0
        });

        setEstadisticas({
          servicios: serviciosRes.data || [],
          clientes: clientesRes.data || [],
          tecnicos: tecnicosRes.data || [],
          equipos: equiposRes.data || []
        });
        
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Usar datos del backend en lugar de data.servicios
  const servicios = estadisticas.servicios;
  const clientes = estadisticas.clientes;
  const tecnicos = estadisticas.tecnicos;
  const equipos = estadisticas.equipos;

  const proximosServicios = servicios
    .filter(s => s.estado === 'PENDIENTE')
    .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))
    .slice(0, 5);

  const actividadReciente = servicios
    .map(s => ({ ...s, tipo: 'servicio' }))
    .sort((a, b) => new Date(b.fechaProgramada) - new Date(a.fechaProgramada))
    .slice(0, 5);

  // Calculate programmed vs completed orders for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const ordenesProgramadas = servicios.filter(s => {
    const servicioDate = new Date(s.fechaProgramada);
    return servicioDate.getMonth() === currentMonth && 
           servicioDate.getFullYear() === currentYear &&
           s.tipoServicio === 'programado';
  }).length;
  
  const ordenesRealizadas = servicios.filter(s => {
    const servicioDate = new Date(s.fechaProgramada);
    return servicioDate.getMonth() === currentMonth && 
           servicioDate.getFullYear() === currentYear &&
           s.estado === 'COMPLETADO';
  }).length;

  // Calcular estadísticas
  const serviciosActivos = servicios.filter(s => s.estado !== 'COMPLETADO' && s.estado !== 'CANCELADO').length;
  // Mostrar todos los técnicos como disponibles (sin filtrar por disponibilidad)
  const tecnicosDisponibles = tecnicos.length;
  const clientesActivos = clientes.length; // Mostrar todos los clientes como activos
  const equiposOperativos = equipos.filter(e => e.estadoOperativo === 'operativo' || e.estado === 'operativo').length;
  const equiposTotal = equipos.length;

  // Calcular métricas de rendimiento reales
  const totalOrdenesDelMes = servicios.filter(s => {
    const date = new Date(s.fechaProgramada);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const ordenesCompletadasDelMes = servicios.filter(s => {
    const date = new Date(s.fechaProgramada);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           s.estado === 'COMPLETADO';
  }).length;

  const porcentajeCompletado = totalOrdenesDelMes > 0 ? Math.round((ordenesCompletadasDelMes / totalOrdenesDelMes) * 100) : 0;

  // Calcular tasa de cumplimiento (órdenes a tiempo)
  const ordenesATiempo = servicios.filter(s => {
    const fechaProgramada = new Date(s.fechaProgramada);
    const fechaCompletado = s.fechaCompletado ? new Date(s.fechaCompletado) : null;
    return s.estado === 'COMPLETADO' && 
           fechaCompletado && 
           fechaCompletado <= fechaProgramada;
  }).length;
  
  const totalOrdenesCompletadas = servicios.filter(s => s.estado === 'COMPLETADO').length;
  const tasaCumplimiento = totalOrdenesCompletadas > 0 ? Math.round((ordenesATiempo / totalOrdenesCompletadas) * 100) : 0;

  // Calcular tiempo promedio de respuesta (en horas)
  const serviciosConTiempos = servicios.filter(s => s.fechaSolicitud && s.fechaInicio);
  const tiempoPromedioHoras = serviciosConTiempos.length > 0 ? 
    serviciosConTiempos.reduce((acc, s) => {
      const inicio = new Date(s.fechaInicio);
      const solicitud = new Date(s.fechaSolicitud);
      const diferencia = (inicio - solicitud) / (1000 * 60 * 60); // horas
      return acc + diferencia;
    }, 0) / serviciosConTiempos.length : 0;

  // Calcular satisfacción promedio del cliente
  const evaluacionesConCalificacion = servicios.filter(s => s.evaluacion?.calificacion);
  const satisfaccionPromedio = evaluacionesConCalificacion.length > 0 ?
    evaluacionesConCalificacion.reduce((acc, s) => acc + s.evaluacion.calificacion, 0) / evaluacionesConCalificacion.length : 0;

  const handleNuevoServicio = () => {
    setSelectedServicio(null);
    setShowModal(true);
  };

  const handleViewServicio = (servicio) => {
    setSelectedServicio(servicio);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si se muestra el calendario, renderizar solo el calendario
  if (showCalendario) {
    return (
      <CalendarioServicios 
        servicios={servicios}
        onBack={() => setShowCalendario(false)}
      />
    );
  }

  return (
    <div className="w-full min-h-screen overflow-y-auto pt-4 lg:pt-8 px-4 lg:px-8 pb-4 bg-gray-50 animate-fadeIn">
      <div style={{background: 'linear-gradient(135deg, rgba(0, 119, 204, 0.8), rgba(0, 102, 176, 0.9))'}} className="text-white px-4 lg:px-xl py-6 lg:py-xxl rounded-lg lg:rounded-xxl mb-6 lg:mb-xl flex flex-col lg:flex-row justify-between items-start lg:items-center shadow-lg relative overflow-hidden">
        <div className="absolute -top-1/2 -right-[10%] w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] rounded-full opacity-10" style={{background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)'}}></div>
        <div className="header-content relative z-10 mb-4 lg:mb-0">
          <h1 className="text-2xl lg:text-4xl font-bold m-0 mb-2 lg:mb-xs -tracking-wide text-shadow-md">Panel de Control Administrativo</h1>
          <p className="text-sm lg:text-lg opacity-95 m-0 font-normal text-shadow-sm">Gestión integral de órdenes de servicio de refrigeración</p>
        </div>
        <div className="header-actions relative z-10 w-full lg:w-auto flex gap-3">
          <button 
            className="bg-white/20 border border-white/30 text-white px-4 lg:px-lg py-2 lg:py-sm rounded-md font-medium text-sm cursor-pointer transition-all duration-300 flex items-center justify-center lg:justify-start gap-2 lg:gap-sm hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-md flex-1 lg:flex-none"
            onClick={handleNuevoServicio}
          >
            <i className="fas fa-plus"></i> 
            <span className="lg:inline">Nueva Orden</span>
          </button>
          <button 
            className="bg-white/20 border border-white/30 text-white px-4 lg:px-lg py-2 lg:py-sm rounded-md font-medium text-sm cursor-pointer transition-all duration-300 flex items-center justify-center lg:justify-start gap-2 lg:gap-sm hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-md flex-1 lg:flex-none"
            onClick={() => setShowCalendario(true)}
          >
            <i className="fas fa-calendar-alt"></i> 
            <span className="lg:inline">Calendario</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fadeIn">
        <div className="dashboard-card servicios">
          <div className="card-icon servicios">
            <i className="fas fa-tools"></i>
          </div>
          <div className="card-content">
            <h3 className="card-label">ÓRDENES DE TRABAJO ACTIVAS</h3>
            <div className="card-value">{serviciosActivos}</div>
            <div className="card-metric">
              <span className="card-metric-value positive">
                <i className="fas fa-arrow-up text-xs"></i> +12%
              </span>
              <span className="card-metric-label">vs mes anterior</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card tecnicos">
          <div className="card-icon tecnicos">
            <i className="fas fa-user-cog"></i>
          </div>
          <div className="card-content">
            <h3 className="card-label">TÉCNICOS DISPONIBLES</h3>
            <div className="card-value">{tecnicosDisponibles}</div>
            <div className="card-metric">
              <span className="card-metric-value neutral">{tecnicosDisponibles} de {tecnicos.length}</span>
              <span className="card-metric-label">disponibles</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card clientes">
          <div className="card-icon clientes">
            <i className="fas fa-users"></i>
          </div>
          <div className="card-content">
            <h3 className="card-label">CLIENTES ACTIVOS</h3>
            <div className="card-value">{clientesActivos}</div>
            <div className="card-metric">
              <span className="card-metric-value positive">
                <i className="fas fa-arrow-up text-xs"></i> +5
              </span>
              <span className="card-metric-label">nuevos este mes</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card equipos">
          <div className="card-icon equipos">
            <i className="fas fa-snowflake"></i>
          </div>
          <div className="card-content">
            <h3 className="card-label">EQUIPOS REGISTRADOS</h3>
            <div className="card-value">{equiposTotal}</div>
            <div className="card-metric">
              <span className="card-metric-value neutral">{equiposTotal > 0 ? Math.round((equiposOperativos / equiposTotal) * 100) : 0}%</span>
              <span className="card-metric-label">operativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <OrdenesChart 
          programadas={ordenesProgramadas} 
          realizadas={ordenesRealizadas}
        />
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-light rounded-sm"></div>
            Resumen de Órdenes
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total del Mes</span>
              <span className="text-lg font-bold text-gray-900">{servicios.filter(s => {
                const date = new Date(s.fechaProgramada);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
              }).length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Programadas</span>
              <span className="text-lg font-bold text-blue-900">{ordenesProgramadas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Completadas</span>
              <span className="text-lg font-bold text-green-900">{ordenesRealizadas}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-700">En Proceso</span>
              <span className="text-lg font-bold text-orange-900">{servicios.filter(s => s.estado === 'PROCESO').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-700">Canceladas</span>
              <span className="text-lg font-bold text-red-900">{servicios.filter(s => s.estado === 'CANCELADO').length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-lg mt-6 lg:mt-xxl px-0 lg:px-xl bg-gray-50">
        <div>
          <div className="bg-white rounded-lg lg:rounded-xxl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/20 group">
            <div className="px-4 lg:px-xl pt-4 lg:pt-xl pb-4 lg:pb-lg bg-gradient-to-r from-gray-25 to-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-4 sm:gap-0">
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary-light opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 m-0 -tracking-normal flex items-center gap-2 lg:gap-lg leading-tight">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-light rounded-sm flex-shrink-0"></div>
                Próximas Órdenes de Trabajo
              </h2>
              <button 
                className="text-primary no-underline text-sm font-semibold flex items-center gap-1 transition-all duration-300 px-sm py-sm rounded-md bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/20 hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-white hover:-translate-y-px hover:shadow-md"
                onClick={() => navigate('/servicios')}
              >
                Ver todos <i className="fas fa-arrow-right text-xs"></i>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase">FECHA Y HORA</th>
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase">CLIENTE</th>
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase hidden lg:table-cell">TÉCNICO ASIGNADO</th>
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase">TIPO</th>
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase">ESTADO</th>
                    <th className="px-2 lg:px-md py-2 lg:py-md text-left text-xs font-semibold text-gray-600 tracking-wide border-b-2 border-gray-200 uppercase">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {proximosServicios.map(servicio => {
                    const cliente = servicio.cliente || clientes.find(c => c.id === servicio.clienteId);
                    const tecnico = servicio.tecnico || tecnicos.find(t => t.id === servicio.tecnicoId);
                    return (
                      <tr key={servicio.id} className="transition-all duration-300 border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle">
                          <div className="flex flex-col gap-xs">
                            <div className="font-semibold text-gray-900 text-xs lg:text-sm">{new Date(servicio.fechaProgramada).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-600">{servicio.horaInicio || '09:00'}</div>
                          </div>
                        </td>
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle">
                          <div className="flex flex-col gap-xs">
                            <div className="font-medium text-gray-900 text-xs lg:text-sm truncate max-w-[120px] lg:max-w-none">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-xs lg:hidden">
                              <i className="fas fa-user text-[10px]"></i> {tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'No asignado'}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle hidden lg:table-cell">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {tecnico ? `${tecnico.nombre[0]}${tecnico.apellido[0]}` : 'NA'}
                            </div>
                            <span className="text-sm text-gray-900">{tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'No asignado'}</span>
                          </div>
                        </td>
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle">
                          <span className={`px-xs py-xs rounded-[20px] text-xs font-medium text-transform-capitalize inline-block ${
                            servicio.tipoServicio === 'programado' ? 'bg-info/15 text-info' : 
                            servicio.tipoServicio === 'correctivo' ? 'bg-warning/15 text-warning-dark' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {servicio.tipoServicio === 'programado' ? 'Prog.' : servicio.tipoServicio === 'correctivo' ? 'Corr.' : servicio.tipoServicio}
                          </span>
                        </td>
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle">
                          <span className={`px-xs py-xs rounded-[20px] text-xs font-medium text-transform-capitalize inline-block ${
                            servicio.estado === 'PENDIENTE' ? 'bg-warning/15 text-warning-dark' :
                            servicio.estado === 'PROCESO' ? 'bg-primary/15 text-primary' :
                            servicio.estado === 'COMPLETADO' ? 'bg-success/15 text-success' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {servicio.estado === 'PENDIENTE' ? 'Pend.' : 
                             servicio.estado === 'PROCESO' ? 'Proc.' : 
                             servicio.estado === 'COMPLETADO' ? 'Comp.' : servicio.estado}
                          </span>
                        </td>
                        <td className="px-2 lg:px-md py-2 lg:py-md align-middle">
                          <button 
                            className="bg-transparent border border-gray-300 w-7 h-7 lg:w-8 lg:h-8 rounded-sm flex items-center justify-center cursor-pointer transition-all duration-300 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary" 
                            title="Ver detalles"
                            onClick={() => handleViewServicio(servicio)}
                          >
                            <i className="fas fa-eye text-xs"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg lg:rounded-xxl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/20 group">
            <div className="px-4 lg:px-xl pt-4 lg:pt-xl pb-4 lg:pb-lg bg-gradient-to-r from-gray-25 to-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-4 sm:gap-0">
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary-light opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 m-0 -tracking-normal flex items-center gap-2 lg:gap-lg leading-tight">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-light rounded-sm flex-shrink-0"></div>
                Actividad Reciente
              </h2>
              <button className="bg-gray-50 border border-gray-300 px-xs py-xs rounded-md text-sm font-medium text-gray-700 cursor-pointer transition-all duration-300 flex items-center gap-sm hover:bg-gray-100">
                <i className="fas fa-filter"></i> Todos
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto px-md custom-scrollbar">
              {actividadReciente.map((actividad, index) => (
                <div key={`${actividad.tipo}-${actividad.id}`} className="activity-item">
                  <div className="activity-icon">
                    <i className="fas fa-tools"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-xs">
                      <h4 className="text-sm font-semibold text-gray-900 m-0">
                        {actividad.numeroOrden || 'Orden de Trabajo'}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(actividad.fechaProgramada).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-700 m-0 mb-sm overflow-hidden text-ellipsis whitespace-nowrap">{actividad.descripcion}</p>
                    <div className="flex items-center gap-md">
                      <span className={`text-xs font-medium text-transform-capitalize px-sm py-0.5 rounded-sm ${
                        actividad.estado === 'PENDIENTE' ? 'bg-warning/15 text-warning-dark' :
                        actividad.estado === 'COMPLETADO' ? 'bg-success/15 text-success' :
                        actividad.estado === 'PROCESO' ? 'bg-primary/15 text-primary' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {actividad.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 lg:mt-xl p-4 lg:p-lg pb-4 lg:pb-lg">
        <div className="mb-4 lg:mb-lg p-0 border-0">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 m-0 -tracking-normal flex items-center gap-2 lg:gap-lg leading-tight">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-light rounded-sm flex-shrink-0"></div>
            Métricas de Rendimiento
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-lg">
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h3 className="metric-title">Órdenes del Mes</h3>
              <div className="metric-value">{ordenesCompletadasDelMes}/{totalOrdenesDelMes}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${porcentajeCompletado}%` }}></div>
              </div>
              <div className="flex justify-center items-center gap-2 text-sm">
                <span className="font-medium text-blue-600">{porcentajeCompletado}%</span>
                <span className="text-gray-500">completado</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-check-double"></i>
            </div>
            <div>
              <h3 className="metric-title">Tasa de Cumplimiento</h3>
              <div className="metric-value">{tasaCumplimiento}%</div>
              <div className="text-sm font-medium mb-2 text-blue-600">
                <i className="fas fa-info-circle"></i> A tiempo
              </div>
              <div className="flex justify-center items-center gap-2 text-sm">
                <span className="text-gray-500">{ordenesATiempo} de {totalOrdenesCompletadas}</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-smile"></i>
            </div>
            <div>
              <h3 className="metric-title">Satisfacción Cliente</h3>
              <div className="metric-value">{satisfaccionPromedio > 0 ? satisfaccionPromedio.toFixed(1) : 'N/A'}</div>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star text-base ${i < Math.round(satisfaccionPromedio) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                ))}
              </div>
              <div className="flex justify-center items-center gap-2 text-sm">
                <span className="text-gray-500">{evaluacionesConCalificacion.length} evaluaciones</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <h3 className="metric-title">Tiempo Respuesta</h3>
              <div className="metric-value">{tiempoPromedioHoras > 0 ? `${tiempoPromedioHoras.toFixed(1)}h` : 'N/A'}</div>
              <div className="text-sm font-medium mb-2 text-blue-600">
                <i className="fas fa-info-circle"></i> Promedio
              </div>
              <div className="flex justify-center items-center gap-2 text-sm">
                <span className="text-gray-500">{serviciosConTiempos.length} mediciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServicioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        servicio={selectedServicio}
      />
    </div>
  );
};

export default AdminDashboard;