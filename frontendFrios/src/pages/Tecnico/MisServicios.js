import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import Modal from '../../components/Common/Modal';
import ServicioDetalleForm from '../../components/Forms/ServicioDetalleForm';
import { showAlert } from '../../utils/sweetAlert';
import servicioService from '../../services/servicio.service';
import tecnicoService from '../../services/tecnico.service';

const MisServicios = () => {
  const { data, updateItem } = useContext(DataContext);
  const { user, useBackend } = useContext(AuthContext);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [servicioToCancel, setServicioToCancel] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [servicios, setServicios] = useState([]);
  const [tecnicoActual, setTecnicoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  
  // Cargar datos del técnico y servicios
  useEffect(() => {
    const loadData = async () => {
      if (useBackend) {
        try {
          setLoading(true);
          
          // Buscar el técnico actual por userId o email
          const tecnicosResult = await tecnicoService.getAll();
          if (tecnicosResult.success) {
            console.log('👥 Técnicos disponibles:', tecnicosResult.data);
            console.log('👤 Usuario actual:', user);
            
            // Buscar técnico por userId, email o username
            const tecnico = tecnicosResult.data.find(t => 
              t.userId === user.id || 
              t.email === user.email || 
              t.email === user.username ||
              (user.username && t.email.includes(user.username))
            );
            
            if (tecnico) {
              console.log('✅ Técnico encontrado:', tecnico);
              setTecnicoActual(tecnico);
              
              // Cargar servicios del técnico
              const serviciosResult = await servicioService.getAll({ tecnicoId: tecnico.id });
              if (serviciosResult.success) {
                console.log('✅ Servicios del técnico cargados:', serviciosResult.data);
                setServicios(serviciosResult.data || []);
              }
            } else {
              console.log('❌ No se encontró técnico para el usuario:', user);
              showAlert('No se pudo encontrar el perfil de técnico asociado', 'warning');
            }
          }
          
          // Cargar clientes y equipos para mostrar información completa
          const [clientesResult, equiposResult] = await Promise.all([
            import('../../services/cliente.service').then(mod => mod.default.getAll()),
            import('../../services/equipo.service').then(mod => mod.default.getAll())
          ]);
          
          if (clientesResult.success) setClientes(clientesResult.data || []);
          if (equiposResult.success) setEquipos(equiposResult.data || []);
          
        } catch (error) {
          console.error('❌ Error cargando datos del técnico:', error);
          showAlert('Error al cargar los servicios', 'error');
        } finally {
          setLoading(false);
        }
      } else {
        // Usar datos estáticos como fallback
        const tecnico = data.tecnicos.find(t => t.usuario === user.username) || data.tecnicos[0];
        setTecnicoActual(tecnico);
        setServicios(data.servicios.filter(s => s.tecnicoId === tecnico.id));
        setClientes(data.clientes);
        setEquipos(data.equipos);
        setLoading(false);
      }
    };
    
    loadData();
  }, [useBackend, user]);
  
  // Filtrar servicios
  const misServicios = servicios;
  
  const filteredServicios = misServicios.filter(servicio => {
    return filterEstado === 'todos' || servicio.estado === filterEstado;
  });

  // Separar por estado (considerar tanto mayúsculas como minúsculas)
  const pendientes = filteredServicios.filter(s => s.estado?.toLowerCase() === 'pendiente');
  console.log('Servicios pendientes:', pendientes);
  const enProceso = filteredServicios.filter(s => s.estado?.toLowerCase() === 'proceso');
  const completados = filteredServicios.filter(s => s.estado?.toLowerCase() === 'completado');
  const cancelados = filteredServicios.filter(s => s.estado?.toLowerCase() === 'cancelado');

  const handleIniciarServicio = async (servicioId) => {
    try {
      if (useBackend) {
        const result = await servicioService.iniciar(servicioId);
        if (result.success) {
          // Actualizar el estado local
          setServicios(prev => prev.map(s => 
            s.id === servicioId 
              ? { ...s, estado: 'PROCESO', fechaInicio: new Date().toISOString() }
              : s
          ));
          showAlert('Servicio iniciado exitosamente', 'success');
        } else {
          showAlert('Error al iniciar el servicio', 'error');
        }
      } else {
        updateItem('servicios', servicioId, { 
          estado: 'proceso',
          horaInicio: new Date().toISOString()
        });
        showAlert('Servicio iniciado exitosamente', 'success');
      }
    } catch (error) {
      console.error('❌ Error al iniciar servicio:', error);
      showAlert('Error al iniciar el servicio', 'error');
    }
  };

  const handleCompletarServicio = (servicio) => {
    setSelectedServicio(servicio);
    setShowModal(true);
  };


  const handleCancelarServicio = (servicio) => {
    setServicioToCancel(servicio);
    setShowCancelConfirm(true);
  };

  const confirmCancelServicio = async () => {
    if (servicioToCancel && motivoCancelacion.trim()) {
      try {
        if (useBackend) {
          const result = await servicioService.cancelar(servicioToCancel.id, motivoCancelacion.trim());
          if (result.success) {
            // Actualizar el estado local
            setServicios(prev => prev.map(s => 
              s.id === servicioToCancel.id 
                ? { 
                    ...s, 
                    estado: 'CANCELADO',
                    fechaCancelado: new Date().toISOString(),
                    motivoCancelacion: motivoCancelacion.trim()
                  }
                : s
            ));
            showAlert('Servicio cancelado exitosamente', 'warning');
          } else {
            showAlert('Error al cancelar el servicio', 'error');
          }
        } else {
          updateItem('servicios', servicioToCancel.id, { 
            estado: 'cancelado',
            fechaCancelado: new Date().toISOString(),
            motivoCancelacion: motivoCancelacion.trim(),
            horaFin: new Date().toISOString()
          });
          showAlert('Servicio cancelado exitosamente', 'warning');
        }
        
        setShowCancelConfirm(false);
        setServicioToCancel(null);
        setMotivoCancelacion('');
      } catch (error) {
        console.error('❌ Error al cancelar servicio:', error);
        showAlert('Error al cancelar el servicio', 'error');
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

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 animate-fadeIn">
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
            <i className="fas fa-clipboard-list text-info"></i> Mis Servicios
          </h1>
          <p className="text-lg text-gray-600">Gestiona tus servicios asignados</p>
        </div>
        <div className="flex gap-4 items-center mt-4 lg:mt-0">
          <select 
            value={filterEstado} 
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full lg:min-w-48 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer transition-all hover:border-primary focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="proceso">En Proceso</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {/* Servicios Pendientes */}
        {pendientes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <i className="fas fa-clock text-warning"></i> Servicios Pendientes
              </h3>
              <span className="px-3 py-1 text-sm font-medium bg-warning/10 text-warning rounded-full">{pendientes.length} servicios</span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendientes.map(servicio => {
                const cliente = clientes.find(c => c.id === servicio.clienteId);
                const servicioEquipos = equipos.filter(e => {
                  // Manejar tanto array de IDs como un solo equipoId
                  if (servicio.equipos) {
                    return servicio.equipos.includes(e.id);
                  } else if (servicio.equipoId) {
                    return e.id === servicio.equipoId;
                  }
                  return false;
                });
                
                return (
                  <div key={servicio.id} className="bg-white border-2 border-gray-200 border-l-warning border-l-4 rounded-lg p-6 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Servicio
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${(servicio.tipoServicio || servicio.tipo) === 'Preventivo' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                          <i className={`fas fa-${(servicio.tipoServicio || servicio.tipo) === 'Preventivo' ? 'shield-alt' : 'tools'}`}></i> {servicio.tipoServicio || servicio.tipo}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${(servicio.prioridad || '').toLowerCase() === 'alta' ? 'bg-danger/10 text-danger' : (servicio.prioridad || '').toLowerCase() === 'media' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-gray-600'}`}>
                          <i className="fas fa-flag"></i> {servicio.prioridad}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-user w-4 text-gray-500"></i>
                        <span>{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <i className="fas fa-calendar w-4 text-gray-500"></i>
                          <span>{servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toLocaleDateString() : 'No programada'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <i className="fas fa-clock w-4 text-gray-500"></i>
                          <span>{servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : 'No programada'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-map-marker-alt w-4 text-gray-500"></i>
                        <span>{cliente?.direccion}, {cliente?.distrito}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">{servicio.descripcion}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Equipos a revisar:</h5>
                      <ul className="space-y-1">
                        {servicioEquipos.map(equipo => (
                          <li key={equipo.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            {equipo.tipo} {equipo.marca} {equipo.modelo} - {equipo.ubicacion}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-200">
                      <button 
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                        onClick={() => handleCancelarServicio(servicio)}
                        title="Cancelar servicio"
                      >
                        <i className="fas fa-times"></i>
                        <span className="hidden sm:inline">Cancelar</span>
                      </button>
                      <button 
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1 text-sm"
                        onClick={() => handleIniciarServicio(servicio.id)}
                        title="Iniciar servicio"
                      >
                        <i className="fas fa-play"></i>
                        <span className="hidden sm:inline">Iniciar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Servicios en Proceso */}
        {enProceso.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <i className="fas fa-wrench text-info"></i> En Proceso
              </h3>
              <span className="px-3 py-1 text-sm font-medium bg-info/10 text-info rounded-full">{enProceso.length} servicios</span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {enProceso.map(servicio => {
                const cliente = clientes.find(c => c.id === servicio.clienteId);
                const servicioEquipos = equipos.filter(e => {
                  if (servicio.equipos) {
                    return servicio.equipos.includes(e.id);
                  } else if (servicio.equipoId) {
                    return e.id === servicio.equipoId;
                  }
                  return false;
                });
                
                return (
                  <div key={servicio.id} className="bg-white border-2 border-gray-200 border-l-info border-l-4 rounded-lg p-6 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-hashtag text-gray-500"></i> Servicio #{servicio.id}
                      </h4>
                      <span className="flex items-center gap-2 text-sm text-info font-medium">
                        <i className="fas fa-clock"></i>
                        {servicio.fechaInicio && (
                          <span>
                            En proceso desde {new Date(servicio.fechaInicio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-user w-4 text-gray-500"></i>
                        <span>{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">{servicio.descripcion}</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-200">
                      <button 
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                        onClick={() => handleCancelarServicio(servicio)}
                        title="Cancelar servicio"
                      >
                        <i className="fas fa-times"></i>
                        <span className="hidden sm:inline">Cancelar</span>
                      </button>
                      <button 
                        className="px-3 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors flex items-center gap-1 text-sm"
                        onClick={() => handleCompletarServicio(servicio)}
                        title="Completar servicio"
                      >
                        <i className="fas fa-check"></i>
                        <span className="hidden sm:inline">Completar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Servicios Completados */}
        {completados.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <i className="fas fa-check-circle text-success"></i> Completados
              </h3>
              <span className="px-3 py-1 text-sm font-medium bg-success/10 text-success rounded-full">{completados.length} servicios</span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {completados.map(servicio => {
                const cliente = clientes.find(c => c.id === servicio.clienteId);
                
                return (
                  <div key={servicio.id} className="bg-white border-2 border-gray-200 border-l-success border-l-4 rounded-lg p-6 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-hashtag text-gray-500"></i> Servicio #{servicio.id}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full flex items-center gap-1">
                        <i className="fas fa-check-circle"></i> {servicio.estado}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-user w-4 text-gray-500"></i>
                        <span>{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-calendar w-4 text-gray-500"></i>
                        <span>{servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toLocaleDateString() : 'No programada'}</span>
                      </div>
                    </div>
                    
                    {servicio.evaluacion && (
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`fas fa-star ${i < servicio.evaluacion.calificacion ? 'text-warning' : 'text-gray-300'}`}
                            ></i>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 italic leading-relaxed">"{servicio.evaluacion.comentario}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Servicios Cancelados */}
        {cancelados.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <i className="fas fa-times-circle text-red-600"></i> Cancelados
              </h3>
              <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">{cancelados.length} servicios</span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cancelados.map(servicio => {
                const cliente = clientes.find(c => c.id === servicio.clienteId);
                
                return (
                  <div key={servicio.id} className="bg-white border-2 border-gray-200 border-l-red-500 border-l-4 rounded-lg p-6 opacity-75">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-hashtag text-gray-500"></i> Servicio #{servicio.id}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                        <i className="fas fa-times-circle"></i> Cancelado
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-user w-4 text-gray-500"></i>
                        <span>{cliente?.razonSocial || `${cliente?.nombre} ${cliente?.apellido}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <i className="fas fa-calendar w-4 text-gray-500"></i>
                        <span>{servicio.fechaProgramada ? new Date(servicio.fechaProgramada).toLocaleDateString() : 'No programada'}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">{servicio.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredServicios.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 text-center py-16 px-6 flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-info/10 rounded-full flex items-center justify-center">
              <i className="fas fa-clipboard-list text-4xl text-info"></i>
            </div>
            <h3 className="text-xl text-gray-700 font-semibold">No hay servicios para mostrar</h3>
            <p className="text-gray-600">Los servicios asignados aparecerán aquí</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Completar Servicio"
        size="large"
      >
        <ServicioDetalleForm 
          servicio={selectedServicio}
          onClose={() => setShowModal(false)}
        />
      </Modal>

      {/* Modal de confirmación de cancelación */}
      {showCancelConfirm && (
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
                    ¿Está seguro que desea cancelar este <strong>Servicio</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {servicioToCancel.descripcion}
                  </p>
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
                  setShowCancelConfirm(false);
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
                Sí, cancelar servicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisServicios;