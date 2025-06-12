import React, { useContext, useEffect, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import AuthContext from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Common/Modal';
import CalendarioServicios from '../../components/Common/CalendarioServicios';
import servicioService from '../../services/servicio.service';
import clienteService from '../../services/cliente.service';

const ClienteDashboard = () => {
  const { data } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [clienteActual, setClienteActual] = useState(null);
  const [misServicios, setMisServicios] = useState([]);
  const [misEquipos, setMisEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadClienteData = async () => {
      try {
        setLoading(true);
        
        // Cargar información del cliente autenticado
        const miInfo = await clienteService.getMe();
        setClienteActual(miInfo);
        
        // Cargar servicios del cliente
        const servicios = await servicioService.getAll({ clienteId: miInfo.id });
        console.log('🔍 Servicios response:', servicios);
        console.log('📊 Servicios data:', servicios.data);
        console.log('📊 Servicios length:', servicios.data?.length);
        setMisServicios(servicios.data || []);
        
        // Los equipos ya vienen en miInfo
        console.log('🔧 Equipos desde cliente:', miInfo.equipos);
        setMisEquipos(miInfo.equipos || []);
        
      } catch (error) {
        console.error('Error cargando datos del cliente:', error);
        // Fallback a datos estáticos
        const clienteEstatico = {
          id: 'cliente-demo',
          usuario: user?.username || 'cliente',
          nombre: 'Cliente',
          apellido: 'Demo',
          razonSocial: 'Empresa Demo S.A.C.',
          equipos: []
        };
        setClienteActual(clienteEstatico);
        setMisServicios([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadClienteData();
    }
  }, [user]);

  // Mostrar loading mientras carga
  if (loading || !clienteActual) {
    return <div className="p-6">Cargando...</div>;
  }

  // Usar datos cargados del backend
  const tecnicos = data.tecnicos;

  // Estadísticas del cliente
  const serviciosActivos = misServicios.filter(s => s.estado !== 'COMPLETADO' && s.estado !== 'CANCELADO').length;
  const serviciosCompletados = misServicios.filter(s => s.estado === 'COMPLETADO').length;
  const totalEquipos = misEquipos.length;
  const serviciosPendientesEvaluacion = misServicios.filter(s => s.estado === 'COMPLETADO' && !s.evaluacion).length;

  // Próximos servicios - ordenados del más reciente al más antiguo
  const proximosServicios = misServicios
    .filter(s => s.estado === 'PENDIENTE' || s.estado === 'PROCESO')
    .sort((a, b) => new Date(b.fechaProgramada) - new Date(a.fechaProgramada))
    .slice(0, 5);

  return (
    <div className="w-full min-h-screen p-4 lg:p-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 lg:p-10 rounded-xl lg:rounded-3xl mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center shadow-lg relative overflow-hidden gap-4 lg:gap-0 before:content-[''] before:absolute before:-top-1/2 before:-right-[10%] before:w-[300px] lg:before:w-[500px] before:h-[300px] lg:before:h-[500px] before:bg-gradient-radial before:from-white/10 before:to-transparent before:rounded-full">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-4xl font-bold m-0 flex items-center gap-2 lg:gap-4 relative z-10">
            <i className="fas fa-home text-xl lg:text-3xl opacity-90"></i>
            Mi Panel de Control
          </h1>
          <p className="text-sm lg:text-lg mt-2 opacity-90 relative z-10">
            Bienvenido, {clienteActual.razonSocial || `${clienteActual.nombre} ${clienteActual.apellido}`}
          </p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
          <button 
            className="bg-white text-primary px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm w-full lg:w-auto"
            onClick={() => navigate('/solicitar-servicio')}
          >
            <i className="fas fa-plus-circle"></i>
            <span>Solicitar Orden</span>
          </button>
        </div>
      </div>

      {/* Notificación de evaluaciones pendientes - Simplificada */}
      {serviciosPendientesEvaluacion > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-star text-yellow-600"></i>
            <p className="text-sm text-gray-700">
              {serviciosPendientesEvaluacion} evaluaci{serviciosPendientesEvaluacion !== 1 ? 'ones pendientes' : 'ón pendiente'}
            </p>
          </div>
          <button
            onClick={() => navigate('/evaluaciones')}
            className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Evaluar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg group">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-clipboard-list text-2xl text-primary"></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-600 mb-1">Órdenes Activas</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{serviciosActivos}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <i className="fas fa-clock"></i>
              <span>Requieren atención</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg group">
          <div className="w-16 h-16 bg-success/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-check-circle text-2xl text-success"></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-600 mb-1">Completados</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{serviciosCompletados}</div>
            <div className="flex items-center gap-1 text-sm text-success">
              <i className="fas fa-chart-line"></i>
              <span>Últimos 30 días</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-lg group">
          <div className="w-16 h-16 bg-info/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-snowflake text-2xl text-info"></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-600 mb-1">Equipos</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalEquipos}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <i className="fas fa-tools"></i>
              <span>Registrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="xl:col-span-2 bg-white rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 pb-4 border-b border-gray-100 gap-3 sm:gap-0">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2 lg:gap-3">
              <i className="fas fa-calendar-alt"></i>
              Próximas Órdenes de Servicio
            </h2>
            <button 
              className="bg-transparent border border-primary text-primary px-3 lg:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary hover:text-white flex items-center gap-2 text-sm lg:text-base w-full sm:w-auto justify-center sm:justify-start"
              onClick={() => setShowCalendarModal(true)}
            >
              <span className="hidden sm:inline">Ver calendario completo</span>
              <span className="sm:hidden">Ver calendario</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          {proximosServicios.length > 0 ? (
            <div className="flex flex-col gap-4 lg:gap-6">
              {proximosServicios.map(servicio => {
                const tecnico = tecnicos.find(t => t.id === servicio.tecnicoId);
                return (
                  <div key={servicio.id} className="flex flex-col sm:flex-row gap-4 lg:gap-6 relative animate-fadeIn">
                    <div className="flex sm:flex-col items-center sm:items-center flex-shrink-0">
                      <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-3 lg:p-4 rounded-lg text-center min-w-[60px] lg:min-w-[70px] shadow-md relative z-10">
                        <span className="block text-xl lg:text-2xl font-bold leading-none">{new Date(servicio.fechaProgramada).getDate()}</span>
                        <span className="block text-xs mt-1 uppercase tracking-wider">{new Date(servicio.fechaProgramada).toLocaleDateString('es', { month: 'short' }).toUpperCase()}</span>
                      </div>
                      <div className="w-full sm:w-0.5 h-0.5 sm:h-full bg-gray-200 mt-0 sm:mt-2 ml-4 sm:ml-0 flex-1 sm:flex-none relative before:content-[''] before:absolute before:top-0 sm:before:top-0 before:left-1/2 before:w-2 before:h-2 before:bg-primary before:rounded-full before:-translate-x-1/2 hidden sm:block"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 lg:p-6 border-l-0 sm:border-l-4 border-t-4 sm:border-t-0 border-primary transition-all duration-200 hover:shadow-md hover:bg-white">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 lg:mb-4 gap-2 sm:gap-0">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 m-0">{servicio.descripcion}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium self-start ${servicio.tipoServicio === 'programado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {servicio.tipoServicio === 'programado' ? 'Programado' : 'Correctivo'}
                      </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 lg:gap-6 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-clock text-gray-500"></i>
                          <span>{servicio.horaInicio || servicio.rangoHorario || '09:00'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-user-cog text-gray-500"></i>
                          <span>{tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Por asignar'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-snowflake text-gray-500"></i>
                          <span>{servicio.serviciosEquipos?.length || 0} equipos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <i className="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
              <p className="text-lg mb-6">No hay órdenes programadas</p>
              <button 
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2 mx-auto"
                onClick={() => navigate('/cliente/solicitar-servicio')}
              >
                <i className="fas fa-plus"></i>
                <span>Solicitar una orden de servicio</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Panel de Órdenes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Orden de Servicio</h2>
        <p className="text-gray-600 mb-6">Gestiona tus órdenes de servicio</p>
        
        {misServicios.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
            <p className="text-lg text-gray-500 mb-6">No hay órdenes para mostrar</p>
            <p className="text-gray-400 mb-6">Aún no has creado ninguna orden de servicio</p>
            <button 
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-primary-dark flex items-center gap-2 mx-auto"
              onClick={() => navigate('/cliente/solicitar-servicio')}
            >
              <i className="fas fa-plus"></i>
              <span>Crear primera orden</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Programada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {misServicios.map(servicio => {
                  const tecnico = tecnicos.find(t => t.id === servicio.tecnicoId);
                  return (
                    <tr key={servicio.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {servicio.numeroOrden || servicio.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          servicio.tipoServicio === 'programado' ? 'bg-green-100 text-green-800' : 
                          servicio.tipoServicio === 'correctivo' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {servicio.tipoServicio}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(servicio.fechaProgramada).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          servicio.estado === 'PENDIENTE' ? 'bg-gray-100 text-gray-800' : 
                          servicio.estado === 'PROCESO' ? 'bg-blue-100 text-blue-800' :
                          servicio.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {servicio.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Por asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 pb-4 border-b border-gray-100 gap-3 sm:gap-0">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2 lg:gap-3">
            <i className="fas fa-snowflake"></i>
            <span className="hidden sm:inline">Estado de Mis Equipos</span>
            <span className="sm:hidden">Mis Equipos</span>
          </h2>
          <div className="flex gap-3 lg:gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-xs lg:text-sm bg-success/10 text-success px-2 lg:px-3 py-1 rounded-full">
              <i className="fas fa-check-circle"></i>
              <span>{misEquipos.filter(e => e.estadoOperativo === 'operativo').length} <span className="hidden sm:inline">Operativos</span><span className="sm:hidden">OK</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs lg:text-sm bg-warning/10 text-warning px-2 lg:px-3 py-1 rounded-full">
              <i className="fas fa-tools"></i>
              <span>{misEquipos.filter(e => e.estadoOperativo === 'mantenimiento').length} <span className="hidden sm:inline">En mantenimiento</span><span className="sm:hidden">Mant.</span></span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-6">
          {misEquipos.map(equipo => {
            const ultimoServicio = misServicios
              .filter(s => s.equipoId === equipo.id && s.estado === 'COMPLETADO')
              .sort((a, b) => new Date(b.fechaCompletado) - new Date(a.fechaCompletado))[0];
            
            return (
              <div key={equipo.id} className="bg-white border border-gray-100 rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-500 hover:transform hover:-translate-y-1 lg:hover:-translate-y-2 hover:scale-105 hover:shadow-xl relative animate-fadeIn before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-success before:to-success-light before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6 flex justify-between items-center border-b border-gray-100">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center ${equipo.estadoOperativo === 'operativo' ? 'bg-success/10 text-success' : 
                    equipo.estadoOperativo === 'mantenimiento' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                    <i className="fas fa-snowflake text-sm lg:text-base"></i>
                  </div>
                  <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${equipo.estadoOperativo === 'operativo' ? 'bg-success/10 text-success' : 
                    equipo.estadoOperativo === 'mantenimiento' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                    {equipo.estadoOperativo === 'operativo' ? 'Operativo' : 
                     equipo.estadoOperativo === 'mantenimiento' ? 'Mantenimiento' : 'Fuera de Servicio'}
                  </span>
                </div>
                <div className="p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">{equipo.tipo}</h3>
                  <p className="text-sm text-gray-500 mb-3 lg:mb-4">{equipo.marca} {equipo.modelo}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-map-marker-alt text-gray-400 w-4 lg:w-5 text-center"></i>
                      <span className="truncate">{equipo.ubicacion}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-barcode text-gray-400 w-4 lg:w-5 text-center"></i>
                      <span className="truncate">Serie: {equipo.numeroSerie}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-t from-gray-50 to-gray-25 p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-gray-100 gap-2 sm:gap-0">
                  {ultimoServicio ? (
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                      <i className="fas fa-wrench"></i>
                      <span className="hidden sm:inline">Último servicio: {new Date(ultimoServicio.fechaCompletado).toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(ultimoServicio.fechaCompletado).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                      <i className="fas fa-exclamation-circle"></i>
                      <span className="hidden sm:inline">Sin servicios registrados</span>
                      <span className="sm:hidden">Sin servicios</span>
                    </div>
                  )}
                  <button 
                    className="w-7 h-7 lg:w-8 lg:h-8 bg-transparent border border-primary text-primary rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-primary hover:text-white text-xs lg:text-sm self-end sm:self-auto"
                    onClick={() => navigate(`/cliente/equipos/${equipo.id}`)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal del calendario completo */}
      <Modal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Calendario de Órdenes de Servicio"
        size="xl"
      >
        <div className="p-3 lg:p-4">
          <CalendarioServicios 
            servicios={misServicios}
            onSelectDate={(date) => {
              console.log('Fecha seleccionada:', date);
            }}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 lg:mt-6 pt-4 border-t">
            <button
              onClick={() => setShowCalendarModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                setShowCalendarModal(false);
                navigate('/solicitar-servicio');
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              <i className="fas fa-plus"></i>
              <span>Solicitar Orden</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClienteDashboard;