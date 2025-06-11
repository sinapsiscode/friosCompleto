import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import ServicioModal from '../../components/Forms/ServicioModal';
import CalendarioServicios from '../../components/Common/CalendarioServicios';
import { showConfirm, showAlert } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';
import tecnicoService from '../../services/tecnico.service';

const Servicios = () => {
  const { data, updateItem } = useContext(DataContext);
  
  // Estados para datos desde APIs
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTecnico, setFilterTecnico] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showCalendario, setShowCalendario] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [servicioToAssign, setServicioToAssign] = useState(null);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState('');
  const [sortOrder, setSortOrder] = useState('nearest'); // 'nearest' o 'recent'
  const [filterSinAsignar, setFilterSinAsignar] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [servicioToCancel, setServicioToCancel] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedServicioForDetails, setSelectedServicioForDetails] = useState(null);

  // Cargar datos desde APIs
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('🌐 Cargando servicios desde el backend...');
        setLoading(true);
        setError(null);
        
        // Cargar todos los datos en paralelo
        const [serviciosResponse, clientesResponse, tecnicosResponse] = await Promise.all([
          servicioService.getAll({ limit: 100 }),
          clienteService.getAll({ limit: 100 }),
          tecnicoService.getAll({ limit: 100 })
        ]);
        
        console.log('✅ Servicios cargados:', serviciosResponse.data?.length || 0);
        console.log('✅ Clientes cargados:', clientesResponse.data?.length || 0);
        console.log('✅ Técnicos cargados:', tecnicosResponse.data?.length || 0);
        
        setServicios(serviciosResponse.data || []);
        setClientes(clientesResponse.data || []);
        setTecnicos(tecnicosResponse.data || []);
        
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setError('Error al cargar los datos');
        showAlert('Error al cargar los servicios', 'error');
        
        // Fallback a localStorage si la API falla
        setServicios(data.servicios || []);
        setClientes(data.clientes || []);
        setTecnicos(data.tecnicos || []);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [data.servicios, data.clientes, data.tecnicos]);

  // Función para recargar servicios
  const recargarServicios = async () => {
    try {
      console.log('🔄 Recargando servicios...');
      const response = await servicioService.getAll({ limit: 100 });
      setServicios(response.data || []);
      console.log('✅ Servicios recargados');
    } catch (error) {
      console.error('❌ Error recargando servicios:', error);
    }
  };

  // Usar servicios desde API o fallback a localStorage
  const serviciosActuales = servicios.length > 0 ? servicios : (data.servicios || []);
  const clientesActuales = clientes.length > 0 ? clientes : (data.clientes || []);
  const tecnicosActuales = tecnicos.length > 0 ? tecnicos : (data.tecnicos || []);

  // Primero filtrar los servicios
  const filteredServiciosBase = serviciosActuales.filter(servicio => {
    const cliente = clientesActuales.find(c => c.id === servicio.clienteId);
    const tecnico = tecnicosActuales.find(t => t.id === servicio.tecnicoId);
    const nombreCliente = cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}` || '';
    const nombreTecnico = `${tecnico?.nombre} ${tecnico?.apellido}` || '';
    
    const matchesSearch = nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nombreTecnico.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || servicio.estado === filterEstado;
    const matchesTecnico = filterTecnico === 'todos' || servicio.tecnicoId === parseInt(filterTecnico);
    const matchesSinAsignar = !filterSinAsignar || !servicio.tecnicoId;
    
    return matchesSearch && matchesEstado && matchesTecnico && matchesSinAsignar;
  });

  // Luego ordenar según el criterio seleccionado
  const filteredServicios = [...filteredServiciosBase].sort((a, b) => {
    if (sortOrder === 'nearest') {
      // Ordenar por fecha más cercana (próximas primero)
      return new Date(a.fecha) - new Date(b.fecha);
    } else {
      // Ordenar por último que pidió (más reciente primero)
      return new Date(b.fecha) - new Date(a.fecha);
    }
  });

  const handleNuevoServicio = () => {
    setSelectedServicio(null);
    setShowModal(true);
  };

  const handleEditServicio = (servicio) => {
    setSelectedServicio(servicio);
    setShowModal(true);
  };

  const handleIniciarServicio = async (id) => {
    try {
      console.log('🚀 Iniciando servicio:', id);
      await servicioService.iniciar(id);
      showAlert('Servicio iniciado exitosamente', 'success');
      await recargarServicios();
    } catch (error) {
      console.error('❌ Error al iniciar servicio:', error);
      showAlert('Error al iniciar el servicio', 'error');
    }
  };

  const handleCompletarServicio = async (id) => {
    const result = await showConfirm(
      '¿Completar servicio?',
      '¿Está seguro de marcar este servicio como completado?',
      'Sí, completar',
      'Cancelar'
    );
    
    if (result.isConfirmed) {
      try {
        console.log('✅ Completando servicio:', id);
        await servicioService.completar(id, {
          observacionesFinales: 'Servicio completado desde panel administrativo',
          fechaCompletado: new Date().toISOString()
        });
        showAlert('Servicio completado exitosamente', 'success');
        await recargarServicios();
      } catch (error) {
        console.error('❌ Error al completar servicio:', error);
        showAlert('Error al completar el servicio', 'error');
      }
    }
  };


  const handleCancelarServicio = (servicio) => {
    setServicioToCancel(servicio);
    setShowCancelModal(true);
  };
  
  const confirmCancelServicio = async () => {
    if (servicioToCancel && motivoCancelacion.trim()) {
      try {
        console.log('❌ Cancelando servicio:', servicioToCancel.id);
        await servicioService.cancelar(servicioToCancel.id, motivoCancelacion.trim());
        showAlert('Servicio cancelado exitosamente', 'warning');
        await recargarServicios();
        setShowCancelModal(false);
        setServicioToCancel(null);
        setMotivoCancelacion('');
      } catch (error) {
        console.error('❌ Error al cancelar servicio:', error);
        showAlert('Error al cancelar el servicio', 'error');
      }
    }
  };


  const handleAsignarTecnico = (servicio) => {
    setServicioToAssign(servicio);
    setSelectedTecnicoId(servicio.tecnicoId || '');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (selectedTecnicoId && servicioToAssign) {
      try {
        console.log('👨‍🔧 Asignando técnico:', selectedTecnicoId, 'al servicio:', servicioToAssign.id);
        await servicioService.asignarTecnico(servicioToAssign.id, parseInt(selectedTecnicoId));
        showAlert('Técnico asignado exitosamente', 'success');
        await recargarServicios();
        setShowAssignModal(false);
        setServicioToAssign(null);
        setSelectedTecnicoId('');
      } catch (error) {
        console.error('❌ Error al asignar técnico:', error);
        showAlert('Error al asignar técnico', 'error');
      }
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'completado': return 'success';
      case 'proceso': return 'primary';
      case 'cancelado': return 'danger';
      default: return 'warning';
    }
  };

  const getPrioridadClass = (prioridad) => {
    switch (prioridad) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      default: return 'secondary';
    }
  };

  const handleCalendarDateClick = (date) => {
    console.log('Fecha seleccionada:', date);
  };

  const getProgramacionInfo = (servicio) => {
    if (servicio.tipoServicio === 'Correctivo') {
      return {
        text: 'Única vez',
        icon: 'fa-calendar-day',
        detail: servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : null
      };
    }
    
    const programacion = data.programaciones?.find(
      p => p.clienteId === servicio.clienteId && 
           p.equipos?.some(e => servicio.equipos?.includes(e))
    );
    
    if (!programacion) {
      return { text: '-', icon: null, detail: null };
    }
    
    const frecuenciaMap = {
      'diario': 'Diario',
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual',
      'bimestral': 'Bimestral',
      'trimestral': 'Trimestral',
      'semestral': 'Semestral',
      'anual': 'Anual',
      'personalizado': 'Personalizado'
    };
    
    return {
      text: frecuenciaMap[programacion.frecuencia] || programacion.tipo,
      icon: 'fa-redo',
      detail: null
    };
  };

  const handleViewDetails = (servicio) => {
    setSelectedServicioForDetails(servicio);
    setShowDetailsModal(true);
  };

  // Mostrar loading mientras cargan los datos
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm relative">
        <h2 className="text-2xl text-gray-900 font-semibold m-0 flex items-center gap-4 before:content-[''] before:w-1 before:h-7 before:bg-primary before:rounded-sm">Órdenes de Servicio</h2>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${sortOrder === 'nearest' ? 'bg-white shadow-sm text-primary hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setSortOrder('nearest')}
              title="Ordenar por fecha más cercana"
            >
              <i className="fas fa-sort-amount-down mr-2"></i>
              Más cercano
            </button>
            <button 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${sortOrder === 'recent' ? 'bg-white shadow-sm text-primary hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setSortOrder('recent')}
              title="Ordenar por último solicitado"
            >
              <i className="fas fa-sort-amount-up mr-2"></i>
              Más reciente
            </button>
          </div>
          <button className="btn-calendar" onClick={() => setShowCalendario(true)}>
            <i className="fas fa-calendar"></i> Ver Calendario
          </button>
          <button className="btn-primary-enhanced group" onClick={handleNuevoServicio}>
            <span>
              <i className="fas fa-plus text-lg"></i>
              <span>Nueva Orden de Servicio</span>
            </span>
          </button>
        </div>
      </div>

      {/* Modal del calendario mejorado */}
      {showCalendario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Calendario de Órdenes de Servicio</h2>
                <button
                  onClick={() => setShowCalendario(false)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-500"></i>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 200px)'}}>
              <CalendarioServicios 
                servicios={data.servicios}
                onSelectDate={handleCalendarDateClick}
              />
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Órdenes Pendientes</h4>
                  <p className="text-3xl font-bold text-blue-600">
                    {data.servicios.filter(s => s.estado === 'pendiente').length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">En Proceso</h4>
                  <p className="text-3xl font-bold text-green-600">
                    {data.servicios.filter(s => s.estado === 'proceso').length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Completados este mes</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {data.servicios.filter(s => {
                      const now = new Date();
                      const serviceDate = new Date(s.fecha);
                      return s.estado === 'completado' && 
                             serviceDate.getMonth() === now.getMonth() && 
                             serviceDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Total de órdenes de servicio: <span className="font-semibold">{data.servicios.length}</span>
                </p>
                <button
                  onClick={() => setShowCalendario(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-center bg-white p-6 rounded-xl shadow-sm mb-6 flex-wrap">
        <div className="flex-1 min-w-[300px] relative flex items-center bg-gray-50 rounded-lg py-0 px-4 border border-gray-200 transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-alpha-10)]">
          <i className="fas fa-search text-gray-500 mr-3"></i>
          <input 
            type="text" 
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 bg-transparent py-3 px-0 text-base text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Estado:</label>
          <select 
            value={filterEstado} 
            onChange={(e) => setFilterEstado(e.target.value)}
            className="py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium cursor-pointer transition-all duration-300 min-w-[150px] hover:border-gray-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="proceso">En Proceso</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Técnico:</label>
          <select 
            value={filterTecnico} 
            onChange={(e) => setFilterTecnico(e.target.value)}
            className="py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium cursor-pointer transition-all duration-300 min-w-[150px] hover:border-gray-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-alpha-10)]"
          >
            <option value="todos">Todos</option>
            {tecnicosActuales.map(tecnico => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nombre} {tecnico.apellido}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterSinAsignar}
              onChange={(e) => setFilterSinAsignar(e.target.checked)}
              className="w-4 h-4 text-amber-600 bg-white border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 font-medium">Sin técnico asignado</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gradient-to-b from-gray-50 to-gray-100">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Fecha</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Cliente</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Solicitado por</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Técnico</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Tipo</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Programación</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Prioridad</th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Estado</th>
              <th className="py-4 px-6 text-center font-semibold text-gray-700 text-sm uppercase tracking-wide border-b-2 border-gray-200 whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredServicios.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-16 px-6 text-gray-500">
                  <i className="fas fa-clipboard-list text-5xl mb-4 opacity-50"></i>
                  <p className="text-lg mb-6">No se encontraron órdenes de servicio</p>
                </td>
              </tr>
            ) : (
              filteredServicios.map(servicio => {
              // Usar datos del servicio que vienen con las relaciones incluidas
              const cliente = servicio.cliente || clientesActuales.find(c => c.id === servicio.clienteId);
              const tecnico = servicio.tecnico || tecnicosActuales.find(t => t.id === servicio.tecnicoId);
              const fechaMostrar = servicio.fechaProgramada || servicio.fechaSolicitud;
              
              return (
                <tr key={servicio.id} className="transition-all duration-200 border-b border-gray-100 hover:bg-primary/10 hover:transform hover:translate-x-0.5 last:border-b-0">
                  <td className="py-4 px-6 text-gray-800 text-base">{fechaMostrar ? new Date(fechaMostrar).toLocaleDateString() : 'Sin fecha'}</td>
                  <td className="py-4 px-6 text-gray-800 text-base">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}` || 'Sin cliente'}</td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    {servicio.detalles?.solicitadoPor ? (
                      <span className={`inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-medium ${
                        servicio.detalles.solicitadoPor === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        servicio.detalles.solicitadoPor === 'TECNICO' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <i className={`fas ${
                          servicio.detalles.solicitadoPor === 'ADMIN' ? 'fa-user-shield' :
                          servicio.detalles.solicitadoPor === 'TECNICO' ? 'fa-user-cog' :
                          'fa-user'
                        } text-xs`}></i>
                        {servicio.detalles.solicitadoPor === 'ADMIN' ? 'Administrador' :
                         servicio.detalles.solicitadoPor === 'TECNICO' ? 'Técnico' :
                         'Cliente'}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    {tecnico ? (
                      <span>{`${tecnico.nombre} ${tecnico.apellido}`}</span>
                    ) : (
                      <span className="text-amber-600">Sin asignar</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    <span className={`inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold uppercase tracking-wide leading-none whitespace-nowrap transition-all duration-200 ${servicio.tipoServicio === 'Programado' ? 'bg-info/10 text-info' : servicio.tipoServicio === 'Correctivo' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-700'}`}>
                      {servicio.tipoServicio === 'Programado' && <i className="fas fa-calendar-check text-xs mr-0.5"></i>}
                      {servicio.tipoServicio === 'Correctivo' && <i className="fas fa-wrench text-xs mr-0.5"></i>}
                      {servicio.tipoServicio === 'Preventivo' && <i className="fas fa-shield-alt text-xs mr-0.5"></i>}
                      {servicio.tipoServicio || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    {(() => {
                      const info = getProgramacionInfo(servicio);
                      return (
                        <div>
                          <span className="text-sm text-gray-600">
                            {info.icon && <i className={`fas ${info.icon} text-xs mr-1`}></i>}
                            {info.text}
                          </span>
                          {info.detail && (
                            <span className="block text-xs text-gray-500 mt-1">{info.detail}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    <span className={`inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold uppercase tracking-wide leading-none whitespace-nowrap transition-all duration-200 ${getPrioridadClass(servicio.prioridad) === 'danger' ? 'bg-danger/20 text-danger-dark' : getPrioridadClass(servicio.prioridad) === 'warning' ? 'bg-warning/20 text-warning-dark' : 'bg-gray-200 text-gray-700'}`}>
                      {servicio.prioridad === 'alta' && <i className="fas fa-exclamation-circle text-xs mr-0.5"></i>}
                      {servicio.prioridad === 'media' && <i className="fas fa-exclamation-triangle text-xs mr-0.5"></i>}
                      {servicio.prioridad === 'baja' && <i className="fas fa-info-circle text-xs mr-0.5"></i>}
                      {servicio.prioridad}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-800 text-base">
                    <span className={`inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold uppercase tracking-wide leading-none whitespace-nowrap transition-all duration-200 ${
                      getEstadoClass(servicio.estado) === 'success' ? 'bg-success/20 text-success-dark' : 
                      getEstadoClass(servicio.estado) === 'primary' ? 'bg-blue-100 text-blue-700' : 
                      getEstadoClass(servicio.estado) === 'info' ? 'bg-gray-100 text-gray-700' :
                      getEstadoClass(servicio.estado) === 'danger' ? 'bg-danger/20 text-danger-dark' : 
                      'bg-warning/20 text-warning-dark'
                    }`}>
                      {servicio.estado === 'pendiente' && <i className="fas fa-clock text-xs mr-0.5"></i>}
                      {servicio.estado === 'proceso' && <i className="fas fa-spinner text-xs mr-0.5"></i>}
                      {servicio.estado === 'completado' && <i className="fas fa-check-circle text-xs mr-0.5"></i>}
                      {servicio.estado === 'cancelado' && <i className="fas fa-times-circle text-xs mr-0.5"></i>}
                      {servicio.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center pr-8">
                    <button 
                      className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-primary/10 text-primary cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-primary hover:text-white" 
                      title="Ver detalle"
                      onClick={() => handleEditServicio(servicio)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-amber-500/10 text-amber-600 cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-amber-500 hover:text-white" 
                      title={servicio.tecnicoId ? "Reasignar técnico" : "Asignar técnico"}
                      onClick={() => handleAsignarTecnico(servicio)}
                    >
                      <i className={servicio.tecnicoId ? "fas fa-user-edit" : "fas fa-user-plus"}></i>
                    </button>
                    {servicio.estado === 'pendiente' && (
                      <>
                        <button 
                          className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-info/10 text-info cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-info hover:text-white" 
                          title="Iniciar"
                          onClick={() => handleIniciarServicio(servicio.id)}
                          disabled={!servicio.tecnicoId}
                        >
                          <i className="fas fa-play"></i>
                        </button>
                        <button 
                          className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-red-500/10 text-red-600 cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-red-500 hover:text-white" 
                          title="Cancelar"
                          onClick={() => handleCancelarServicio(servicio)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {servicio.estado === 'proceso' && (
                      <>
                        <button 
                          className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-success/10 text-success cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-success hover:text-white" 
                          title="Completar"
                          onClick={() => handleCompletarServicio(servicio.id)}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button 
                          className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-red-500/10 text-red-600 cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-red-500 hover:text-white" 
                          title="Cancelar"
                          onClick={() => handleCancelarServicio(servicio)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {(servicio.estado === 'completado' || servicio.estado === 'cancelado') && (
                      <button 
                        className="w-9 h-9 inline-flex items-center justify-center border-0 rounded-full bg-info/10 text-info cursor-pointer transition-all duration-200 m-1 text-sm hover:transform hover:-translate-y-0.5 hover:shadow-sm hover:bg-info hover:text-white" 
                        title="Ver detalles del trabajo realizado"
                        onClick={() => handleViewDetails(servicio)}
                      >
                        <i className="fas fa-file-alt"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      <ServicioModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          recargarServicios(); // Recargar después de crear/editar
        }}
        servicio={selectedServicio}
      />

      {/* Modal para asignar técnico */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-fadeIn">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {servicioToAssign?.tecnicoId ? 'Reasignar Técnico' : 'Asignar Técnico'}
            </h3>
            
            {servicioToAssign && (
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Servicio</strong>
                  </p>
                  <p className="text-sm text-gray-700">
                    {servicioToAssign.descripcion}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Fecha: {new Date(servicioToAssign.fecha).toLocaleDateString()}
                  </p>
                  {servicioToAssign.tecnicoId && (
                    <p className="text-xs text-amber-600 mt-1">
                      Técnico actual: {tecnicosActuales.find(t => t.id === servicioToAssign.tecnicoId)?.nombre} {tecnicosActuales.find(t => t.id === servicioToAssign.tecnicoId)?.apellido}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Técnico
              </label>
              <select
                value={selectedTecnicoId}
                onChange={(e) => setSelectedTecnicoId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Seleccione un técnico --</option>
                {tecnicosActuales.map(tecnico => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre} {tecnico.apellido} {tecnico.especialidad ? `- ${tecnico.especialidad}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setServicioToAssign(null);
                  setSelectedTecnicoId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedTecnicoId}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancelar Servicio</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            {servicioToCancel && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    ¿Está seguro que desea cancelar esta <strong>Orden de Servicio</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {servicioToCancel.descripcion}
                  </p>
                  {servicioToCancel.tecnicoId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Técnico asignado: {tecnicosActuales.find(t => t.id === servicioToCancel.tecnicoId)?.nombre} {tecnicosActuales.find(t => t.id === servicioToCancel.tecnicoId)?.apellido}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ingrese el motivo por el cual se cancela el servicio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] resize-none"
                    required
                  />
                  {motivoCancelacion.trim() === '' && (
                    <p className="text-xs text-red-500 mt-1">El motivo es obligatorio</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setServicioToCancel(null);
                  setMotivoCancelacion('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCancelServicio}
                disabled={!motivoCancelacion.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sí, cancelar orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del servicio */}
      {showDetailsModal && selectedServicioForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Detalles de la Orden de Servicio
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedServicioForDetails.estado === 'completado' ? 'Orden completada' : 'Orden cancelada'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-500"></i>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 200px)'}}>
              {(() => {
                const cliente = clientesActuales.find(c => c.id === selectedServicioForDetails.clienteId);
                const tecnico = tecnicosActuales.find(t => t.id === selectedServicioForDetails.tecnicoId);
                const equipos = data.equipos?.filter(e => selectedServicioForDetails.equipos?.includes(e.id)) || [];
                
                return (
                  <div className="space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Cliente:</span> 
                              <span className="ml-2">{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                            </p>
                            {cliente?.ruc && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">RUC:</span> 
                                <span className="ml-2">{cliente.ruc}</span>
                              </p>
                            )}
                            {cliente?.dni && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">DNI:</span> 
                                <span className="ml-2">{cliente.dni}</span>
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Dirección:</span> 
                              <span className="ml-2">{cliente?.direccion}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Teléfono:</span> 
                              <span className="ml-2">{cliente?.telefono}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Técnico Asignado</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Nombre:</span> 
                              <span className="ml-2">{tecnico?.nombre} {tecnico?.apellido}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Especialidad:</span> 
                              <span className="ml-2 capitalize">{tecnico?.especialidad}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Teléfono:</span> 
                              <span className="ml-2">{tecnico?.telefono}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Email:</span> 
                              <span className="ml-2">{tecnico?.email}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles de la Orden</h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Fecha:</span> 
                              <span className="ml-2">{new Date(selectedServicioForDetails.fecha).toLocaleDateString()}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Hora:</span> 
                              <span className="ml-2">{selectedServicioForDetails.hora}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Tipo:</span> 
                              <span className="ml-2 capitalize">{selectedServicioForDetails.tipo}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Prioridad:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedServicioForDetails.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                                selectedServicioForDetails.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedServicioForDetails.prioridad}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Estado:</span> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedServicioForDetails.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {selectedServicioForDetails.estado}
                              </span>
                            </p>
                            {selectedServicioForDetails.fechaCompletado && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Fecha de finalización:</span> 
                                <span className="ml-2">{new Date(selectedServicioForDetails.fechaCompletado).toLocaleDateString()}</span>
                              </p>
                            )}
                            {selectedServicioForDetails.fechaCancelado && (
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Fecha de cancelación:</span> 
                                <span className="ml-2">{new Date(selectedServicioForDetails.fechaCancelado).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {selectedServicioForDetails.motivoCancelacion && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Motivo de Cancelación</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm text-red-700">{selectedServicioForDetails.motivoCancelacion}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción del Trabajo</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{selectedServicioForDetails.descripcion}</p>
                      </div>
                    </div>

                    {/* Equipos trabajados */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Equipos Trabajados</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipos.map(equipo => (
                          <div key={equipo.id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-snowflake text-primary"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{equipo.tipo} {equipo.marca}</h4>
                                <p className="text-sm text-gray-600">Modelo: {equipo.modelo}</p>
                                <p className="text-sm text-gray-600">Serial: {equipo.serial}</p>
                                <p className="text-sm text-gray-600">Ubicación: {equipo.ubicacion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observaciones */}
                    {selectedServicioForDetails.observaciones && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800">{selectedServicioForDetails.observaciones}</p>
                        </div>
                      </div>
                    )}

                    {/* Evaluación del cliente */}
                    {selectedServicioForDetails.evaluacion && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Evaluación del Cliente</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-green-800">Calificación:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`fas fa-star ${i < selectedServicioForDetails.evaluacion.calificacion ? 'text-yellow-400' : 'text-gray-300'}`}
                                ></i>
                              ))}
                              <span className="ml-2 text-green-800 font-bold">
                                {selectedServicioForDetails.evaluacion.calificacion}/5
                              </span>
                            </div>
                          </div>
                          {selectedServicioForDetails.evaluacion.comentario && (
                            <p className="text-green-800 mt-2">
                              <span className="font-medium">Comentario:</span> {selectedServicioForDetails.evaluacion.comentario}
                            </p>
                          )}
                          <p className="text-xs text-green-600 mt-2">
                            Evaluado el {new Date(selectedServicioForDetails.evaluacion.fecha).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fotos del servicio - Antes y Después */}
                    {(selectedServicioForDetails.fotosAntes?.length > 0 || selectedServicioForDetails.fotosDespues?.length > 0 || selectedServicioForDetails.fotos?.length > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Registro Fotográfico del Trabajo</h3>
                        
                        <div className="space-y-6">
                          {/* Fotos de ANTES */}
                          {selectedServicioForDetails.fotosAntes && selectedServicioForDetails.fotosAntes.length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-exclamation-triangle text-red-600 text-xs"></i>
                                </div>
                                Fotos ANTES del Trabajo
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedServicioForDetails.fotosAntes.map((foto, index) => (
                                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg overflow-hidden hover:bg-red-100 transition-colors">
                                    {foto.data ? (
                                      <div className="relative">
                                        <img 
                                          src={foto.data} 
                                          alt={`Antes ${index + 1}`} 
                                          className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(foto.data, '_blank')}
                                        />
                                        <div className="p-2">
                                          <p className="text-xs text-red-700 font-medium truncate">{foto.nombre}</p>
                                          <p className="text-xs text-red-500">Estado inicial</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center">
                                        <i className="fas fa-image text-3xl text-red-400 mb-2"></i>
                                        <p className="text-xs text-red-700 font-medium">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                                        <p className="text-xs text-red-500 mt-1">Estado inicial</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Fotos de DESPUÉS */}
                          {selectedServicioForDetails.fotosDespues && selectedServicioForDetails.fotosDespues.length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <i className="fas fa-check-circle text-green-600 text-xs"></i>
                                </div>
                                Fotos DESPUÉS del Trabajo
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedServicioForDetails.fotosDespues.map((foto, index) => (
                                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg overflow-hidden hover:bg-green-100 transition-colors">
                                    {foto.data ? (
                                      <div className="relative">
                                        <img 
                                          src={foto.data} 
                                          alt={`Después ${index + 1}`} 
                                          className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(foto.data, '_blank')}
                                        />
                                        <div className="p-2">
                                          <p className="text-xs text-green-700 font-medium truncate">{foto.nombre}</p>
                                          <p className="text-xs text-green-500">Trabajo completado</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center">
                                        <i className="fas fa-image text-3xl text-green-400 mb-2"></i>
                                        <p className="text-xs text-green-700 font-medium">{typeof foto === 'string' ? foto : foto.nombre || `Foto ${index + 1}`}</p>
                                        <p className="text-xs text-green-500 mt-1">Trabajo completado</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Fotos del formato anterior (solo nombres) */}
                          {selectedServicioForDetails.fotos && selectedServicioForDetails.fotos.length > 0 && !selectedServicioForDetails.fotosAntes && !selectedServicioForDetails.fotosDespues && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3">Fotos del servicio</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedServicioForDetails.fotos.map((foto, index) => (
                                  <div key={index} className="bg-gray-100 rounded-lg p-4 text-center">
                                    <i className="fas fa-image text-3xl text-gray-400 mb-2"></i>
                                    <p className="text-sm text-gray-600">{foto}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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

export default Servicios;